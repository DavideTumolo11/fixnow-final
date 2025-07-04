// contexts/AuthContext.js - SISTEMA AUTENTICAZIONE COMPLETO CORRETTO
// FixNow Sardegna - Enterprise Grade Authentication
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient';

// 🎯 CONFIGURAZIONE AUTH
const AUTH_CONFIG = {
    emailVerificationRequired: true,
    passwordMinLength: 6,
    sessionPersistence: true,
    autoRefresh: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15
};

// 📋 TIPI UTENTE
export const USER_TYPES = {
    CLIENTE: 'cliente',
    TECNICO: 'tecnico',
    HOTEL: 'hotel',
    ADMIN: 'admin'
};

// 🔐 STATI ONBOARDING
export const ONBOARDING_STATES = {
    NOT_STARTED: 'not_started',
    PROFILE_CREATED: 'profile_created',
    DOCUMENTS_PENDING: 'documents_pending',
    VERIFICATION_PENDING: 'verification_pending',
    COMPLETED: 'completed'
};

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // 🎯 STATO PRINCIPALE
    const [authState, setAuthState] = useState({
        // Utente e sessione
        user: null,
        profile: null,
        session: null,

        // Stati di caricamento
        loading: false,
        initializing: true,
        refreshing: false,

        // Gestione errori
        error: null,
        loginAttempts: 0,
        lockedUntil: null,

        // Onboarding e verifiche
        onboardingState: ONBOARDING_STATES.NOT_STARTED,
        needsEmailVerification: false,
        needsDocumentVerification: false,

        // Permissions e sicurezza
        permissions: [],
        lastActivity: null,
        deviceInfo: null
    });

    // 👤 CARICA PROFILO UTENTE - DEFINITA PRIMA DI TUTTO
    const loadUserProfile = async (userId) => {
        try {
            if (!userId) {
                console.log('❌ No userId provided to loadUserProfile');
                return null;
            }

            console.log('🔍 Loading profile for user:', userId);

            // Query semplificata senza join
            const { data: profile, error } = await supabase
                .from('profili')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('👤 Profile not found - first time user');
                    return null;
                }
                console.error('❌ Profile loading error:', error);
                return null;
            }

            console.log('✅ Profile loaded:', profile.nome, profile.tipo_utente);
            return profile;

        } catch (error) {
            console.error('❌ Profile loading failed:', error);
            return null;
        }
    };

    // 🏗️ FUNZIONI HELPER
    const determineOnboardingState = (user, profile) => {
        if (!profile) return ONBOARDING_STATES.NOT_STARTED;
        if (!user.email_confirmed_at) return ONBOARDING_STATES.PROFILE_CREATED;
        if (profile.tipo_utente === 'tecnico' && !profile.documenti_verificati) {
            return ONBOARDING_STATES.DOCUMENTS_PENDING;
        }
        if (!profile.profilo_verificato) return ONBOARDING_STATES.VERIFICATION_PENDING;
        return ONBOARDING_STATES.COMPLETED;
    };

    const calculatePermissions = (profile) => {
        const permissions = ['read_own_data'];

        switch (profile?.tipo_utente) {
            case USER_TYPES.TECNICO:
                permissions.push('accept_bookings', 'view_client_data', 'update_booking_status');
                break;
            case USER_TYPES.HOTEL:
                permissions.push('create_bookings', 'manage_contracts', 'view_analytics');
                break;
            case USER_TYPES.CLIENTE:
                permissions.push('create_bookings', 'rate_technicians');
                break;
            case USER_TYPES.ADMIN:
                permissions.push('manage_users', 'view_all_data', 'manage_disputes');
                break;
        }

        return permissions;
    };

    // 🔄 GESTIONE STATO AUTH
    const handleAuthStateChange = async (session) => {
        try {
            if (!session?.user) {
                handleSignOut();
                return;
            }

            setAuthState(prev => ({
                ...prev,
                loading: true,
                user: session.user,
                session
            }));

            console.log('🔄 Handling auth state change for:', session.user.email);

            // Carica profilo utente
            const profile = await loadUserProfile(session.user.id);

            if (profile) {
                // Determina stato onboarding
                const onboardingState = determineOnboardingState(session.user, profile);

                setAuthState(prev => ({
                    ...prev,
                    profile,
                    onboardingState,
                    needsEmailVerification: !session.user.email_confirmed_at,
                    needsDocumentVerification: profile.tipo_utente === 'tecnico' && !profile.documenti_verificati,
                    permissions: calculatePermissions(profile),
                    lastActivity: new Date(),
                    loading: false,
                    initializing: false,
                    error: null
                }));

                console.log('✅ Auth state updated with profile');
            } else {
                // Profilo non trovato - possibile primo accesso
                setAuthState(prev => ({
                    ...prev,
                    profile: null,
                    onboardingState: ONBOARDING_STATES.NOT_STARTED,
                    needsEmailVerification: !session.user.email_confirmed_at,
                    loading: false,
                    initializing: false,
                    error: null
                }));

                console.log('⚠️ No profile found - first time user');
            }

        } catch (error) {
            console.error('❌ Auth state change failed:', error);
            setAuthState(prev => ({
                ...prev,
                loading: false,
                initializing: false,
                error: error.message
            }));
        }
    };

    const handleSignOut = () => {
        setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initializing: false,
            refreshing: false,
            error: null,
            loginAttempts: 0,
            lockedUntil: null,
            onboardingState: ONBOARDING_STATES.NOT_STARTED,
            needsEmailVerification: false,
            needsDocumentVerification: false,
            permissions: [],
            lastActivity: null,
            deviceInfo: null
        });
        console.log('👋 User signed out');
    };

    // 🔄 INIZIALIZZAZIONE - Controlla sessione esistente
    const initializeAuth = async () => {
        try {
            console.log('🔐 Initializing authentication...');

            // Controlla sessione esistente
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth session error:', error);
                setAuthState(prev => ({
                    ...prev,
                    initializing: false,
                    error: error.message
                }));
                return;
            }

            if (session?.user) {
                console.log('✅ Existing session found');
                await handleAuthStateChange(session);
            } else {
                console.log('👤 No existing session');
                setAuthState(prev => ({
                    ...prev,
                    initializing: false
                }));
            }

        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            setAuthState(prev => ({
                ...prev,
                initializing: false,
                error: error.message
            }));
        }
    };

    // 👂 LISTENER - Monitora cambiamenti autenticazione
    const setupAuthListener = () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 Auth state changed:', event);

                switch (event) {
                    case 'SIGNED_IN':
                        await handleAuthStateChange(session);
                        break;
                    case 'SIGNED_OUT':
                        handleSignOut();
                        break;
                    case 'TOKEN_REFRESHED':
                        console.log('🔄 Token refreshed');
                        break;
                    case 'USER_UPDATED':
                        if (session?.user?.id) {
                            const profile = await loadUserProfile(session.user.id);
                            if (profile) {
                                setAuthState(prev => ({ ...prev, profile }));
                            }
                        }
                        break;
                }
            }
        );

        return () => subscription?.unsubscribe();
    };

    // 🔄 INIZIALIZZAZIONE useEffect
    useEffect(() => {
        initializeAuth();
        const cleanup = setupAuthListener();
        return cleanup;
    }, []);

    // 📝 REGISTRAZIONE UTENTE
    const signUp = useCallback(async (email, password, userData) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            // Validazione input
            if (!email || !password || !userData.nome || !userData.tipo_utente) {
                throw new Error('Tutti i campi obbligatori devono essere compilati');
            }

            if (password.length < AUTH_CONFIG.passwordMinLength) {
                throw new Error(`La password deve essere di almeno ${AUTH_CONFIG.passwordMinLength} caratteri`);
            }

            if (!Object.values(USER_TYPES).includes(userData.tipo_utente)) {
                throw new Error('Tipo utente non valido');
            }

            console.log('📝 Creating user account...');

            // 1. Crea account Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password,
                options: {
                    data: {
                        nome: userData.nome,
                        cognome: userData.cognome || '',
                        tipo_utente: userData.tipo_utente
                    }
                }
            });

            if (authError) {
                throw authError;
            }

            if (!authData.user) {
                throw new Error('Errore durante la creazione dell\'account');
            }

            console.log('✅ Auth account created');

            // 2. Crea profilo nel database
            const profileData = {
                id: authData.user.id,
                email: email.toLowerCase().trim(),
                nome: userData.nome.trim(),
                cognome: userData.cognome?.trim() || '',
                telefono: userData.telefono?.trim() || null,
                tipo_utente: userData.tipo_utente,

                // Campi specifici per tipo utente
                ...(userData.tipo_utente === USER_TYPES.HOTEL && {
                    nome_struttura: userData.nome_struttura,
                    tipologia_struttura: userData.tipologia_struttura,
                    numero_camere: userData.numero_camere,
                    stelle: userData.stelle
                }),

                ...(userData.tipo_utente === USER_TYPES.TECNICO && {
                    specializzazioni: userData.specializzazioni || [],
                    descrizione_servizi: userData.descrizione_servizi,
                    raggio_azione_km: userData.raggio_azione_km || 30
                }),

                // Stato iniziale
                email_verificata: false,
                profilo_verificato: false,
                documenti_verificati: false,
                created_at: new Date().toISOString()
            };

            const { error: profileError } = await supabase
                .from('profili')
                .insert(profileData);

            if (profileError) {
                console.error('❌ Profile creation failed:', profileError);
                // Non blocchiamo per errori profilo - l'utente esiste in Auth
            } else {
                console.log('✅ Profile created successfully');
            }

            setAuthState(prev => ({ ...prev, loading: false }));

            return {
                success: true,
                user: authData.user,
                needsEmailVerification: !authData.user.email_confirmed_at
            };

        } catch (error) {
            console.error('❌ SignUp failed:', error);
            setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
            return { success: false, error: error.message };
        }
    }, []);

    // 🔑 LOGIN UTENTE
    const signIn = useCallback(async (email, password) => {
        try {
            // Controlla lockout
            if (authState.lockedUntil && new Date() < authState.lockedUntil) {
                const remainingMinutes = Math.ceil((authState.lockedUntil - new Date()) / 60000);
                throw new Error(`Account bloccato. Riprova tra ${remainingMinutes} minuti.`);
            }

            setAuthState(prev => ({ ...prev, loading: true, error: null }));

            console.log('🔑 Signing in user...');

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            });

            if (error) {
                // Incrementa tentativi falliti
                const newAttempts = authState.loginAttempts + 1;
                const shouldLock = newAttempts >= AUTH_CONFIG.maxLoginAttempts;

                setAuthState(prev => ({
                    ...prev,
                    loginAttempts: newAttempts,
                    lockedUntil: shouldLock ?
                        new Date(Date.now() + AUTH_CONFIG.lockoutDurationMinutes * 60000) :
                        null,
                    loading: false
                }));

                if (shouldLock) {
                    throw new Error(`Troppi tentativi falliti. Account bloccato per ${AUTH_CONFIG.lockoutDurationMinutes} minuti.`);
                }

                throw error;
            }

            // Reset contatori su login riuscito
            setAuthState(prev => ({
                ...prev,
                loginAttempts: 0,
                lockedUntil: null,
                loading: false
            }));

            console.log('✅ Login successful');
            return { success: true, user: data.user };

        } catch (error) {
            console.error('❌ SignIn failed:', error);
            setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
            return { success: false, error: error.message };
        }
    }, [authState.loginAttempts, authState.lockedUntil]);

    // 🚪 LOGOUT
    const signOut = useCallback(async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true }));

            console.log('🚪 Signing out...');

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('SignOut error:', error);
            }

            handleSignOut();

        } catch (error) {
            console.error('❌ SignOut failed:', error);
            // Force logout anche in caso di errore
            handleSignOut();
        }
    }, []);

    // 🔄 RESET PASSWORD
    const resetPassword = useCallback(async (email) => {
        try {
            console.log('🔄 Sending reset password email...');

            const { error } = await supabase.auth.resetPasswordForEmail(
                email.toLowerCase().trim(),
                {
                    redirectTo: 'fixnow://reset-password'
                }
            );

            if (error) {
                throw error;
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Reset password failed:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // 📝 AGGIORNA PROFILO
    const updateProfile = useCallback(async (updates) => {
        try {
            if (!authState.user?.id) {
                throw new Error('Utente non autenticato');
            }

            setAuthState(prev => ({ ...prev, loading: true }));

            const { data, error } = await supabase
                .from('profili')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', authState.user.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            setAuthState(prev => ({
                ...prev,
                profile: data,
                loading: false
            }));

            return { success: true, profile: data };

        } catch (error) {
            console.error('❌ Profile update failed:', error);
            setAuthState(prev => ({ ...prev, loading: false }));
            return { success: false, error: error.message };
        }
    }, [authState.user?.id]);

    // 📧 INVIA VERIFICA EMAIL
    const sendEmailVerification = useCallback(async () => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: authState.user?.email
            });

            if (error) {
                throw error;
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Email verification failed:', error);
            return { success: false, error: error.message };
        }
    }, [authState.user?.email]);

    // 🎯 CONTEXT VALUE
    const contextValue = {
        // Stato principale
        ...authState,

        // Funzioni principali
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        sendEmailVerification,

        // Funzioni utility
        refreshProfile: () => loadUserProfile(authState.user?.id),
        hasPermission: (permission) => authState.permissions.includes(permission),
        isOnboardingComplete: () => authState.onboardingState === ONBOARDING_STATES.COMPLETED,

        // Controlli rapidi tipo utente
        isAuthenticated: !!authState.user && !!authState.session,
        isCliente: authState.profile?.tipo_utente === USER_TYPES.CLIENTE,
        isTecnico: authState.profile?.tipo_utente === USER_TYPES.TECNICO,
        isHotel: authState.profile?.tipo_utente === USER_TYPES.HOTEL,
        isAdmin: authState.profile?.tipo_utente === USER_TYPES.ADMIN,

        // Stati specifici
        needsOnboarding: authState.onboardingState !== ONBOARDING_STATES.COMPLETED,
        canCreateBookings: authState.profile?.tipo_utente === USER_TYPES.CLIENTE || authState.profile?.tipo_utente === USER_TYPES.HOTEL,
        canAcceptBookings: authState.profile?.tipo_utente === USER_TYPES.TECNICO && authState.profile?.profilo_verificato,

        // Configurazione
        AUTH_CONFIG,
        USER_TYPES,
        ONBOARDING_STATES
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;