// screens/PaymentScreen.js - Complete Payment Interface
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePayment } from '../contexts/PaymentContext';
import { calculateCommission, formatAmountForDisplay, PAYMENT_METHODS } from '../lib/stripe';

const { width } = Dimensions.get('window');

const PaymentScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const {
        paymentState,
        initializeEscrowPayment,
        presentEscrowPayment,
        releaseEscrowPayment
    } = usePayment();

    // Dati della prenotazione passati dalla schermata precedente
    const { bookingData, selectedTechnician } = route.params || {};

    const [paymentStep, setPaymentStep] = useState('review'); // review, processing, success, error
    const [paymentBreakdown, setPaymentBreakdown] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Calcola breakdown del pagamento
    useEffect(() => {
        if (bookingData && user) {
            const breakdown = calculateCommission(
                bookingData.prezzoFinale,
                user.tipo_utente
            );
            setPaymentBreakdown(breakdown);
        }
    }, [bookingData, user]);

    // Inizializza pagamento al caricamento
    useEffect(() => {
        initializePayment();
    }, []);

    const initializePayment = async () => {
        if (!bookingData || !user || isInitialized) return;

        console.log('🎯 Initializing payment for booking:', bookingData.id);

        const result = await initializeEscrowPayment(bookingData, user);

        if (result.success) {
            setIsInitialized(true);
            console.log('✅ Payment initialized successfully');
        } else {
            Alert.alert(
                'Errore Pagamento',
                `Impossibile inizializzare il pagamento: ${result.error}`,
                [{ text: 'Riprova', onPress: initializePayment }]
            );
        }
    };

    const handlePayment = async () => {
        if (!isInitialized) {
            Alert.alert('Errore', 'Pagamento non ancora inizializzato');
            return;
        }

        setPaymentStep('processing');

        try {
            console.log('💳 Presenting payment sheet...');
            const result = await presentEscrowPayment();

            if (result.success) {
                setPaymentStep('success');

                // Aggiorna stato prenotazione nel database
                // (questo sarà gestito dal webhook Stripe + database trigger)

                Alert.alert(
                    'Pagamento Completato! 🎉',
                    'I fondi sono stati bloccati in sicurezza. Verranno rilasciati al tecnico solo dopo il completamento del servizio.',
                    [
                        {
                            text: 'Continua',
                            onPress: () => {
                                // Naviga alla chat con il tecnico
                                navigation.replace('ChatScreen', {
                                    bookingId: bookingData.id,
                                    technicianId: selectedTechnician.id,
                                    paymentId: paymentState.paymentIntentId
                                });
                            }
                        }
                    ]
                );
            } else if (result.cancelled) {
                setPaymentStep('review');
                // L'utente ha annullato, torna alla schermata di review
            } else {
                throw new Error(result.error || 'Pagamento fallito');
            }
        } catch (error) {
            console.error('❌ Payment error:', error);
            setPaymentStep('error');
            Alert.alert(
                'Errore Pagamento',
                error.message || 'Si è verificato un errore durante il pagamento. Riprova.',
                [
                    { text: 'Riprova', onPress: () => setPaymentStep('review') },
                    { text: 'Annulla', onPress: () => navigation.goBack() }
                ]
            );
        }
    };

    const PaymentMethodItem = ({ method, icon, name }) => (
        <View style={styles.paymentMethodItem}>
            <Text style={styles.paymentMethodIcon}>{icon}</Text>
            <Text style={styles.paymentMethodName}>{name}</Text>
            <View style={styles.paymentMethodBadge}>
                <Text style={styles.paymentMethodBadgeText}>Sicuro</Text>
            </View>
        </View>
    );

    const PriceBreakdownRow = ({ label, amount, isTotal = false }) => (
        <View style={[styles.priceRow, isTotal && styles.priceRowTotal]}>
            <Text style={[styles.priceLabel, isTotal && styles.priceLabelTotal]}>
                {label}
            </Text>
            <Text style={[styles.priceAmount, isTotal && styles.priceAmountTotal]}>
                €{amount.toFixed(2)}
            </Text>
        </View>
    );

    if (!bookingData || !selectedTechnician || !paymentBreakdown) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Caricamento pagamento...</Text>
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
                <Text style={styles.headerTitle}>Pagamento Sicuro</Text>
                <View style={styles.securityBadge}>
                    <Text style={styles.securityBadgeText}>🔒 SSL</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Service Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Riepilogo Servizio</Text>
                    <View style={styles.serviceCard}>
                        <View style={styles.serviceHeader}>
                            <Text style={styles.serviceName}>{bookingData.categoria_nome}</Text>
                            <View style={[
                                styles.urgencyBadge,
                                bookingData.urgenza === 'normale' && styles.urgencyNormal,
                                bookingData.urgenza === 'urgente' && styles.urgencyUrgent,
                                bookingData.urgenza === 'emergenza' && styles.urgencyEmergency
                            ]}>
                                <Text style={styles.urgencyText}>
                                    {bookingData.urgenza.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.serviceDescription}>{bookingData.titolo}</Text>
                        <Text style={styles.serviceLocation}>📍 {bookingData.indirizzo}</Text>
                    </View>
                </View>

                {/* Technician Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tecnico Selezionato</Text>
                    <View style={styles.technicianCard}>
                        <View style={styles.technicianInfo}>
                            <Text style={styles.technicianName}>{selectedTechnician.nome}</Text>
                            <View style={styles.technicianRating}>
                                <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
                                <Text style={styles.ratingText}>
                                    {selectedTechnician.rating}/5 ({selectedTechnician.reviews} recensioni)
                                </Text>
                            </View>
                            <Text style={styles.technicianDistance}>
                                📍 {selectedTechnician.distanza}km di distanza
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Price Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dettaglio Prezzo</Text>
                    <View style={styles.priceCard}>
                        <PriceBreakdownRow
                            label="Servizio base"
                            amount={bookingData.prezzoBase}
                        />

                        {bookingData.urgenza !== 'normale' && (
                            <PriceBreakdownRow
                                label={`Maggiorazione ${bookingData.urgenza}`}
                                amount={bookingData.prezzoFinale - bookingData.prezzoBase}
                            />
                        )}

                        {user.tipo_utente === 'hotel' && (
                            <PriceBreakdownRow
                                label="Sconto contratto hotel (-10%)"
                                amount={-(bookingData.prezzoBase * 0.1)}
                            />
                        )}

                        <View style={styles.priceDivider} />

                        <PriceBreakdownRow
                            label="Totale da pagare"
                            amount={paymentBreakdown.totalAmount}
                            isTotal={true}
                        />

                        <View style={styles.priceNote}>
                            <Text style={styles.priceNoteText}>
                                Include commissione FixNow {paymentBreakdown.commissionRate}%
                                (€{paymentBreakdown.commission.toFixed(2)})
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Escrow Protection Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🛡️ Protezione Escrow</Text>
                    <View style={styles.escrowCard}>
                        <Text style={styles.escrowTitle}>I tuoi soldi sono protetti</Text>
                        <Text style={styles.escrowDescription}>
                            Il pagamento viene bloccato in sicurezza e rilasciato al tecnico solo dopo
                            la conferma del completamento del servizio. Se qualcosa va storto,
                            riceverai un rimborso completo.
                        </Text>
                        <View style={styles.escrowFeatures}>
                            <Text style={styles.escrowFeature}>✅ Rimborso garantito</Text>
                            <Text style={styles.escrowFeature}>✅ Pagamento sicuro</Text>
                            <Text style={styles.escrowFeature}>✅ Protezione dispute</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Metodi di Pagamento Accettati</Text>
                    <View style={styles.paymentMethodsCard}>
                        <PaymentMethodItem
                            method="card"
                            icon="💳"
                            name="Carta di Credito/Debito"
                        />
                        <PaymentMethodItem
                            method="apple_pay"
                            icon="📱"
                            name="Apple Pay"
                        />
                        <PaymentMethodItem
                            method="google_pay"
                            icon="📲"
                            name="Google Pay"
                        />
                        <PaymentMethodItem
                            method="sepa"
                            icon="🏧"
                            name="Bonifico SEPA"
                        />
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Payment Button */}
            <View style={styles.bottomContainer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Totale da pagare:</Text>
                    <Text style={styles.totalAmount}>
                        €{paymentBreakdown.totalAmount.toFixed(2)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.payButton,
                        (!isInitialized || paymentState.loading) && styles.payButtonDisabled
                    ]}
                    onPress={handlePayment}
                    disabled={!isInitialized || paymentState.loading}
                >
                    {paymentStep === 'processing' ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            🛡️ Paga in Sicurezza con Escrow
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.securityText}>
                    🔒 Pagamento crittografato SSL • Powered by Stripe
                </Text>
            </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
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
    },
    backButtonText: {
        fontSize: 20,
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    securityBadge: {
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    securityBadgeText: {
        fontSize: 12,
        color: '#2d5f2d',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginVertical: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    serviceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    urgencyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    urgencyNormal: {
        backgroundColor: '#e8f5e8',
    },
    urgencyUrgent: {
        backgroundColor: '#fff3cd',
    },
    urgencyEmergency: {
        backgroundColor: '#f8d7da',
    },
    urgencyText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#333',
    },
    serviceDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    serviceLocation: {
        fontSize: 14,
        color: '#007AFF',
    },
    technicianCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    technicianInfo: {
        flex: 1,
    },
    technicianName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    technicianRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingStars: {
        fontSize: 14,
        marginRight: 8,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
    },
    technicianDistance: {
        fontSize: 14,
        color: '#007AFF',
    },
    priceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    priceRowTotal: {
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
        marginTop: 8,
        paddingTop: 16,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceLabelTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    priceAmount: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    priceAmountTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007AFF',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#e1e8ed',
        marginVertical: 8,
    },
    priceNote: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    priceNoteText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    escrowCard: {
        backgroundColor: '#f0f8ff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    escrowTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 8,
    },
    escrowDescription: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 12,
    },
    escrowFeatures: {
        gap: 4,
    },
    escrowFeature: {
        fontSize: 14,
        color: '#333',
    },
    paymentMethodsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    paymentMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    paymentMethodIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    paymentMethodName: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    paymentMethodBadge: {
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paymentMethodBadgeText: {
        fontSize: 12,
        color: '#2d5f2d',
        fontWeight: '600',
    },
    bottomContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF',
    },
    payButton: {
        backgroundColor: '#007AFF',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 8,
    },
    payButtonDisabled: {
        backgroundColor: '#ccc',
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    securityText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default PaymentScreen;