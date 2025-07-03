// screens/TechnicianMatchingScreen.js
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
    StatusBar,
    ActivityIndicator,
    Image
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// FixNow Colors
const COLORS = {
    primary: '#FF6B35',
    secondary: '#2E86AB',
    success: '#4CAF50',
    warning: '#FF9800',
    dark: '#1A1A1A',
    light: '#F5F5F5',
    white: '#FFFFFF',
    gray: '#757575'
};

// Dati mock tecnici (in produzione verranno da Supabase)
const MOCK_TECHNICIANS = [
    {
        id: 1,
        nome: 'Mario',
        cognome: 'Bianchi',
        specializzazioni: ['Idraulico & Termoidraulico'],
        rating: 4.8,
        numeroInterventi: 127,
        distanza: 2.3,
        tempoArrivo: 15,
        prezzoBase: 75,
        disponibile: true,
        foto: null,
        descrizione: 'Idraulico specializzato in emergenze. Disponibile 24/7.',
        certificazioni: ['Abilitazione impianti gas', 'Corso emergenze'],
        ultimiLavori: 3
    },
    {
        id: 2,
        nome: 'Giuseppe',
        cognome: 'Rossi',
        specializzazioni: ['Idraulico & Termoidraulico', 'Condizionatori'],
        rating: 4.9,
        numeroInterventi: 89,
        distanza: 3.7,
        tempoArrivo: 22,
        prezzoBase: 80,
        disponibile: true,
        foto: null,
        descrizione: 'Esperto in climatizzazione e impianti idrici. Servizio rapido.',
        certificazioni: ['Patentino F-Gas', 'Abilitazione caldaie'],
        ultimiLavori: 1
    },
    {
        id: 3,
        nome: 'Antonio',
        cognome: 'Serra',
        specializzazioni: ['Idraulico & Termoidraulico'],
        rating: 4.6,
        numeroInterventi: 156,
        distanza: 5.2,
        tempoArrivo: 35,
        prezzoBase: 70,
        disponibile: true,
        foto: null,
        descrizione: 'Idraulico tradizionale con esperienza trentennale.',
        certificazioni: ['Abilitazione impianti'],
        ultimiLavori: 7
    },
    {
        id: 4,
        nome: 'Luca',
        cognome: 'Murgia',
        specializzazioni: ['Idraulico & Termoidraulico', 'Elettricista'],
        rating: 4.7,
        numeroInterventi: 203,
        distanza: 6.8,
        tempoArrivo: 40,
        prezzoBase: 85,
        disponibile: true,
        foto: null,
        descrizione: 'Tecnico multidisciplinare. Risolvo problemi complessi.',
        certificazioni: ['PES/PAV Elettricista', 'Abilitazione gas'],
        ultimiLavori: 2
    },
    {
        id: 5,
        nome: 'Francesco',
        cognome: 'Lai',
        specializzazioni: ['Idraulico & Termoidraulico'],
        rating: 4.5,
        numeroInterventi: 67,
        distanza: 8.1,
        tempoArrivo: 50,
        prezzoBase: 65,
        disponibile: true,
        foto: null,
        descrizione: 'Giovane tecnico dinamico. Prezzi competitivi.',
        certificazioni: ['Abilitazione base'],
        ultimiLavori: 5
    }
];

