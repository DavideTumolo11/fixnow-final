// screens/LoginScreen.js - VERSIONE REALE con Supabase Auth
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// FixNow Colors
const COLORS = {
    primary: '#FF6B35',
    secondary: '#2E86AB',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    dark: '#1A1A1A',
    light: '#F5F5F5',
    white: '#FFFFFF',
    gray: '#757575'
};

export default function LoginScreen({ navigation }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const { signIn, resetPassword, loading, error } = useAuth();

    // Aggiorna form data
    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Validazione email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Gestisce il login
    const handleLogin = async () => {
        // Validazione input
        if (!formData.email.trim() || !formData.password.trim()) {
            Alert.alert(
                '❌ Campi Obbligatori',
                'Inserisci email e password per accedere.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!isValidEmail(formData.email)) {
            Alert.alert(
                '❌ Email Non Valida',
                'Inserisci un indirizzo email valido.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert(
                '❌ Password Troppo Corta',
                'La password deve essere di almeno 6 caratteri.',
                [{ text: 'OK' }]
            );
            return;
        }

        console.log('🔑 Attempting login with:', formData.email);

        // Chiama funzione di login reale
        const result = await signIn(formData.email, formData.password);

        if (result.success) {
            console.log('✅ Login successful!');
            // L'AuthContext gestirà automaticamente la navigazione
            Alert.alert(
                '✅ Login Effettuato!',
                'Benvenuto in FixNow Sardegna!',
                [{ text: 'Continua' }]
            );
        } else {
            console.error('❌ Login failed:', result.error);

            // Gestione errori specifici
            let errorMessage = result.error;

            if (result.error.includes('Invalid login credentials')) {
                errorMessage = 'Email o password non corretti.';
            } else if (result.error.includes('Email not confirmed')) {
                errorMessage = 'Conferma la tua email prima di accedere.';
            } else if (result.error.includes('Too many requests')) {
                errorMessage = 'Troppi tentativi. Attendi qualche minuto.';
            } else if (result.error.includes('Account bloccato')) {
                errorMessage = result.error; // Mantieni il messaggio completo
            }

            Alert.alert('❌ Errore Login', errorMessage, [{ text: 'OK' }]);
        }
    };

    // Gestisce il reset password
    const handleForgotPassword = () => {
        if (!formData.email.trim()) {
            Alert.alert(
                '💡 Inserisci Email',
                'Inserisci la tua email nel campo sopra, poi premi di nuovo "Password Dimenticata".',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!isValidEmail(formData.email)) {
            Alert.alert(
                '❌ Email Non Valida',
                'Inserisci un indirizzo email valido per recuperare la password.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            '🔄 Recupero Password',
            `Vuoi inviare le istruzioni per il reset della password a:\n\n${formData.email}`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Invia',
                    onPress: async () => {
                        console.log('🔄 Sending password reset to:', formData.email);

                        const result = await resetPassword(formData.email);

                        if (result.success) {
                            Alert.alert(
                                '✅ Email Inviata',
                                'Controlla la tua casella email per le istruzioni di reset.',
                                [{ text: 'OK' }]
                            );
                        } else {
                            Alert.alert(
                                '❌ Errore',
                                result.error || 'Errore durante l\'invio dell\'email. Riprova.',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                }
            ]
        );
    };

    // Auto-fill per testing (solo in development)
    const autoFillTest = () => {
        setFormData({
            email: 'test@fixnow.it',
            password: 'password123'
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>FixNow</Text>
                    <Text style={styles.tagline}>Assistenza Tecnica 24/7</Text>
                    <Text style={styles.subtitle}>Accedi al tuo account</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>📧 Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="La tua email"
                            placeholderTextColor={COLORS.gray}
                            value={formData.email}
                            onChangeText={(value) => updateFormData('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            editable={!loading}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>🔒 Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="La tua password"
                                placeholderTextColor={COLORS.gray}
                                value={formData.password}
                                onChangeText={(value) => updateFormData('password', value)}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                <Text style={styles.passwordToggleText}>
                                    {showPassword ? '🙈' : '👁️'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Error Display */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>❌ {error}</Text>
                        </View>
                    )}

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                            <Text style={styles.loginButtonText}>🔑 Accedi</Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={handleForgotPassword}
                        disabled={loading}
                    >
                        <Text style={styles.forgotButtonText}>
                            🔄 Password Dimenticata?
                        </Text>
                    </TouchableOpacity>

                </View>

                {/* Register Section */}
                <View style={styles.registerSection}>
                    <Text style={styles.registerText}>Non hai ancora un account?</Text>
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => navigation?.navigate('Register')}
                        disabled={loading}
                    >
                        <Text style={styles.registerButtonText}>
                            📝 Registrati Ora
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Development Info */}
                {__DEV__ && (
                    <View style={styles.devInfo}>
                        <Text style={styles.devTitle}>🚧 Testing (Solo Development)</Text>
                        <Text style={styles.devText}>Email: test@fixnow.it</Text>
                        <Text style={styles.devText}>Password: password123</Text>
                        <TouchableOpacity
                            style={styles.devButton}
                            onPress={autoFillTest}
                            disabled={loading}
                        >
                            <Text style={styles.devButtonText}>⚡ Auto-Fill Test</Text>
                        </TouchableOpacity>
                        <Text style={styles.devNote}>
                            🔄 Usando Supabase Auth REALE
                        </Text>
                    </View>
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.gray,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
    },
    form: {
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.light,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: COLORS.dark,
    },
    passwordContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.light,
        borderRadius: 12,
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: COLORS.dark,
    },
    passwordToggle: {
        padding: 15,
    },
    passwordToggleText: {
        fontSize: 18,
    },
    errorContainer: {
        backgroundColor: '#FFF0F0',
        borderWidth: 1,
        borderColor: COLORS.error,
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    },
    forgotButton: {
        alignItems: 'center',
        marginTop: 20,
        padding: 10,
    },
    forgotButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: '500',
    },
    registerSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    registerText: {
        fontSize: 16,
        color: COLORS.gray,
        marginBottom: 15,
    },
    registerButton: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    registerButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    devInfo: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.warning,
    },
    devTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 5,
    },
    devText: {
        fontSize: 12,
        color: COLORS.gray,
        marginBottom: 2,
    },
    devButton: {
        backgroundColor: COLORS.warning,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    devButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    devNote: {
        fontSize: 11,
        color: COLORS.success,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});