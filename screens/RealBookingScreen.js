// screens/RealBookingScreen.js - PRENOTAZIONI REALI
// FixNow Sardegna - Sistema Prenotazioni Completo
// In cima a BookingCreateScreen.js (nuovo):
import { supabase } from '../supabaseClient';
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';
import BookingService from '../services/BookingService.js';
// 🎨 COLORS
const COLORS = {
    primary: '#FF6B35',
    secondary: '#2E86AB',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#DC2626',
    dark: '#1A1A1A',
    light: '#F5F5F5',
    white: '#FFFFFF',
    gray: '#757575'
};

// ⏱️ LIVELLI URGENZA
const URGENCY_LEVELS = [
    {
        id: 'normale',
        nome: '🟢 Normale',
        desc: 'Entro 2-4 ore',
        multiplier: 1.0,
        color: COLORS.success
    },
    {
        id: 'urgente',
        nome: '🟡 Urgente',
        desc: 'Entro 1 ora',
        multiplier: 1.3,
        color: COLORS.warning
    },
    {
        id: 'emergenza',
        nome: '🔴 Emergenza',
        desc: 'Entro 15 minuti',
        multiplier: 2.0,
        color: COLORS.danger
    }
];

export default function RealBookingScreen({ route, navigation }) {
    const { user, profile, isAuthenticated } = useAuth();
    const { location, loading: locationLoading, error: locationError, refreshLocation } = useLocation();

    // 🎯 STATO COMPONENTE
    const [selectedCategory, setSelectedCategory] = useState(route?.params?.categoria || null);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        titolo: '',
        descrizione: '',
        urgenza: 'normale',
        note_accesso: '',
        budget_massimo: null
    });

    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [estimatedPrice, setEstimatedPrice] = useState(null);

    // 🔄 CARICA CATEGORIE
    useEffect(() => {
        loadCategories();
    }, []);

    // 💰 CALCOLA PREZZO STIMATO
    useEffect(() => {
        if (selectedCategory && formData.urgenza) {
            calculateEstimatedPrice();
        }
    }, [selectedCategory, formData.urgenza, profile?.tipo_utente]);

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);

            const { data: categoriesData, error } = await supabase
                .from('categorie')
                .select('*')
                .eq('attiva', true)
                .order('ordine_visualizzazione');

            if (error) throw error;

            setCategories(categoriesData || []);
        } catch (error) {
            console.error('❌ Load categories error:', error);
            Alert.alert('Errore', 'Impossibile caricare le categorie');
        } finally {
            setLoadingCategories(false);
        }
    };

    const calculateEstimatedPrice = () => {
        if (!selectedCategory) return;

        const urgencyLevel = URGENCY_LEVELS.find(u => u.id === formData.urgenza);
        const basePrice = selectedCategory.tariffa_base_min;
        let finalPrice = basePrice * urgencyLevel.multiplier;

        // Maggiorazione hotel
        if (profile?.tipo_utente === 'hotel') {
            finalPrice *= 1.3;
        }

        // Maggiorazione orario (esempio: notturno)
        const now = new Date();
        const hour = now.getHours();
        if (hour < 6 || hour >= 22) {
            finalPrice *= 1.4;
        }

        // Weekend
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        if (isWeekend) {
            finalPrice *= 1.25;
        }

        setEstimatedPrice({
            prezzo_base: basePrice,
            prezzo_finale: Math.round(finalPrice),
            urgency_multiplier: urgencyLevel.multiplier,
            hotel_bonus: profile?.tipo_utente === 'hotel',
            night_bonus: hour < 6 || hour >= 22,
            weekend_bonus: isWeekend
        });
    };

    // 📝 CREA PRENOTAZIONE
    const handleCreateBooking = async () => {
        try {
            // Validazione
            if (!isAuthenticated) {
                Alert.alert('Errore', 'Devi essere autenticato per creare una prenotazione');
                return;
            }

            if (!selectedCategory) {
                Alert.alert('Errore', 'Seleziona una categoria di servizio');
                return;
            }

            if (!formData.titolo.trim() || !formData.descrizione.trim()) {
                Alert.alert('Errore', 'Compila titolo e descrizione del problema');
                return;
            }

            if (!location) {
                Alert.alert('Errore', 'Posizione GPS richiesta per creare la prenotazione');
                return;
            }

            setLoading(true);

            // Prepara dati prenotazione
            const bookingData = {
                categoria_id: selectedCategory.id,
                titolo: formData.titolo.trim(),
                descrizione: formData.descrizione.trim(),
                urgenza: formData.urgenza,
                note_accesso: formData.note_accesso.trim() || null,
                budget_massimo: estimatedPrice?.prezzo_finale || selectedCategory.tariffa_base_max
            };

            console.log('📝 Creating booking with data:', bookingData);

            // Crea prenotazione via BookingService
            const result = await BookingService.createBooking(bookingData, location, profile);

            if (result.success) {
                Alert.alert(
                    '🎉 Prenotazione Creata!',
                    `Codice: ${result.prenotazione.codice_prenotazione}\nStiamo cercando i migliori tecnici disponibili nella tua zona.`,
                    [
                        {
                            text: '🔍 Trova Tecnici',
                            onPress: () => navigation.navigate('TechnicianMatching', {
                                prenotazione: result.prenotazione,
                                userLocation: location
                            })
                        }
                    ]
                );
            } else {
                Alert.alert('❌ Errore', result.error || 'Impossibile creare la prenotazione');
            }

        } catch (error) {
            console.error('❌ Create booking error:', error);
            Alert.alert('❌ Errore', 'Si è verificato un errore durante la creazione della prenotazione');
        } finally {
            setLoading(false);
        }
    };

    // 🏷️ SELEZIONA CATEGORIA
    const handleCategorySelect = (categoria) => {
        setSelectedCategory(categoria);
        setFormData(prev => ({
            ...prev,
            titolo: prev.titolo || `Riparazione ${categoria.nome.toLowerCase()}`
        }));
    };

    // 📍 GESTIONE POSIZIONE
    const handleLocationRefresh = () => {
        refreshLocation();
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>🔐 Accesso richiesto</Text>
                <Text style={styles.errorSubtext}>Effettua il login per creare una prenotazione</Text>
                <TouchableOpacity
                    style={styles.errorButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.errorButtonText}>Vai al Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* 🎯 HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Richiedi Assistenza</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 📍 STATO POSIZIONE */}
                <View style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                        <Text style={styles.locationTitle}>📍 Posizione Intervento</Text>
                        <TouchableOpacity
                            onPress={handleLocationRefresh}
                            disabled={locationLoading}
                        >
                            <Text style={styles.refreshButton}>
                                {locationLoading ? '🔄' : '↻'} Aggiorna
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {locationError ? (
                        <Text style={styles.locationError}>❌ {locationError}</Text>
                    ) : location ? (
                        <Text style={styles.locationText}>
                            ✅ {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                        </Text>
                    ) : (
                        <Text style={styles.locationLoading}>📍 Rilevamento posizione...</Text>
                    )}
                </View>

                {/* 🏷️ SELEZIONE CATEGORIA */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔧 Categoria Servizio</Text>

                    {selectedCategory ? (
                        <View style={styles.selectedCategoryCard}>
                            <Text style={styles.selectedCategoryText}>
                                {selectedCategory.icona} {selectedCategory.nome}
                            </Text>
                            <Text style={styles.selectedCategoryPrice}>
                                €{selectedCategory.tariffa_base_min}-{selectedCategory.tariffa_base_max}
                            </Text>
                            <TouchableOpacity
                                style={styles.changeCategoryButton}
                                onPress={() => setSelectedCategory(null)}
                            >
                                <Text style={styles.changeCategoryText}>Cambia Categoria</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.categoriesContainer}>
                            {loadingCategories ? (
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            ) : (
                                <View style={styles.categoriesGrid}>
                                    {categories.map((categoria) => (
                                        <TouchableOpacity
                                            key={categoria.id}
                                            style={styles.categoryCard}
                                            onPress={() => handleCategorySelect(categoria)}
                                        >
                                            <Text style={styles.categoryIcon}>{categoria.icona}</Text>
                                            <Text style={styles.categoryName}>{categoria.nome}</Text>
                                            <Text style={styles.categoryPrice}>
                                                €{categoria.tariffa_base_min}-{categoria.tariffa_base_max}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* ⏱️ LIVELLO URGENZA */}
                {selectedCategory && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⏱️ Livello di Urgenza</Text>
                        {URGENCY_LEVELS.map((urgency) => (
                            <TouchableOpacity
                                key={urgency.id}
                                style={[
                                    styles.urgencyCard,
                                    formData.urgenza === urgency.id && styles.urgencySelected,
                                    { borderColor: urgency.color }
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, urgenza: urgency.id }))}
                            >
                                <View style={styles.urgencyLeft}>
                                    <Text style={styles.urgencyName}>{urgency.nome}</Text>
                                    <Text style={styles.urgencyDescription}>{urgency.desc}</Text>
                                </View>
                                <Text style={[styles.urgencyMultiplier, { color: urgency.color }]}>
                                    x{urgency.multiplier}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 📝 DETTAGLI PROBLEMA */}
                {selectedCategory && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📝 Descrivi il Problema</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Titolo problema *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="es: Perdita rubinetto cucina"
                                value={formData.titolo}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, titolo: text }))}
                                maxLength={100}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Descrizione dettagliata *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Descrivi il problema in dettaglio, quando è iniziato, cosa hai già provato..."
                                value={formData.descrizione}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, descrizione: text }))}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.characterCount}>
                                {formData.descrizione.length}/500
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Note per l'accesso (opzionale)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="es: Citofono rosso, 2° piano..."
                                value={formData.note_accesso}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, note_accesso: text }))}
                                maxLength={200}
                            />
                        </View>
                    </View>
                )}

                {/* 💰 STIMA PREZZO */}
                {estimatedPrice && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💰 Stima Costo Intervento</Text>
                        <View style={styles.priceCard}>
                            <View style={styles.priceHeader}>
                                <Text style={styles.priceTitle}>Prezzo Stimato</Text>
                                <Text style={styles.finalPrice}>€{estimatedPrice.prezzo_finale}</Text>
                            </View>

                            <View style={styles.priceBreakdown}>
                                <Text style={styles.priceItem}>
                                    Base: €{estimatedPrice.prezzo_base}
                                </Text>
                                {estimatedPrice.urgency_multiplier > 1 && (
                                    <Text style={styles.priceItem}>
                                        Urgenza: x{estimatedPrice.urgency_multiplier}
                                    </Text>
                                )}
                                {estimatedPrice.hotel_bonus && (
                                    <Text style={styles.priceItem}>
                                        Hotel: +30%
                                    </Text>
                                )}
                                {estimatedPrice.night_bonus && (
                                    <Text style={styles.priceItem}>
                                        Notturno: +40%
                                    </Text>
                                )}
                                {estimatedPrice.weekend_bonus && (
                                    <Text style={styles.priceItem}>
                                        Weekend: +25%
                                    </Text>
                                )}
                            </View>

                            <Text style={styles.priceNote}>
                                * Il prezzo finale può variare in base al tecnico e alla complessità dell'intervento
                            </Text>
                        </View>
                    </View>
                )}

                {/* 🚀 PULSANTE CREA PRENOTAZIONE */}
                {selectedCategory && formData.titolo && formData.descrizione && location && (
                    <TouchableOpacity
                        style={[styles.createBookingButton, loading && styles.buttonDisabled]}
                        onPress={handleCreateBooking}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                            <Text style={styles.createBookingText}>
                                🚀 Crea Prenotazione e Trova Tecnici
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.light,
    },
    errorText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 10,
    },
    errorSubtext: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 20,
    },
    errorButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    errorButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 60,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    backButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 80,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    locationCard: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
    refreshButton: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    locationText: {
        fontSize: 14,
        color: COLORS.success,
    },
    locationError: {
        fontSize: 14,
        color: COLORS.danger,
    },
    locationLoading: {
        fontSize: 14,
        color: COLORS.gray,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 15,
    },
    selectedCategoryCard: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    selectedCategoryText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 5,
    },
    selectedCategoryPrice: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 10,
    },
    changeCategoryButton: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    changeCategoryText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    },
    categoriesContainer: {
        minHeight: 200,
        justifyContent: 'center',
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
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.dark,
        textAlign: 'center',
        marginBottom: 5,
    },
    categoryPrice: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '500',
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
    urgencyMultiplier: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 15,
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
    characterCount: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: 'right',
        marginTop: 5,
    },
    priceCard: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.dark,
    },
    finalPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.success,
    },
    priceBreakdown: {
        marginBottom: 10,
    },
    priceItem: {
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 2,
    },
    priceNote: {
        fontSize: 12,
        color: COLORS.gray,
        fontStyle: 'italic',
    },
    createBookingButton: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    createBookingText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});