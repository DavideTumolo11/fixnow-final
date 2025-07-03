// contexts/ChatContext.js - Real-time Chat Management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const ChatContext = createContext({});

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
};

// Template messaggi veloci
export const MESSAGE_TEMPLATES = {
    // Tecnico templates
    sto_arrivando: {
        id: 'sto_arrivando',
        contenuto: 'Sto arrivando! Sarò lì in circa {tempo} minuti.',
        category: 'tecnico',
        icon: '🚗',
        variables: ['tempo']
    },
    sono_arrivato: {
        id: 'sono_arrivato',
        contenuto: 'Sono arrivato sul posto. Vi sto chiamando.',
        category: 'tecnico',
        icon: '📍'
    },
    inizio_lavoro: {
        id: 'inizio_lavoro',
        contenuto: 'Ho iniziato il lavoro. Vi terrò aggiornati sui progressi.',
        category: 'tecnico',
        icon: '🔧'
    },
    materiali_necessari: {
        id: 'materiali_necessari',
        contenuto: 'Ho bisogno di procurarmi alcuni materiali. Costo aggiuntivo: €{costo}. Procedo?',
        category: 'tecnico',
        icon: '🛠️',
        variables: ['costo']
    },
    lavoro_completato: {
        id: 'lavoro_completato',
        contenuto: 'Lavoro completato con successo! ✅ Tutto funziona perfettamente.',
        category: 'tecnico',
        icon: '✅'
    },

    // Cliente templates  
    problema_urgente: {
        id: 'problema_urgente',
        contenuto: '⚠️ URGENTE: Il problema si è aggravato. Richiedo intervento immediato.',
        category: 'cliente',
        icon: '⚠️'
    },
    tutto_ok: {
        id: 'tutto_ok',
        contenuto: 'Perfetto, grazie! Tutto funziona bene. 👍',
        category: 'cliente',
        icon: '👍'
    },
    non_funziona: {
        id: 'non_funziona',
        contenuto: 'C\'è ancora qualcosa che non va. Potete controllare nuovamente?',
        category: 'cliente',
        icon: '❌'
    }
};

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [chatState, setChatState] = useState({
        activeChats: {},
        messages: {},
        typingUsers: {},
        unreadCounts: {},
        loading: false,
        error: null
    });

    // Subscription per messaggi real-time
    useEffect(() => {
        if (!user?.id) return;

        console.log('🔄 Setting up chat subscriptions for user:', user.id);

        // Subscription per nuovi messaggi
        const messagesSubscription = supabase
            .channel('chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messaggi',
                    filter: `destinatario_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('📨 New message received:', payload);
                    handleNewMessage(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messaggi',
                    filter: `destinatario_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('📝 Message updated:', payload);
                    handleMessageUpdate(payload.new);
                }
            )
            .subscribe();

        // Subscription per typing indicators
        const typingSubscription = supabase
            .channel('typing_indicators')
            .on('broadcast', { event: 'typing' }, (payload) => {
                handleTypingIndicator(payload);
            })
            .subscribe();

        return () => {
            messagesSubscription.unsubscribe();
            typingSubscription.unsubscribe();
        };
    }, [user?.id]);

    // Gestisce nuovi messaggi in arrivo
    const handleNewMessage = useCallback((message) => {
        const chatId = message.prenotazione_id;

        setChatState(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [chatId]: [...(prev.messages[chatId] || []), message]
            },
            unreadCounts: {
                ...prev.unreadCounts,
                [chatId]: (prev.unreadCounts[chatId] || 0) + 1
            }
        }));

        // Segna automaticamente come letto se chat è attiva
        if (chatState.activeChats[chatId]) {
            markMessageAsRead(message.id);
        }
    }, [chatState.activeChats]);

    // Gestisce aggiornamenti messaggi (es. letto/non letto)
    const handleMessageUpdate = useCallback((message) => {
        const chatId = message.prenotazione_id;

        setChatState(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [chatId]: (prev.messages[chatId] || []).map(msg =>
                    msg.id === message.id ? message : msg
                )
            }
        }));
    }, []);

    // Gestisce indicatori di scrittura
    const handleTypingIndicator = useCallback((payload) => {
        const { bookingId, userId, isTyping, userName } = payload.payload;

        if (userId === user?.id) return; // Ignora i propri typing indicators

        setChatState(prev => ({
            ...prev,
            typingUsers: {
                ...prev.typingUsers,
                [bookingId]: isTyping
                    ? { ...prev.typingUsers[bookingId], [userId]: userName }
                    : Object.fromEntries(
                        Object.entries(prev.typingUsers[bookingId] || {})
                            .filter(([id]) => id !== userId)
                    )
            }
        }));
    }, [user?.id]);

    // Carica cronologia chat
    const loadChatHistory = useCallback(async (bookingId, limit = 50) => {
        try {
            setChatState(prev => ({ ...prev, loading: true }));

            const { data, error } = await supabase
                .from('chat_messaggi')
                .select(`
                    *,
                    mittente:profili!mittente_id(id, nome, cognome, tipo_utente),
                    destinatario:profili!destinatario_id(id, nome, cognome, tipo_utente)
                `)
                .eq('prenotazione_id', bookingId)
                .order('created_at', { ascending: true })
                .limit(limit);

            if (error) {
                throw new Error(`Failed to load chat history: ${error.message}`);
            }

            setChatState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [bookingId]: data || []
                },
                loading: false
            }));

            console.log(`📚 Loaded ${data?.length || 0} messages for booking ${bookingId}`);
            return { success: true, messages: data };

        } catch (error) {
            console.error('❌ Load chat history error:', error);
            setChatState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, []);

    // Invia messaggio di testo
    const sendTextMessage = useCallback(async (bookingId, destinatarioId, contenuto) => {
        try {
            if (!contenuto.trim()) return { success: false, error: 'Messaggio vuoto' };

            const messageData = {
                prenotazione_id: bookingId,
                mittente_id: user.id,
                destinatario_id: destinatarioId,
                contenuto: contenuto.trim(),
                tipo_messaggio: 'testo',
                letto: false
            };

            const { data, error } = await supabase
                .from('chat_messaggi')
                .insert(messageData)
                .select(`
                    *,
                    mittente:profili!mittente_id(id, nome, cognome, tipo_utente),
                    destinatario:profili!destinatario_id(id, nome, cognome, tipo_utente)
                `)
                .single();

            if (error) {
                throw new Error(`Failed to send message: ${error.message}`);
            }

            // Aggiorna state locale immediatamente
            setChatState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [bookingId]: [...(prev.messages[bookingId] || []), data]
                }
            }));

            console.log('✅ Message sent successfully');
            return { success: true, message: data };

        } catch (error) {
            console.error('❌ Send message error:', error);
            return { success: false, error: error.message };
        }
    }, [user?.id]);

    // Invia messaggio template
    const sendTemplateMessage = useCallback(async (bookingId, destinatarioId, templateId, variables = {}) => {
        try {
            const template = MESSAGE_TEMPLATES[templateId];
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }

            // Sostituisce le variabili nel template
            let contenuto = template.contenuto;
            template.variables?.forEach(variable => {
                contenuto = contenuto.replace(`{${variable}}`, variables[variable] || '');
            });

            const messageData = {
                prenotazione_id: bookingId,
                mittente_id: user.id,
                destinatario_id: destinatarioId,
                contenuto,
                tipo_messaggio: 'template',
                template_type: templateId
            };

            const { data, error } = await supabase
                .from('chat_messaggi')
                .insert(messageData)
                .select(`
                    *,
                    mittente:profili!mittente_id(id, nome, cognome, tipo_utente),
                    destinatario:profili!destinatario_id(id, nome, cognome, tipo_utente)
                `)
                .single();

            if (error) {
                throw new Error(`Failed to send template message: ${error.message}`);
            }

            // Aggiorna state locale
            setChatState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [bookingId]: [...(prev.messages[bookingId] || []), data]
                }
            }));

            console.log('✅ Template message sent:', templateId);
            return { success: true, message: data };

        } catch (error) {
            console.error('❌ Send template message error:', error);
            return { success: false, error: error.message };
        }
    }, [user?.id]);

    // Invia foto/media
    const sendMediaMessage = useCallback(async (bookingId, destinatarioId, mediaUri, mediaType = 'foto') => {
        try {
            // In produzione, qui uploaderesti su Cloudinary
            // Per ora simuliamo con un placeholder
            const mediaUrl = `https://placeholder-media.com/${Date.now()}.jpg`;

            const messageData = {
                prenotazione_id: bookingId,
                mittente_id: user.id,
                destinatario_id: destinatarioId,
                contenuto: mediaType === 'foto' ? '📸 Foto' : '🎥 Video',
                tipo_messaggio: mediaType,
                media_url: mediaUrl
            };

            const { data, error } = await supabase
                .from('chat_messaggi')
                .insert(messageData)
                .select(`
                    *,
                    mittente:profili!mittente_id(id, nome, cognome, tipo_utente),
                    destinatario:profili!destinatario_id(id, nome, cognome, tipo_utente)
                `)
                .single();

            if (error) {
                throw new Error(`Failed to send media: ${error.message}`);
            }

            setChatState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [bookingId]: [...(prev.messages[bookingId] || []), data]
                }
            }));

            console.log('✅ Media message sent');
            return { success: true, message: data };

        } catch (error) {
            console.error('❌ Send media error:', error);
            return { success: false, error: error.message };
        }
    }, [user?.id]);

    // Segna messaggio come letto
    const markMessageAsRead = useCallback(async (messageId) => {
        try {
            const { error } = await supabase
                .from('chat_messaggi')
                .update({ letto: true })
                .eq('id', messageId);

            if (error) {
                console.error('❌ Mark as read error:', error);
            }
        } catch (error) {
            console.error('❌ Mark as read error:', error);
        }
    }, []);

    // Segna tutta la chat come letta
    const markChatAsRead = useCallback(async (bookingId) => {
        try {
            const { error } = await supabase
                .from('chat_messaggi')
                .update({ letto: true })
                .eq('prenotazione_id', bookingId)
                .eq('destinatario_id', user.id);

            if (error) {
                console.error('❌ Mark chat as read error:', error);
            } else {
                setChatState(prev => ({
                    ...prev,
                    unreadCounts: {
                        ...prev.unreadCounts,
                        [bookingId]: 0
                    }
                }));
            }
        } catch (error) {
            console.error('❌ Mark chat as read error:', error);
        }
    }, [user?.id]);

    // Invia typing indicator
    const sendTypingIndicator = useCallback(async (bookingId, isTyping) => {
        try {
            await supabase.channel('typing_indicators').send({
                type: 'broadcast',
                event: 'typing',
                payload: {
                    bookingId,
                    userId: user.id,
                    userName: `${user.nome} ${user.cognome}`,
                    isTyping
                }
            });
        } catch (error) {
            console.error('❌ Typing indicator error:', error);
        }
    }, [user?.id, user?.nome, user?.cognome]);

    // Attiva chat (per tracking stato attivo)
    const activateChat = useCallback((bookingId) => {
        setChatState(prev => ({
            ...prev,
            activeChats: {
                ...prev.activeChats,
                [bookingId]: true
            }
        }));

        // Segna messaggi come letti quando si apre la chat
        markChatAsRead(bookingId);
    }, [markChatAsRead]);

    // Disattiva chat
    const deactivateChat = useCallback((bookingId) => {
        setChatState(prev => ({
            ...prev,
            activeChats: {
                ...prev.activeChats,
                [bookingId]: false
            }
        }));
    }, []);

    const contextValue = {
        // State
        chatState,

        // Actions
        loadChatHistory,
        sendTextMessage,
        sendTemplateMessage,
        sendMediaMessage,
        markMessageAsRead,
        markChatAsRead,
        sendTypingIndicator,
        activateChat,
        deactivateChat,

        // Utils
        MESSAGE_TEMPLATES
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;