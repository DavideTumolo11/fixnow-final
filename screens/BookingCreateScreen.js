// screens/BookingCreateScreen.js
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// FixNow Colors
const COLORS = {
    primary: '#FF6B35',
    secondary: '#2E86AB',
    success: '#4CAF50',
    warning: '#FF9800',
    emergency: '#FF4444',
    dark: '#1A1A1A',
    light: '#F5F5F5',
    white: '#FFFFFF',
    gray: '#757575'
};

// Categorie con prezzi base dal business plan
const CATEGORIE_COMPLETE = [
    { id: 1, nome: 'Idraulico & Termoidraulico', icona: '🔧', urgente: true, prezzo_base: [70, 100], settore: 'domestico' },
    { id: 2, nome: 'Elettricista & Elettrodomestici', icona: '⚡', urgente: true, prezzo_base: [80, 110], settore: 'domestico' },
    { id: 3, nome: 'Fabbro & Serrature', icona: '🔐', urgente: true, prezzo_base: [90, 130], settore: 'domestico' },
    { id: 4, nome: 'Condizionatori & Climatizzazione', icona: '❄️', urgente: true, prezzo_base: [90, 140], settore: 'alberghiero' },
    { id: 5, nome: 'Muratore & Finiture', icona: '🧱', urgente: false, prezzo_base: [70, 110], settore: 'domestico' },
    { id: 6, nome: 'Imbianchino & Pareti', icona: '🎨', urgente: false, prezzo_base: [60, 90], settore: 'domestico' },
    { id: 7, nome: 'Vetraio & Serramentista', icona: '🪟', urgente: true, prezzo_base: [80, 120], settore: 'domestico' },
    { id: 8, nome: 'Antennista & TV Satellitare', icona: '📡', urgente: false, prezzo_base: [70, 110], settore: 'domestico' },
    { id: 9, nome: 'Informatico & Reti', icona: '💻', urgente: false, prezzo_base: [60, 90], settore: 'domestico' },
    { id: 10, nome: 'Piscine & Impianti Idrici', icona: '🏊', urgente: true, prezzo_base: [100, 200], settore: 'alberghiero' }
];

// Livelli di urgenza dal business plan
const URGENCY_LEVELS = [
    {
        id: 'normale',
        nome: '🟢 Normale',
        descrizione: 'Risposta entro 2-4 ore',
        maggiorazione: 0,
        tempo_risposta: '2-4 ore'
    },
    {
        id: 'urgente',
        nome: '🟡 Urgente',
        descrizione: 'Risposta entro 1 ora',
        maggiorazione: 30,
        tempo_risposta: '< 1 ora'
    },
    {
        id: 'emergenza',
        nome: '🔴 Emergenza',
        descrizione: 'Risposta entro 15 minuti',
        maggiorazione: 100,
        tempo_risposta: '< 15 min'
    }
];

