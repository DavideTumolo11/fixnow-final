// screens/TechnicianMatchingScreen.js - MATCHING TECNICI REALE
// FixNow Sardegna - Sistema Matching Avanzato
// In cima a TechnicianMatchingScreen.js, con gli altri import:
import { supabase } from '../supabaseClient';
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import BookingService from '../services/BookingService';

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

export default function TechnicianMatchingScreen({ route, navigation }) {
    const { prenotazione, userLocation } = route.params;
    const { user, profile } = useAuth();

    const [tecnici, setTecnici] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [acceptingBooking, setAcceptingBooking] = useState(false);

    // 🔄 CARICA TECNICI ALL'AVVIO
    useEffect(() => {
        loadAvailableTechnicians();
    }, []);

    // 🔍 CARICA TECNICI DISPONIBILI
    const loadAvailableTechnicians = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Loading technicians for booking:', prenotazione.codice_prenotazione);

            const result = await BookingService.findAvailableTechnicians(prenotazione, userLocation);

            if (result.success) {
                setTecnici(result.tecnici);
                console.log(`✅ Loaded ${result.tecnici.length} technicians`);
            } else {
                setError(result.error);
                setTecnici([]);
            }

        } catch (error) {
            console.error('❌ Load technicians error:', error);
            setError('Errore durante il caricamento dei tecnici');
            setTecnici([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔄 REFRESH TECNICI
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAvailableTechnicians();
        setRefreshing(false);
    };

    // 👤 SELEZIONA TECNICO
    const handleSelectTechnician = (tecnico) => {
        Alert.alert(
            `🔧 ${tecnico.nome} ${tecnico.cognome}`,
            `⭐ Rating: ${tecnico.rating_medio}/5.0 (${tecnico.numero_interventi_completati} interventi)\n📍 Distanza: ${tecnico.distanza}km\n⏱️ Arrivo stimato: ${tecnico.tempo_arrivo_stimato} minuti\n💰 Prezzo: €${tecnico.prezzo_stimato}\n\nVuoi confermare la scelta di questo tecnico?`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: '✅ Conferma Scelta',
                    onPress: () => confirmTechnicianSelection(tecnico)
                }
            ]
        );
    };

    // ✅ CONFERMA SELEZIONE TECNICO
    const confirmTechnicianSelection = async (tecnico) => {
        try {
            setAcceptingBooking(true);
            setSelectedTechnician(tecnico);

            console.log('✅ Confirming technician selection:', tecnico.nome);

            // Per ora simuliamo l'accettazione automatica
            // In una app reale, il tecnico riceverebbe una notifica e dovrebbe accettare
            const result = await BookingService.acceptBooking(
                prenotazione.id,
                tecnico.id,
                tecnico.tempo_arrivo_stimato
            );

            if (result.success) {
                Alert.alert(
                    '🎉 Tecnico Confermato!',
                    `${tecnico.nome} ${tecnico.cognome} ha accettato la tua richiesta.\n\n⏱️ Arrivo stimato: ${tecnico.tempo_arrivo_stimato} minuti\n💰 Prezzo concordato: €${tecnico.prezzo_stimato}\n\nRiceverai una notifica quando il tecnico sarà in arrivo.`,
                    [
                        {
                            text: '📱 Vai alla Chat',
                            onPress: () => navigation.navigate('BookingChat', {
                                prenotazione: result.prenotazione,
                                tecnico: tecnico
                            })
                        },
                        {
                            text: '📋 Le Mie Prenotazioni',
                            onPress: () => navigation.navigate('MyBookings')
                        }
                    ]
                );
            } else {
                Alert.alert('❌ Errore', result.error || 'Impossibile confermare il tecnico');
            }

        } catch (error) {
            console.error('❌ Confirm technician error:', error);
            Alert.alert('❌ Errore', 'Si è verificato un errore durante la conferma');
        } finally {
            setAcceptingBooking(false);
            setSelectedTechnician(null);
        }
    };

    // 🔄 ESPANDI RICERCA
    const expandSearch = () => {
        Alert.alert(
            '🔍 Espandi Ricerca',
            'Vuoi espandere la ricerca a un raggio maggiore? Questo potrebbe aumentare i tempi di arrivo.',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: '🔍 Espandi a 50km',
                    onPress: () => {
                        // Ricarica con raggio esteso
                        loadAvailableTechnicians();
                    }
                }
            ]
        );
    };

    // 🆘 EMERGENZA SOS
    const handleEmergencySOS = () => {
        Alert.alert(
            '🆘 EMERGENZA SOS',
            'Attivare il servizio emergenza 24/7? Verrà inviata una notifica urgente a tutti i tecnici disponibili nel raggio di 50km.',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: '🚨 ATTIVA SOS',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implementare sistema emergenza
                        Alert.alert('🚨 SOS Attivato', 'Notifica emergenza inviata a tutti i tecnici disponibili!');
                    }
                }
            ]
        );
    };

    // 🏷️ BADGE QUALITÀ TECNICO
    const getBadgeForTechnician = (tecnico) => {
        if (tecnico.rating_medio >= 4.8 && tecnico.numero_interventi_completati >= 100) {
            return { text: '🏆 ECCELLENZA', color: COLORS.success };
        } else if (tecnico.rating_medio >= 4.5) {
            return { text: '⭐ TOP RATED', color: COLORS.warning };
        } else if (tecnico.numero_interventi_completati >= 50) {
            return { text: '💪 ESPERTO', color: COLORS.secondary };
        }
        return null;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>🔍 Cerco i migliori tecnici...</Text>
                <Text style={styles.loadingSubtext}>
                    Analizzando {prenotazione.urgenza === 'emergenza' ? 'emergenza' : 'disponibilità'} e distanza
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 🎯 HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Indietro</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tecnici Disponibili</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* 📊 INFO PRENOTAZIONE */}
            <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>
                    {prenotazione.categorie?.icona || '🔧'} {prenotazione.titolo}
                </Text>
                <Text style={styles.bookingCode}>
                    Codice: {prenotazione.codice_prenotazione}
                </Text>
                <View style={styles.bookingDetails}>
                    <Text style={styles.bookingDetail}>
                        ⏱️ {prenotazione.urgenza === 'emergenza' ? 'EMERGENZA' :
                            prenotazione.urgenza === 'urgente' ? 'URGENTE' : 'NORMALE'}
                    </Text>
                    <Text style={styles.bookingDetail}>
                        📍 {userLocation.address || 'Posizione GPS'}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>❌ {error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadAvailableTechnicians}>
                            <Text style={styles.retryButtonText}>🔄 Riprova</Text>
                        </TouchableOpacity>
                    </View>
                ) : tecnici.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>😔 Nessun tecnico disponibile</Text>
                        <Text style={styles.emptySubtext}>
                            Al momento non ci sono tecnici disponibili nella tua zona per questa categoria.
                        </Text>

                        <View style={styles.emptyActions}>
                            <TouchableOpacity style={styles.expandButton} onPress={expandSearch}>
                                <Text style={styles.expandButtonText}>🔍 Espandi Ricerca</Text>
                            </TouchableOpacity>

                            {prenotazione.urgenza !== 'emergenza' && (
                                <TouchableOpacity style={styles.sosButton} onPress={handleEmergencySOS}>
                                    <Text style={styles.sosButtonText}>🆘 EMERGENZA SOS</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                🎯 {tecnici.length} Tecnici Trovati
                            </Text>
                            <Text style={styles.resultsSubtitle}>
                                Ordinati per compatibilità e rating
                            </Text>
                        </View>

                        {tecnici.map((tecnico, index) => {
                            const badge = getBadgeForTechnician(tecnico);
                            const isSelected = selectedTechnician?.id === tecnico.id;

                            return (
                                <TouchableOpacity
                                    key={tecnico.id}
                                    style={[
                                        styles.technicianCard,
                                        index === 0 && styles.bestMatch,
                                        isSelected && styles.selectedCard
                                    ]}
                                    onPress={() => handleSelectTechnician(tecnico)}
                                    disabled={acceptingBooking}
                                >
                                    {index === 0 && (
                                        <View style={styles.bestMatchBadge}>
                                            <Text style={styles.bestMatchText}>🏆 MIGLIOR MATCH</Text>
                                        </View>
                                    )}

                                    {badge && (
                                        <View style={[styles.qualityBadge, { backgroundColor: badge.color }]}>
                                            <Text style={styles.qualityBadgeText}>{badge.text}</Text>
                                        </View>
                                    )}

                                    <View style={styles.technicianHeader}>
                                        <View style={styles.technicianAvatar}>
                                            <Text style={styles.avatarText}>
                                                {tecnico.nome.charAt(0)}{tecnico.cognome.charAt(0)}
                                            </Text>
                                        </View>

                                        <View style={styles.technicianInfo}>
                                            <Text style={styles.technicianName}>
                                                {tecnico.nome} {tecnico.cognome}
                                            </Text>
                                            <Text style={styles.technicianRating}>
                                                ⭐ {tecnico.rating_medio}/5.0 ({tecnico.numero_interventi_completati} interventi)
                                            </Text>
                                            <Text style={styles.technicianScore}>
                                                🎯 Score: {tecnico.score}/100
                                            </Text>
                                        </View>

                                        <View style={styles.technicianPrice}>
                                            <Text style={styles.priceText}>€{tecnico.prezzo_stimato}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.technicianFooter}>
                                        <View style={styles.footerItem}>
                                            <Text style={styles.footerLabel}>Distanza</Text>
                                            <Text style={styles.footerValue}>📍 {tecnico.distanza}km</Text>
                                        </View>
                                        <View style={styles.footerItem}>
                                            <Text style={styles.footerLabel}>Arrivo</Text>
                                            <Text style={styles.footerValue}>⏱️ {tecnico.tempo_arrivo_stimato} min</Text>
                                        </View>
                                        <View style={styles.footerItem}>
                                            <Text style={styles.footerLabel}>Stato</Text>
                                            <Text style={[styles.footerValue, styles.available]}>
                                                🟢 Disponibile
                                            </Text>
                                        </View>
                                    </View>

                                    {isSelected && acceptingBooking && (
                                        <View style={styles.loadingOverlay}>
                                            <ActivityIndicator color={COLORS.white} size="small" />
                                            <Text style={styles.loadingOverlayText}>Confermando...</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}
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
    bookingInfo: {
        backgroundColor: COLORS.white,
        padding: 15,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    bookingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 5,
    },
    bookingCode: {
        fontSize: 12,
        color: COLORS.gray,
        marginBottom: 8,
    },
    bookingDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bookingDetail: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    errorContainer: {
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.danger,
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 30,
    },
    emptyActions: {
        alignItems: 'center',
        gap: 15,
    },
    expandButton: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    expandButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    sosButton: {
        backgroundColor: COLORS.danger,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    sosButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
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
        position: 'relative',
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
    qualityBadge: {
        position: 'absolute',
        top: -8,
        left: 15,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        zIndex: 1,
    },
    qualityBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    technicianHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
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
    technicianRating: {
        fontSize: 13,
        color: COLORS.gray,
        marginBottom: 2,
    },
    technicianScore: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '500',
    },
    technicianPrice: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    technicianFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerItem: {
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 11,
        color: COLORS.gray,
        marginBottom: 2,
    },
    footerValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.dark,
    },
    available: {
        color: COLORS.success,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    loadingOverlayText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
    },
});