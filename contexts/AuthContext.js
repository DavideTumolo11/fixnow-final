// contexts/AuthContext.js - VERSIONE SEMPLIFICATA PER DEBUG
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false); // CAMBIATO a false

    // Simuliamo un utente loggato per testare l'app
    useEffect(() => {
        console.log('🔐 AuthContext: Quick setup for testing...');

        // Simula utente test
        const mockUser = {
            id: 'test-user-id',
            email: 'test@fixnow.it'
        };

        const mockProfile = {
            id: 'test-user-id',
            email: 'test@fixnow.it',
            nome: 'Mario',
            cognome: 'Rossi',
            tipo_utente: 'cliente'
        };

        setUser(mockUser);
        setProfile(mockProfile);
        setInitializing(false);
        setLoading(false);

        console.log('✅ Mock user set:', mockUser.email);
    }, []);

    // Funzione di logout semplificata
    const signOut = async () => {
        try {
            console.log('🚪 Signing out...');
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error('❌ SignOut error:', error);
        }
    };

    // Funzioni di login/signup semplificate (per ora non funzionali)
    const signIn = async (email, password) => {
        console.log('🔑 SignIn called (mock)');
        return { user: null, error: { message: 'Use mock user for now' } };
    };

    const signUp = async (email, password, userData) => {
        console.log('📝 SignUp called (mock)');
        return { user: null, error: { message: 'Use mock user for now' } };
    };

    const updateProfile = async (updates) => {
        console.log('📝 UpdateProfile called (mock)');
        return { data: null, error: null };
    };

    const resetPassword = async (email) => {
        console.log('🔄 ResetPassword called (mock)');
        return { error: null };
    };

    const value = {
        // Stato
        user,
        profile,
        loading,
        initializing,

        // Funzioni
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,

        // Utility
        isAuthenticated: !!user,
        needsOnboarding: false, // Sempre false per test
        userType: profile?.tipo_utente || 'cliente',

        // Controlli permessi
        isCliente: profile?.tipo_utente === 'cliente',
        isTecnico: profile?.tipo_utente === 'tecnico',
        isHotel: profile?.tipo_utente === 'hotel',
        isAdmin: profile?.tipo_utente === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};