export default function BookingCreateScreen({ navigation, route }) {
    const { user, profile, userType } = useAuth();

    // Stati del form
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedUrgency, setSelectedUrgency] = useState('normale');
    const [problemTitle, setProblemTitle] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [problemLocation, setProblemLocation] = useState('');
    const [maxBudget, setMaxBudget] = useState(200);
    const [isLoading, setIsLoading] = useState(false);

    // Parametri da URL (se arriva da una categoria specifica)
    useEffect(() => {
        if (route?.params?.categoria) {
            const categoria = CATEGORIE_COMPLETE.find(c => c.id === parseInt(route.params.categoria));
            if (categoria) {
                setSelectedCategory(categoria);
            }
        }
        if (route?.params?.urgenza) {
            setSelectedUrgency(route.params.urgenza);
        }
    }, [route?.params]);

    // Calcola prezzo stimato con maggiorazioni
    const calculatePrice = () => {
        if (!selectedCategory) return { min: 0, max: 0 };

        const [baseMin, baseMax] = selectedCategory.prezzo_base;
        const urgencyMultiplier = URGENCY_LEVELS.find(u => u.id === selectedUrgency)?.maggiorazione || 0;

        // Maggiorazione hotel se utente è hotel
        const hotelMultiplier = (userType === 'hotel' && selectedCategory.settore === 'alberghiero') ? 30 : 0;

        const totalMultiplier = 1 + (urgencyMultiplier + hotelMultiplier) / 100;

        return {
            min: Math.round(baseMin * totalMultiplier),
            max: Math.round(baseMax * totalMultiplier)
        };
    };

    // Validazione form
    const validateForm = () => {
        if (!selectedCategory) {
            Alert.alert('❌ Categoria Mancante', 'Seleziona il tipo di problema da risolvere.', [{ text: 'OK' }]);
            return false;
        }

        if (!problemTitle.trim() || problemTitle.length < 10) {
            Alert.alert('❌ Titolo Troppo Corto', 'Descrivi brevemente il problema (almeno 10 caratteri).', [{ text: 'OK' }]);
            return false;
        }

        if (!problemDescription.trim() || problemDescription.length < 20) {
            Alert.alert('❌ Descrizione Incompleta', 'Fornisci più dettagli sul problema (almeno 20 caratteri).', [{ text: 'OK' }]);
            return false;
        }

        if (!problemLocation.trim() || problemLocation.length < 10) {
            Alert.alert('❌ Indirizzo Mancante', 'Inserisci l\'indirizzo completo dell\'intervento.', [{ text: 'OK' }]);
            return false;
        }

        return true;
    };

    // Gestisce l'invio della richiesta
    const handleSubmitBooking = async () => {
        if (!validateForm()) return;

        const priceEstimate = calculatePrice();
        const urgencyData = URGENCY_LEVELS.find(u => u.id === selectedUrgency);

        // Mostra conferma prima dell'invio
        Alert.alert(
            '🔍 Conferma Richiesta',
            `Categoria: ${selectedCategory.nome}\nUrgenza: ${urgencyData.nome}\nPrezzo stimato: €${priceEstimate.min}-${priceEstimate.max}\nTempo risposta: ${urgencyData.tempo_risposta}\n\nProcedere con la richiesta?`,
            [
                { text: 'Modifica', style: 'cancel' },
                { text: '🚀 Conferma', onPress: () => submitToDatabase() }
            ]
        );
    };

    // Simula invio al database (implementazione reale con Supabase)
    const submitToDatabase = async () => {
        try {
            setIsLoading(true);

            const priceEstimate = calculatePrice();
            const bookingData = {
                cliente_id: user.id,
                categoria_id: selectedCategory.id,
                titolo: problemTitle.trim(),
                descrizione: problemDescription.trim(),
                urgenza: selectedUrgency,
                indirizzo_intervento: problemLocation.trim(),
                budget_massimo: maxBudget,
                preventivo_stimato: priceEstimate,
                tipo_cliente: userType,
                created_at: new Date().toISOString()
            };

            // TODO: Implementare chiamata a Supabase
            console.log('📝 Booking data to save:', bookingData);

            // Simula latenza API
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                '✅ Richiesta Inviata!',
                `La tua richiesta di ${selectedCategory.nome} è stata inviata con successo.\n\nCodice richiesta: FN${Math.floor(Math.random() * 10000)}\n\nI tecnici disponibili riceveranno una notifica entro ${URGENCY_LEVELS.find(u => u.id === selectedUrgency).tempo_risposta}.`,
                [
                    { text: '📱 Vai alle Prenotazioni', onPress: () => navigation?.navigate('Bookings') },
                    { text: '🏠 Torna Home', onPress: () => navigation?.navigate('Home') }
                ]
            );

        } catch (error) {
            console.error('❌ Booking submission error:', error);
            Alert.alert(
                '❌ Errore Invio',
                'Si è verificato un errore durante l\'invio della richiesta. Riprova.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const priceEstimate = calculatePrice();

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation?.goBack()}
                >
                    <Text style={styles.backButtonText}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Richiedi Assistenza</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* Category Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔧 Che problema devi risolvere?</Text>
                    <Text style={styles.sectionSubtitle}>Seleziona la categoria più adatta</Text>

                    <View style={styles.categoriesGrid}>
                        {CATEGORIE_COMPLETE.map((categoria) => (
                            <TouchableOpacity
                                key={categoria.id}
                                style={[
                                    styles.categoryCard,
                                    selectedCategory?.id === categoria.id && styles.categorySelected,
                                    categoria.urgente && styles.categoryUrgent
                                ]}
                                onPress={() => setSelectedCategory(categoria)}
                            >
                                <Text style={styles.categoryIcon}>{categoria.icona}</Text>
                                <Text style={styles.categoryName}>{categoria.nome}</Text>
                                <Text style={styles.categoryPrice}>
                                    €{categoria.prezzo_base[0]}-{categoria.prezzo_base[1]}
                                </Text>
                                {categoria.urgente && (
                                    <View style={styles.urgentBadge}>
                                        <Text style={styles.urgentText}>URGENTE</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {selectedCategory && (
                    <>
                        {/* Urgency Level */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>⏱️ Quanto è urgente?</Text>
                            <Text style={styles.sectionSubtitle}>
                                Chi decide: TU! I prezzi variano in base all'urgenza
                            </Text>

                            {URGENCY_LEVELS.map((urgency) => (
                                <TouchableOpacity
                                    key={urgency.id}
                                    style={[
                                        styles.urgencyCard,
                                        selectedUrgency === urgency.id && styles.urgencySelected
                                    ]}
                                    onPress={() => setSelectedUrgency(urgency.id)}
                                >
                                    <View style={styles.urgencyLeft}>
                                        <Text style={styles.urgencyName}>{urgency.nome}</Text>
                                        <Text style={styles.urgencyDescription}>{urgency.descrizione}</Text>
                                    </View>
                                    <View style={styles.urgencyRight}>
                                        <Text style={styles.urgencyPrice}>
                                            {urgency.maggiorazione === 0 ? 'Gratis' : `+${urgency.maggiorazione}%`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Problem Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📝 Descrivi il problema</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Titolo problema *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="es: Perdita rubinetto cucina"
                                    placeholderTextColor={COLORS.gray}
                                    value={problemTitle}
                                    onChangeText={setProblemTitle}
                                    maxLength={100}
                                    editable={!isLoading}
                                />
                                <Text style={styles.charCount}>{problemTitle.length}/100</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Descrizione dettagliata *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Descrivi il problema in dettaglio: quando è iniziato, dove si trova, che sintomi noti..."
                                    placeholderTextColor={COLORS.gray}
                                    value={problemDescription}
                                    onChangeText={setProblemDescription}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                    textAlignVertical="top"
                                    editable={!isLoading}
                                />
                                <Text style={styles.charCount}>{problemDescription.length}/500</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>📍 Indirizzo intervento *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Via, numero civico, città, provincia"
                                    placeholderTextColor={COLORS.gray}
                                    value={problemLocation}
                                    onChangeText={setProblemLocation}
                                    maxLength={200}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity style={styles.locationButton}>
                                    <Text style={styles.locationButtonText}>📍 Usa posizione attuale</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Budget Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💰 Budget massimo</Text>
                            <Text style={styles.sectionSubtitle}>
                                Stima per {selectedCategory.nome} con urgenza {URGENCY_LEVELS.find(u => u.id === selectedUrgency).nome}
                            </Text>

                            <View style={styles.priceEstimate}>
                                <Text style={styles.priceLabel}>Prezzo stimato:</Text>
                                <Text style={styles.priceRange}>€{priceEstimate.min} - €{priceEstimate.max}</Text>
                            </View>

                            <View style={styles.budgetSlider}>
                                <Text style={styles.budgetLabel}>Budget massimo: €{maxBudget}</Text>
                                {/* TODO: Implementare slider per budget */}
                                <View style={styles.budgetButtons}>
                                    <TouchableOpacity
                                        style={styles.budgetButton}
                                        onPress={() => setMaxBudget(Math.max(50, maxBudget - 25))}
                                    >
                                        <Text style={styles.budgetButtonText}>- €25</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.budgetButton}
                                        onPress={() => setMaxBudget(maxBudget + 25)}
                                    >
                                        <Text style={styles.budgetButtonText}>+ €25</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                selectedUrgency === 'emergenza' && styles.emergencyButton,
                                isLoading && styles.buttonDisabled
                            ]}
                            onPress={handleSubmitBooking}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {selectedUrgency === 'emergenza' ? '🚨 EMERGENZA - INVIA SUBITO' : '🚀 Invia Richiesta'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Info Footer */}
                        <View style={styles.infoFooter}>
                            <Text style={styles.infoTitle}>ℹ️ Come funziona:</Text>
                            <Text style={styles.infoText}>1. Invii la richiesta</Text>
                            <Text style={styles.infoText}>2. I tecnici ricevono notifica</Text>
                            <Text style={styles.infoText}>3. Ricevi 3-5 preventivi</Text>
                            <Text style={styles.infoText}>4. Scegli il tecnico migliore</Text>
                            <Text style={styles.infoText}>5. Pagamento sicuro solo a lavoro completato</Text>
                        </View>
                    </>
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
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        flex: 1,
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 80,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 15,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.light,
    },
    categorySelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#FFF5F2',
    },
    categoryUrgent: {
        borderColor: COLORS.warning,
    },
    categoryIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.dark,
        textAlign: 'center',
        marginBottom: 5,
    },
    categoryPrice: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    urgentBadge: {
        backgroundColor: COLORS.warning,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 5,
    },
    urgentText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    urgencyCard: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.light,
    },
    urgencySelected: {
        borderColor: COLORS.secondary,
        backgroundColor: '#F0F8FF',
    },
    urgencyLeft: {
        flex: 1,
    },
    urgencyName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 3,
    },
    urgencyDescription: {
        fontSize: 14,
        color: COLORS.gray,
    },
    urgencyRight: {
        alignItems: 'flex-end',
    },
    urgencyPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 8,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'right',
        marginTop: 5,
    },
    locationButton: {
        backgroundColor: COLORS.secondary,
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
    },
    locationButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    },
    priceEstimate: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 16,
        color: COLORS.dark,
    },
    priceRange: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    budgetSlider: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
    },
    budgetLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 10,
        textAlign: 'center',
    },
    budgetButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
    },
    budgetButton: {
        backgroundColor: COLORS.light,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    budgetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    emergencyButton: {
        backgroundColor: COLORS.emergency,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoFooter: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 5,
        paddingLeft: 10,
    },
});