export default function TechnicianMatchingScreen({ navigation, route }) {
    const { user, userType } = useAuth();
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [bookingData, setBookingData] = useState(null);

    // Riceve i dati della prenotazione dallo screen precedente
    useEffect(() => {
        if (route?.params?.bookingData) {
            setBookingData(route.params.bookingData);
            findMatchingTechnicians(route.params.bookingData);
        }
    }, [route?.params]);

    // Algoritmo di matching intelligente
    const findMatchingTechnicians = async (booking) => {
        try {
            setLoading(true);
            console.log('🔍 Finding technicians for:', booking);

            // Simula chiamata API con delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Algoritmo di scoring
            const scoredTechnicians = MOCK_TECHNICIANS
                .filter(tech =>
                    // Filtra per specializzazione
                    tech.specializzazioni.includes(booking.categoria.nome) &&
                    // Filtra per disponibilità
                    tech.disponibile &&
                    // Filtra per raggio azione (max 20km)
                    tech.distanza <= 20
                )
                .map(tech => ({
                    ...tech,
                    // Calcola prezzo finale con maggiorazioni
                    prezzoFinale: calculateFinalPrice(tech.prezzoBase, booking.urgenza, booking.userType),
                    // Calcola score di matching
                    matchScore: calculateMatchScore(tech, booking)
                }))
                .sort((a, b) => b.matchScore - a.matchScore) // Ordina per score
                .slice(0, 5); // Prendi i migliori 5

            setTechnicians(scoredTechnicians);
            console.log('✅ Found technicians:', scoredTechnicians.length);

        } catch (error) {
            console.error('❌ Matching error:', error);
            Alert.alert('❌ Errore', 'Errore durante la ricerca tecnici. Riprova.', [{ text: 'OK' }]);
        } finally {
            setLoading(false);
        }
    };

    // Calcola prezzo finale con maggiorazioni
    const calculateFinalPrice = (basePrice, urgency, userType) => {
        let multiplier = 1;

        // Maggiorazione urgenza
        if (urgency === 'urgente') multiplier += 0.3;
        if (urgency === 'emergenza') multiplier += 1.0;

        // Sconto hotel per contratti B2B
        if (userType === 'hotel') multiplier *= 0.9;

        return Math.round(basePrice * multiplier);
    };

    // Algoritmo di scoring per matching
    const calculateMatchScore = (tech, booking) => {
        let score = 0;

        // Rating (40% del peso)
        score += (tech.rating / 5) * 40;

        // Distanza (30% del peso) - più vicino = meglio
        const distanceScore = Math.max(0, (20 - tech.distanza) / 20);
        score += distanceScore * 30;

        // Esperienza (20% del peso)
        const experienceScore = Math.min(tech.numeroInterventi / 200, 1);
        score += experienceScore * 20;

        // Prezzo competitivo (10% del peso) - più basso = meglio
        const avgPrice = 75; // Prezzo medio di categoria
        const priceScore = Math.max(0, (avgPrice - tech.prezzoBase) / avgPrice);
        score += priceScore * 10;

        // Bonus per disponibilità recente
        if (tech.ultimiLavori <= 2) score += 5;

        // Bonus per specializzazioni multiple
        if (tech.specializzazioni.length > 1) score += 3;

        return Math.round(score);
    };

    // Gestisce la selezione del tecnico
    const handleSelectTechnician = (tech) => {
        Alert.alert(
            `🔧 ${tech.nome} ${tech.cognome}`,
            `Rating: ${tech.rating}⭐ (${tech.numeroInterventi} interventi)\nDistanza: ${tech.distanza}km\nArrivo stimato: ${tech.tempoArrivo} minuti\nPrezzo: €${tech.prezzoFinale}\n\nConfermi la scelta?`,
            [
                { text: 'Vedi Dettagli', onPress: () => showTechnicianDetails(tech) },
                { text: 'Annulla', style: 'cancel' },
                { text: '✅ Conferma', onPress: () => confirmTechnician(tech) }
            ]
        );
    };

    // Mostra dettagli tecnico
    const showTechnicianDetails = (tech) => {
        Alert.alert(
            `👤 ${tech.nome} ${tech.cognome}`,
            `${tech.descrizione}\n\nCertificazioni:\n${tech.certificazioni.join('\n')}\n\nUltimi lavori: ${tech.ultimiLavori} giorni fa\n\nSpecializzazioni:\n${tech.specializzazioni.join('\n')}`,
            [
                { text: 'Indietro', style: 'cancel' },
                { text: '✅ Scegli Questo', onPress: () => confirmTechnician(tech) }
            ]
        );
    };

    // Conferma selezione tecnico
    const confirmTechnician = (tech) => {
        setSelectedTechnician(tech);

        Alert.alert(
            '✅ Tecnico Confermato!',
            `${tech.nome} ${tech.cognome} è stato notificato della tua richiesta.\n\nRiceverai conferma entro ${tech.tempoArrivo} minuti.\n\nPuoi contattarlo tramite chat una volta accettata la richiesta.`,
            [
                { text: '💬 Vai alla Chat', onPress: () => navigation?.navigate('Chat') },
                { text: '📋 Le Mie Prenotazioni', onPress: () => navigation?.navigate('Bookings') }
            ]
        );
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>🔍 Cerco i migliori tecnici...</Text>
                <Text style={styles.loadingSubtext}>
                    Sto analizzando disponibilità, distanza e rating
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation?.goBack()}
                >
                    <Text style={styles.backButtonText}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tecnici Disponibili</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Booking Summary */}
            {bookingData && (
                <View style={styles.bookingSummary}>
                    <Text style={styles.summaryTitle}>
                        📋 {bookingData.categoria?.nome}
                    </Text>
                    <Text style={styles.summaryDetails}>
                        {bookingData.urgenza === 'emergenza' ? '🔴 EMERGENZA' :
                            bookingData.urgenza === 'urgente' ? '🟡 URGENTE' : '🟢 NORMALE'} •
                        Budget max: €{bookingData.maxBudget}
                    </Text>
                </View>
            )}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Results Header */}
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>
                        🎯 {technicians.length} Tecnici Trovati
                    </Text>
                    <Text style={styles.resultsSubtitle}>
                        Ordinati per compatibilità, rating e distanza
                    </Text>
                </View>

                {/* Technicians List */}
                {technicians.map((tech, index) => (
                    <TouchableOpacity
                        key={tech.id}
                        style={[
                            styles.technicianCard,
                            index === 0 && styles.bestMatch,
                            selectedTechnician?.id === tech.id && styles.selectedCard
                        ]}
                        onPress={() => handleSelectTechnician(tech)}
                    >
                        {/* Best Match Badge */}
                        {index === 0 && (
                            <View style={styles.bestMatchBadge}>
                                <Text style={styles.bestMatchText}>🏆 MIGLIOR MATCH</Text>
                            </View>
                        )}

                        <View style={styles.technicianHeader}>
                            <View style={styles.technicianAvatar}>
                                <Text style={styles.avatarText}>
                                    {tech.nome.charAt(0)}{tech.cognome.charAt(0)}
                                </Text>
                            </View>
                            <View style={styles.technicianInfo}>
                                <Text style={styles.technicianName}>
                                    {tech.nome} {tech.cognome}
                                </Text>
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.rating}>⭐ {tech.rating}</Text>
                                    <Text style={styles.interventions}>
                                        ({tech.numeroInterventi} interventi)
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.price}>€{tech.prezzoFinale}</Text>
                                <Text style={styles.priceLabel}>totale</Text>
                            </View>
                        </View>

                        <Text style={styles.description}>{tech.descrizione}</Text>

                        <View style={styles.technicianFooter}>
                            <View style={styles.footerItem}>
                                <Text style={styles.footerIcon}>📍</Text>
                                <Text style={styles.footerText}>{tech.distanza}km</Text>
                            </View>
                            <View style={styles.footerItem}>
                                <Text style={styles.footerIcon}>⏱️</Text>
                                <Text style={styles.footerText}>{tech.tempoArrivo} min</Text>
                            </View>
                            <View style={styles.footerItem}>
                                <Text style={styles.footerIcon}>🏆</Text>
                                <Text style={styles.footerText}>Match {tech.matchScore}%</Text>
                            </View>
                            <View style={styles.footerItem}>
                                <Text style={styles.footerIcon}>🔧</Text>
                                <Text style={styles.footerText}>{tech.ultimiLavori}d fa</Text>
                            </View>
                        </View>

                        <View style={styles.specializations}>
                            {tech.specializzazioni.map((spec, i) => (
                                <View key={i} style={styles.specializationBadge}>
                                    <Text style={styles.specializationText}>{spec}</Text>
                                </View>
                            ))}
                        </View>

                    </TouchableOpacity>
                ))}

                {/* No Results */}
                {technicians.length === 0 && (
                    <View style={styles.noResults}>
                        <Text style={styles.noResultsTitle}>😕 Nessun tecnico disponibile</Text>
                        <Text style={styles.noResultsText}>
                            Non ci sono tecnici disponibili al momento per questa categoria.
                            Prova ad aumentare il budget o cambiare il livello di urgenza.
                        </Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => navigation?.goBack()}
                        >
                            <Text style={styles.retryButtonText}>🔄 Modifica Richiesta</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Footer */}
                <View style={styles.infoFooter}>
                    <Text style={styles.infoTitle}>💡 Come scegliere:</Text>
                    <Text style={styles.infoText}>• Rating alto = qualità garantita</Text>
                    <Text style={styles.infoText}>• Distanza bassa = arrivo veloce</Text>
                    <Text style={styles.infoText}>• Match % = compatibilità totale</Text>
                    <Text style={styles.infoText}>• Giorni fa = attività recente</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.light,
        padding: 20,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
        marginTop: 20,
        textAlign: 'center',
    },
    loadingSubtext: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 10,
        textAlign: 'center',
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
    bookingSummary: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.light,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    summaryDetails: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 3,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    resultsHeader: {
        marginBottom: 20,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    resultsSubtitle: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 5,
    },
    technicianCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: COLORS.light,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bestMatch: {
        borderColor: COLORS.success,
        backgroundColor: '#F8FFF8',
    },
    selectedCard: {
        borderColor: COLORS.primary,
        backgroundColor: '#FFF5F2',
    },
    bestMatchBadge: {
        position: 'absolute',
        top: -8,
        right: 15,
        backgroundColor: COLORS.success,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 1,
    },
    bestMatchText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: 'bold',
    },
    technicianHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    technicianAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    technicianInfo: {
        flex: 1,
    },
    technicianName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 3,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.warning,
        marginRight: 5,
    },
    interventions: {
        fontSize: 12,
        color: COLORS.gray,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    priceLabel: {
        fontSize: 12,
        color: COLORS.gray,
    },
    description: {
        fontSize: 14,
        color: COLORS.dark,
        marginBottom: 12,
        lineHeight: 20,
    },
    technicianFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.gray,
        fontWeight: '500',
    },
    specializations: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    specializationBadge: {
        backgroundColor: COLORS.light,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    specializationText: {
        fontSize: 11,
        color: COLORS.dark,
        fontWeight: '500',
    },
    noResults: {
        backgroundColor: COLORS.white,
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    noResultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 10,
    },
    noResultsText: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    infoFooter: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: COLORS.gray,
        marginBottom: 3,
        paddingLeft: 5,
    },
});