// screens/ChatScreen.js - Real-time Chat Interface
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
    ActivityIndicator,
    Image
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChat, MESSAGE_TEMPLATES } from '../contexts/ChatContext';

const { width, height } = Dimensions.get('window');

const ChatScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const {
        chatState,
        loadChatHistory,
        sendTextMessage,
        sendTemplateMessage,
        sendMediaMessage,
        activateChat,
        deactivateChat,
        sendTypingIndicator,
        markChatAsRead
    } = useChat();

    // Dati passati dalla schermata precedente
    const { bookingId, technicianId, paymentId, bookingData } = route.params || {};

    const [inputText, setInputText] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUser, setOtherUser] = useState(null);

    const scrollViewRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Determina l'altro utente nella conversazione
    const otherUserId = user?.tipo_utente === 'cliente' ? technicianId : bookingData?.cliente_id;

    // Messages per questa chat specifica
    const messages = chatState.messages[bookingId] || [];
    const typingUsers = chatState.typingUsers[bookingId] || {};

    // Carica dati utente e cronologia chat
    useEffect(() => {
        if (bookingId && otherUserId) {
            activateChat(bookingId);
            loadChatHistory(bookingId);
            loadOtherUserData();
        }

        return () => {
            if (bookingId) {
                deactivateChat(bookingId);
            }
        };
    }, [bookingId, otherUserId]);

    // Auto-scroll ai nuovi messaggi
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    // Carica dati dell'altro utente
    const loadOtherUserData = async () => {
        try {
            // In un'app reale, questo verrebbe dal database
            // Per ora usiamo dati mock basati sul tipo utente
            if (user?.tipo_utente === 'cliente') {
                setOtherUser({
                    id: technicianId,
                    nome: 'Marco',
                    cognome: 'Rossi',
                    tipo_utente: 'tecnico',
                    specializzazione: 'Idraulico',
                    rating: 4.8,
                    online: true
                });
            } else {
                setOtherUser({
                    id: bookingData?.cliente_id,
                    nome: bookingData?.cliente_nome || 'Cliente',
                    cognome: '',
                    tipo_utente: 'cliente',
                    online: true
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    // Gestisce l'invio di messaggi di testo
    const handleSendMessage = async () => {
        if (!inputText.trim() || !otherUserId) return;

        const messageText = inputText.trim();
        setInputText('');

        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            sendTypingIndicator(bookingId, false);
        }

        const result = await sendTextMessage(bookingId, otherUserId, messageText);

        if (!result.success) {
            Alert.alert('Errore', 'Impossibile inviare il messaggio. Riprova.');
            setInputText(messageText); // Ripristina testo se errore
        }
    };

    // Gestisce template messages
    const handleTemplateMessage = async (templateId, variables = {}) => {
        setShowTemplates(false);

        const result = await sendTemplateMessage(bookingId, otherUserId, templateId, variables);

        if (!result.success) {
            Alert.alert('Errore', 'Impossibile inviare il messaggio template.');
        }
    };

    // Gestisce typing indicators
    const handleTextChange = (text) => {
        setInputText(text);

        // Gestisce typing indicator
        if (text.length > 0 && !isTyping) {
            setIsTyping(true);
            sendTypingIndicator(bookingId, true);
        } else if (text.length === 0 && isTyping) {
            setIsTyping(false);
            sendTypingIndicator(bookingId, false);
        }

        // Reset typing dopo 2 secondi di inattività
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                sendTypingIndicator(bookingId, false);
            }
        }, 2000);
    };

    // Simula invio foto
    const handleSendPhoto = () => {
        Alert.alert(
            'Invia Foto',
            'Scegli come inviare la foto',
            [
                { text: 'Fotocamera', onPress: () => sendPhotoDemo('camera') },
                { text: 'Galleria', onPress: () => sendPhotoDemo('gallery') },
                { text: 'Annulla', style: 'cancel' }
            ]
        );
    };

    const sendPhotoDemo = async (source) => {
        // In produzione qui apriresti la fotocamera o galleria
        const result = await sendMediaMessage(bookingId, otherUserId, `demo_${source}_photo.jpg`, 'foto');

        if (!result.success) {
            Alert.alert('Errore', 'Impossibile inviare la foto.');
        }
    };

    // Componente singolo messaggio
    const MessageBubble = ({ message, isOwn }) => {
        const isTemplate = message.tipo_messaggio === 'template';
        const isMedia = message.tipo_messaggio === 'foto' || message.tipo_messaggio === 'video';

        return (
            <View style={[
                styles.messageBubble,
                isOwn ? styles.ownMessage : styles.otherMessage
            ]}>
                {isTemplate && (
                    <View style={styles.templateHeader}>
                        <Text style={styles.templateIcon}>
                            {MESSAGE_TEMPLATES[message.template_type]?.icon || '💬'}
                        </Text>
                        <Text style={styles.templateLabel}>Messaggio Rapido</Text>
                    </View>
                )}

                {isMedia ? (
                    <View style={styles.mediaContainer}>
                        <Text style={styles.mediaPlaceholder}>
                            {message.tipo_messaggio === 'foto' ? '📸' : '🎥'}
                        </Text>
                        <Text style={styles.mediaText}>{message.contenuto}</Text>
                    </View>
                ) : (
                    <Text style={[
                        styles.messageText,
                        isOwn ? styles.ownMessageText : styles.otherMessageText
                    ]}>
                        {message.contenuto}
                    </Text>
                )}

                <View style={styles.messageFooter}>
                    <Text style={[
                        styles.messageTime,
                        isOwn ? styles.ownMessageTime : styles.otherMessageTime
                    ]}>
                        {new Date(message.created_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                    {isOwn && (
                        <Text style={styles.messageStatus}>
                            {message.letto ? '✓✓' : '✓'}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    // Componente template selector
    const TemplateSelector = () => {
        const userTemplates = Object.values(MESSAGE_TEMPLATES).filter(
            template => template.category === user?.tipo_utente || template.category === 'both'
        );

        return (
            <View style={styles.templatesContainer}>
                <View style={styles.templatesHeader}>
                    <Text style={styles.templatesTitle}>Messaggi Rapidi</Text>
                    <TouchableOpacity onPress={() => setShowTemplates(false)}>
                        <Text style={styles.templatesClose}>✕</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {userTemplates.map(template => (
                        <TouchableOpacity
                            key={template.id}
                            style={styles.templateButton}
                            onPress={() => {
                                if (template.variables?.length > 0) {
                                    // Per semplicità, usiamo valori di default
                                    const variables = {};
                                    template.variables.forEach(variable => {
                                        if (variable === 'tempo') variables[variable] = '10';
                                        if (variable === 'costo') variables[variable] = '25';
                                    });
                                    handleTemplateMessage(template.id, variables);
                                } else {
                                    handleTemplateMessage(template.id);
                                }
                            }}
                        >
                            <Text style={styles.templateButtonIcon}>{template.icon}</Text>
                            <Text style={styles.templateButtonText}>
                                {template.contenuto.split('.')[0]}...
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Componente typing indicator
    const TypingIndicator = () => {
        const typingUsersList = Object.values(typingUsers);
        if (typingUsersList.length === 0) return null;

        return (
            <View style={styles.typingContainer}>
                <Text style={styles.typingText}>
                    {typingUsersList[0]} sta scrivendo...
                </Text>
                <View style={styles.typingDots}>
                    <Text style={styles.typingDot}>●</Text>
                    <Text style={styles.typingDot}>●</Text>
                    <Text style={styles.typingDot}>●</Text>
                </View>
            </View>
        );
    };

    if (!otherUser) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Caricamento chat...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>
                        {otherUser.nome} {otherUser.cognome}
                    </Text>
                    <View style={styles.headerStatus}>
                        <View style={[
                            styles.onlineIndicator,
                            { backgroundColor: otherUser.online ? '#4CAF50' : '#ccc' }
                        ]} />
                        <Text style={styles.headerStatusText}>
                            {otherUser.online ? 'Online' : 'Offline'}
                            {otherUser.specializzazione && ` • ${otherUser.specializzazione}`}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.phoneButton}>
                    <Text style={styles.phoneButtonText}>📞</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyChat}>
                            <Text style={styles.emptyChatText}>
                                👋 Inizia la conversazione con {otherUser.nome}!
                            </Text>
                            <Text style={styles.emptyChatSubtext}>
                                Puoi inviare messaggi, foto e usare i template rapidi.
                            </Text>
                        </View>
                    ) : (
                        messages.map((message, index) => (
                            <MessageBubble
                                key={message.id || index}
                                message={message}
                                isOwn={message.mittente_id === user?.id}
                            />
                        ))
                    )}

                    <TypingIndicator />
                </ScrollView>

                {/* Template Selector */}
                {showTemplates && <TemplateSelector />}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputRow}>
                        <TouchableOpacity
                            style={styles.attachButton}
                            onPress={handleSendPhoto}
                        >
                            <Text style={styles.attachButtonText}>📎</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.templateToggleButton}
                            onPress={() => setShowTemplates(!showTemplates)}
                        >
                            <Text style={styles.templateToggleText}>⚡</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={handleTextChange}
                            placeholder="Scrivi un messaggio..."
                            placeholderTextColor="#999"
                            multiline
                            maxLength={500}
                        />

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                inputText.trim() ? styles.sendButtonActive : {}
                            ]}
                            onPress={handleSendMessage}
                            disabled={!inputText.trim()}
                        >
                            <Text style={styles.sendButtonText}>
                                {inputText.trim() ? '➤' : '🎤'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backButtonText: {
        fontSize: 20,
        color: '#333',
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    headerStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    headerStatusText: {
        fontSize: 12,
        color: '#666',
    },
    phoneButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    phoneButtonText: {
        fontSize: 20,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingVertical: 16,
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyChatText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyChatSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    messageBubble: {
        maxWidth: width * 0.75,
        marginVertical: 4,
        padding: 12,
        borderRadius: 16,
    },
    ownMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    templateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        opacity: 0.8,
    },
    templateIcon: {
        fontSize: 12,
        marginRight: 6,
    },
    templateLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        color: 'white',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    ownMessageText: {
        color: 'white',
    },
    otherMessageText: {
        color: '#333',
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    messageTime: {
        fontSize: 12,
        opacity: 0.7,
    },
    ownMessageTime: {
        color: 'white',
    },
    otherMessageTime: {
        color: '#666',
    },
    messageStatus: {
        fontSize: 12,
        color: 'white',
        opacity: 0.7,
    },
    mediaContainer: {
        alignItems: 'center',
        padding: 8,
    },
    mediaPlaceholder: {
        fontSize: 32,
        marginBottom: 4,
    },
    mediaText: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
    },
    typingText: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    typingDots: {
        flexDirection: 'row',
    },
    typingDot: {
        fontSize: 8,
        color: '#666',
        marginHorizontal: 1,
        opacity: 0.6,
    },
    templatesContainer: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
        maxHeight: 120,
    },
    templatesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    templatesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    templatesClose: {
        fontSize: 18,
        color: '#666',
    },
    templateButton: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 8,
        marginVertical: 8,
        minWidth: 120,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e1e8ed',
    },
    templateButtonIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    templateButtonText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
    },
    inputContainer: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    attachButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    attachButtonText: {
        fontSize: 16,
    },
    templateToggleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    templateToggleText: {
        fontSize: 16,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 8,
        backgroundColor: '#f8f9fa',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e1e8ed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonActive: {
        backgroundColor: '#007AFF',
    },
    sendButtonText: {
        fontSize: 16,
        color: 'white',
    },
});

export default ChatScreen;