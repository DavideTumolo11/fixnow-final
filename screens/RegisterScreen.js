// screens/RegisterScreen.js
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

// Tipi di utente disponibili
const USER_TYPES = [
    {
        id: 'cliente',
        nome: '👤 Cliente',
        descrizione: 'Richiedo servizi di assistenza tecnica',
        color: COLORS.primary
    },
    {
        id: 'tecnico',
        nome: '🔧 Tecnico',
        descrizione: 'Offro servizi di assistenza tecnica',
        color: COLORS.secondary
    },
    {
        id: 'hotel',
        nome: '🏨 Hotel/B&B',
        descrizione: 'Gestisco una struttura ricettiva',
        color: COLORS.success
    }
];

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        tipo_utente: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { signUp } = useAuth();

    // Aggiorna i dati del form
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

    // Validazione telefono italiano
    const isValidPhone = (phone) => {
        const phoneRegex = /^[\+]?[3][0-9]{8,9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    // Validazione form completa
    const validateForm = () => {
        const { nome, cognome, email, telefono, password, confirmPassword, tipo_utente } = formData;

        if (!nome.trim() || !cognome.trim()) {
            Alert.alert('❌ Nome e Cognome', 'Inserisci nome e cognome completi.', [{ text: 'OK' }]);
            return false;
        }

        if (nome.trim().length < 2 || cognome.trim().length < 2) {
            Alert.alert('❌ Nome Troppo Corto', 'Nome e cognome devono avere almeno 2 caratteri.', [{ text: 'OK' }]);
            return false;
        }

        if (!isValidEmail(email)) {
            Alert.alert('❌ Email Non Valida', 'Inserisci un indirizzo email valido.', [{ text: 'OK' }]);
            return false;
        }

        if (telefono && !isValidPhone(telefono)) {
            Alert.alert('❌ Telefono Non Valido', 'Inserisci un numero di telefono italiano valido (es: 3401234567).', [{ text: 'OK' }]);
            return false;
        }

        if (password.length < 6) {
            Alert.alert('❌ Password Troppo Corta', 'La password deve essere di almeno 6 caratteri.', [{ text: 'OK' }]);
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('❌ Password Non Coincidono', 'Le password inserite non coincidono.', [{ text: 'OK' }]);
            return false;
        }

        if (!tipo_utente) {
            Alert.alert('❌ Tipo Account', 'Seleziona il tipo di account che desideri creare.', [{ text: 'OK' }]);
            return false;
        }

        return true;
    };

    // Gestisce la registrazione
    const handleRegister = async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            console.log('📝 Attempting registration...');

            const userData = {
                nome: formData.nome.trim(),
                cognome: formData.cognome.trim(),
                telefono: formData.telefono.trim() || null,
                tipo_utente: formData.tipo_utente
            };

            const { user, error } = await signUp(formData.email, formData.password, userData);

            if (error) {
                let errorMessage = 'Errore durante la registrazione. Riprova.';

                if (error.message.includes('User already registered')) {
                    errorMessage = 'Questa email è già registrata. Prova ad accedere.';
                } else if (error.message.includes('Password should be at least 6 characters')) {
                    errorMessage = 'La password deve essere di almeno 6 caratteri.';
                } else if (error.message.includes('Invalid email')) {
                    errorMessage = 'L\'indirizzo email non è valido.';
                }

                Alert.alert('❌ Errore Registrazione', errorMessage, [{ text: 'OK' }]);
                return;
            }

            if (user) {
                console.log('✅ Registration successful!');
                Alert.alert(
                    '✅ Registrazione Completata',
                    `Benvenuto/a ${userData.nome}!\n\nAccount creato con successo come ${USER_TYPES.find(t => t.id === userData.tipo_utente)?.nome}.\n\nPuoi iniziare ad usare FixNow subito!`,
                    [{
                        text: 'Iniziamo!', onPress: () => {
                            // L'AuthContext gestirà automaticamente la navigazione
                        }
                    }]
                );
            }

        } catch (error) {
            console.error('❌ Registration error:', error);
            Alert.alert(
                '❌ Errore Imprevisto',
                'Si è verificato un errore. Controlla la connessione internet e riprova.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
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
                    <Text style={styles.subtitle}>Crea il tuo account</Text>
                </View>

                {/* User Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Tipo di Account</Text>
                    <Text style={styles.sectionSubtitle}>Seleziona come vuoi usare FixNow</Text>

                    <View style={styles.userTypeContainer}>
                        {USER_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.userTypeCard,
                                    formData.tipo_utente === type.id && styles.userTypeSelected,
                                    { borderColor: type.color }
                                ]}
                                onPress={() => updateFormData('tipo_utente', type.id)}
                                disabled={isLoading}
                            >
                                <Text style={[styles.userTypeName, { color: type.color }]}>
                                    {type.nome}
                                </Text>
                                <Text style={styles.userTypeDescription}>
                                    {type.descrizione}
                                </Text>
                                {formData.tipo_utente === type.id && (
                                    <View style={[styles.selectedBadge, { backgroundColor: type.color }]}>
                                        <Text style={styles.selectedText}>✓ Selezionato</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Informazioni Personali</Text>

                    {/* Nome e Cognome */}
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Nome *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Il tuo nome"
                                placeholderTextColor={COLORS.gray}
                                value={formData.nome}
                                onChangeText={(value) => updateFormData('nome', value)}
                                autoCapitalize="words"
                                returnKeyType="next"
                                editable={!isLoading}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Cognome *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Il tuo cognome"
                                placeholderTextColor={COLORS.gray}
                                value={formData.cognome}
                                onChangeText={(value) => updateFormData('cognome', value)}
                                autoCapitalize="words"
                                returnKeyType="next"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>📧 Email *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="la.tua.email@example.com"
                            placeholderTextColor={COLORS.gray}
                            value={formData.email}
                            onChangeText={(value) => updateFormData('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            editable={!isLoading}
                        />
                    </View>

                    {/* Telefono */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>📱 Telefono</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="3401234567"
                            placeholderTextColor={COLORS.gray}
                            value={formData.telefono}
                            onChangeText={(value) => updateFormData('telefono', value)}
                            keyboardType="phone-pad"
                            returnKeyType="next"
                            editable={!isLoading}
                        />
                        <Text style={styles.helperText}>Opzionale - Utile per contatti urgenti</Text>
                    </View>
                </View>

                {/* Password Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔒 Sicurezza</Text>

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password *</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Minimo 6 caratteri"
                                placeholderTextColor={COLORS.gray}
                                value={formData.password}
                                onChangeText={(value) => updateFormData('password', value)}
                                secureTextEntry={!showPassword}
                                returnKeyType="next"
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

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Conferma Password *</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Ripeti la password"
                                placeholderTextColor={COLORS.gray}
                                value={formData.confirmPassword}
                                onChangeText={(value) => updateFormData('confirmPassword', value)}
                                secureTextEntry={!showConfirmPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleRegister}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={isLoading}
                            >
                                <Text style={styles.passwordToggleText}>
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                    style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <Text style={styles.registerButtonText}>🚀 Crea Account</Text>
                    )}
                </TouchableOpacity>

                {/* Login Section */}
                <View style={styles.loginSection}>
                    <Text style={styles.loginText}>Hai già un account?</Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation?.navigate('Login')}
                        disabled={isLoading}
                    >
                        <Text style={styles.loginButtonText}>
                            🔑 Accedi
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsText}>
                        Registrandoti accetti i nostri{' '}
                        <Text style={styles.termsLink}>Termini di Servizio</Text>
                        {' '}e la{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
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
        marginTop: 20,
        marginBottom: 30,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 15,
    },
    userTypeContainer: {
        gap: 10,
    },
    userTypeCard: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.light,
    },
    userTypeSelected: {
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    userTypeName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userTypeDescription: {
        fontSize: 14,
        color: COLORS.gray,
    },
    selectedBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
    },
    selectedText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    halfInput: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.light,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.dark,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 4,
    },
    passwordContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.light,
        borderRadius: 8,
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: COLORS.dark,
    },
    passwordToggle: {
        padding: 12,
    },
    passwordToggleText: {
        fontSize: 16,
    },
    registerButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '600',
    },
    loginSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loginText: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 10,
    },
    loginButton: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    termsSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    termsText: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});