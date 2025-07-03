// screens/LoginScreen.js
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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn, resetPassword } = useAuth();

    // Validazione email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Gestisce il login
    const handleLogin = async () => {
        // Validazione input
        if (!email.trim() || !password.trim()) {
            Alert.alert(
                '❌ Campi Obbligatori',
                'Inserisci email e password per accedere.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert(
                '❌ Email Non Valida',
                'Inserisci un indirizzo email valido.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (password.length < 6) {
            Alert.alert(
                '❌ Password Troppo Corta',
                'La password deve essere di almeno 6 caratteri.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setIsLoading(true);
            console.log('🔑 Attempting login...');

            const { user, error } = await signIn(email, password);

            if (error) {
                let errorMessage = 'Errore durante il login. Riprova.';

                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Email o password non corretti.';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Conferma la tua email prima di accedere.';
                } else if (error.message.includes('Too many requests')) {
                    errorMessage = 'Troppi tentativi. Attendi qualche minuto.';
                }

                Alert.alert('❌ Errore Login', errorMessage, [{ text: 'OK' }]);
                return;
            }

            if (user) {
                console.log('✅ Login successful!');
                // L'AuthContext gestirà automaticamente la navigazione
            }

        } catch (error) {
            console.error('❌ Login error:', error);
            Alert.alert(
                '❌ Errore Imprevisto',
                'Si è verificato un errore. Controlla la connessione internet e riprova.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Gestisce il reset password
    const handleForgotPassword = () => {
        if (!email.trim()) {
            Alert.alert(
                '💡 Inserisci Email',
                'Inserisci la tua email nel campo sopra, poi premi di nuovo "Password Dimenticata".',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert(
                '❌ Email Non Valida',
                'Inserisci un indirizzo email valido per recuperare la password.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            '🔄 Recupero Password',
            `Vuoi inviare le istruzioni per il reset della password a:\n\n${email}`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Invia',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            const { error } = await resetPassword(email);

                            if (error) {
                                Alert.alert(
                                    '❌ Errore',
                                    'Errore durante l\'invio dell\'email. Riprova.',
                                    [{ text: 'OK' }]
                                );
                            } else {
                                Alert.alert(
                                    '✅ Email Inviata',
                                    'Controlla la tua casella email per le istruzioni di reset.',
                                    [{ text: 'OK' }]
                                );
                            }
                        } catch (error) {
                            Alert.alert('❌ Errore', 'Errore imprevisto. Riprova.', [{ text: 'OK' }]);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
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
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            editable={!isLoading}
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
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                <Text style={styles.passwordToggleText}>
                                    {showPassword ? '🙈' : '👁️'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                            <Text style={styles.loginButtonText}>🔑 Accedi</Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={handleForgotPassword}
                        disabled={isLoading}
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
                        disabled={isLoading}
                    >
                        <Text style={styles.registerButtonText}>
                            📝 Registrati Ora
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Development Info */}
                <View style={styles.devInfo}>
                    <Text style={styles.devTitle}>🚧 Account di Test</Text>
                    <Text style={styles.devText}>Email: test@fixnow.it</Text>
                    <Text style={styles.devText}>Password: password123</Text>
                    <TouchableOpacity
                        style={styles.devButton}
                        onPress={() => {
                            setEmail('test@fixnow.it');
                            setPassword('password123');
                        }}
                        disabled={isLoading}
                    >
                        <Text style={styles.devButtonText}>⚡ Auto-Fill Test</Text>
                    </TouchableOpacity>
                </View>

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
        marginBottom: 20,
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
    },
    devButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
});