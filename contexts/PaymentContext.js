// contexts/PaymentContext.js - Gestione Stato Pagamenti FixNow
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../supabaseClient';
import {
    calculateCommission,
    formatAmountForStripe,
    createPaymentIntentData,
    ESCROW_STATES,
    validateStripeConfig
} from '../lib/stripe';

const PaymentContext = createContext({});

export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within PaymentProvider');
    }
    return context;
};

export const PaymentProvider = ({ children }) => {
    const [paymentState, setPaymentState] = useState({
        loading: false,
        currentPayment: null,
        paymentIntentId: null,
        escrowStatus: null,
        error: null,
        transactionHistory: [],
        pricing: null
    });

    const { initPaymentSheet, presentPaymentSheet, confirmPayment, handleNextAction } = useStripe();

    // 🔄 INIZIALIZZA PAGAMENTO ESCROW
    const initializeEscrowPayment = useCallback(async (bookingData, userProfile, technicianData) => {
        try {
            setPaymentState(prev => ({ ...prev, loading: true, error: null }));

            console.log('💳 Initializing escrow payment...');

            // Validazione configurazione
            validateStripeConfig();

            // Calcola pricing dettagliato
            const pricing = calculateCommission(
                bookingData.prezzoFinale || bookingData.prezzo_base?.[1] || 100,
                userProfile.tipo_utente,
                bookingData.urgenza
            );

            console.log('💰 Payment pricing:', pricing);

            // Crea dati per Payment Intent
            const paymentIntentData = createPaymentIntentData(bookingData, userProfile, technicianData);

            // 🌐 Crea Payment Intent tramite Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                body: paymentIntentData
            });

            if (error) {
                throw new Error(`Payment Intent creation failed: ${error.message}`);
            }

            const { client_secret, payment_intent_id } = data;

            if (!client_secret || !payment_intent_id) {
                throw new Error('Invalid response from payment service');
            }

            // 📱 Inizializza Stripe Payment Sheet
            const { error: sheetError } = await initPaymentSheet({
                paymentIntentClientSecret: client_secret,
                merchantDisplayName: 'FixNow Sardegna',
                style: 'automatic',
                appearance: {
                    primaryButton: {
                        colors: {
                            background: '#FF6B35', // FixNow primary color
                            text: '#FFFFFF'
                        }
                    }
                },
                googlePay: {
                    merchantCountryCode: 'IT',
                    testEnv: __DEV__, // Solo per development
                    currencyCode: 'EUR'
                },
                applePay: {
                    merchantCountryCode: 'IT',
                    currencyCode: 'EUR'
                },
                allowsDelayedPaymentMethods: false,
                returnURL: 'fixnow://payment-return',
            });

            if (sheetError) {
                throw new Error(`Payment Sheet initialization failed: ${sheetError.message}`);
            }

            // 💾 Salva payment record nel database
            const { error: dbError } = await supabase
                .from('payments')
                .insert({
                    payment_intent_id,
                    booking_id: bookingData.id || `booking_${Date.now()}`,
                    cliente_id: userProfile.id,
                    tecnico_id: technicianData?.id || null,
                    amount_total: pricing.finalAmount,
                    amount_base: pricing.baseAmount,
                    amount_commission: pricing.commission,
                    amount_technician: pricing.technicianAmount,
                    urgency_multiplier: pricing.urgencyMultiplier,
                    commission_rate: pricing.commissionRate,
                    status: ESCROW_STATES.PENDING,
                    user_type: userProfile.tipo_utente,
                    service_category: bookingData.categoria_nome,
                    urgency_level: bookingData.urgenza,
                    metadata: {
                        client_secret,
                        service_details: bookingData.titolo,
                        location: bookingData.indirizzo,
                        technician_name: technicianData?.nome,
                        app_version: '1.0.0',
                        payment_method_types: ['card', 'apple_pay', 'google_pay']
                    },
                    created_at: new Date().toISOString()
                });

            if (dbError) {
                console.error('❌ Database payment record error:', dbError);
                // Non blocchiamo per errori DB, continuiamo con Stripe
            }

            // ✅ Aggiorna stato
            setPaymentState(prev => ({
                ...prev,
                loading: false,
                paymentIntentId: payment_intent_id,
                pricing,
                currentPayment: {
                    bookingId: bookingData.id,
                    clientSecret: client_secret,
                    ...pricing
                }
            }));

            console.log('✅ Payment initialized successfully');
            return {
                success: true,
                paymentIntentId: payment_intent_id,
                pricing
            };

        } catch (error) {
            console.error('❌ Payment initialization error:', error);
            setPaymentState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, [initPaymentSheet]);

    // 💳 PRESENTA PAYMENT SHEET all'utente
    const presentEscrowPayment = useCallback(async () => {
        try {
            setPaymentState(prev => ({ ...prev, loading: true }));

            console.log('📱 Presenting payment sheet...');

            const { error } = await presentPaymentSheet();

            if (error) {
                if (error.code === 'Canceled') {
                    console.log('💭 Payment canceled by user');
                    setPaymentState(prev => ({ ...prev, loading: false }));
                    return { success: false, cancelled: true };
                } else {
                    throw new Error(error.message);
                }
            }

            // ✅ Pagamento completato con successo
            console.log('✅ Payment completed successfully');

            // Aggiorna stato nel database
            if (paymentState.paymentIntentId) {
                await supabase
                    .from('payments')
                    .update({
                        status: ESCROW_STATES.AUTHORIZED,
                        authorized_at: new Date().toISOString()
                    })
                    .eq('payment_intent_id', paymentState.paymentIntentId);
            }

            setPaymentState(prev => ({
                ...prev,
                loading: false,
                escrowStatus: ESCROW_STATES.AUTHORIZED
            }));

            return { success: true };

        } catch (error) {
            console.error('❌ Payment presentation error:', error);
            setPaymentState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, [presentPaymentSheet, paymentState.paymentIntentId]);

    // 🔓 RILASCIA PAGAMENTO (quando servizio completato)
    const releaseEscrowPayment = useCallback(async (paymentIntentId, completionData) => {
        try {
            setPaymentState(prev => ({ ...prev, loading: true }));

            console.log('🔓 Releasing escrow payment...');

            // Rilascia tramite Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('release-escrow-payment', {
                body: {
                    payment_intent_id: paymentIntentId,
                    completion_data: completionData
                }
            });

            if (error) {
                throw new Error(`Escrow release failed: ${error.message}`);
            }

            // Aggiorna stato nel database
            await supabase
                .from('payments')
                .update({
                    status: ESCROW_STATES.RELEASED,
                    released_at: new Date().toISOString(),
                    completion_data: completionData
                })
                .eq('payment_intent_id', paymentIntentId);

            setPaymentState(prev => ({
                ...prev,
                loading: false,
                escrowStatus: ESCROW_STATES.RELEASED
            }));

            console.log('✅ Escrow payment released');
            return { success: true };

        } catch (error) {
            console.error('❌ Escrow release error:', error);
            setPaymentState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, []);

    // 💸 RIMBORSA PAGAMENTO (in caso di cancellazione)
    const refundEscrowPayment = useCallback(async (paymentIntentId, refundReason) => {
        try {
            setPaymentState(prev => ({ ...prev, loading: true }));

            console.log('💸 Processing refund...');

            // Rimborsa tramite Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('refund-escrow-payment', {
                body: {
                    payment_intent_id: paymentIntentId,
                    reason: refundReason
                }
            });

            if (error) {
                throw new Error(`Refund failed: ${error.message}`);
            }

            // Aggiorna stato nel database
            await supabase
                .from('payments')
                .update({
                    status: ESCROW_STATES.REFUNDED,
                    refunded_at: new Date().toISOString(),
                    refund_reason: refundReason
                })
                .eq('payment_intent_id', paymentIntentId);

            setPaymentState(prev => ({
                ...prev,
                loading: false,
                escrowStatus: ESCROW_STATES.REFUNDED
            }));

            console.log('✅ Refund processed successfully');
            return { success: true };

        } catch (error) {
            console.error('❌ Refund error:', error);
            setPaymentState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, []);

    // 📊 OTTIENI STORICO PAGAMENTI
    const getPaymentHistory = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
          *,
          booking:prenotazioni(titolo, categoria_nome, data_richiesta),
          technician:profili!tecnico_id(nome, cognome)
        `)
                .eq('cliente_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Failed to fetch payment history: ${error.message}`);
            }

            setPaymentState(prev => ({
                ...prev,
                transactionHistory: data || []
            }));

            return { success: true, data };

        } catch (error) {
            console.error('❌ Payment history error:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // 🔄 RESET STATO PAGAMENTO
    const resetPaymentState = useCallback(() => {
        setPaymentState({
            loading: false,
            currentPayment: null,
            paymentIntentId: null,
            escrowStatus: null,
            error: null,
            transactionHistory: [],
            pricing: null
        });
    }, []);

    const contextValue = {
        // State
        paymentState,

        // Actions
        initializeEscrowPayment,
        presentEscrowPayment,
        releaseEscrowPayment,
        refundEscrowPayment,
        getPaymentHistory,
        resetPaymentState,

        // Utils
        calculateCommission,
        ESCROW_STATES
    };

    return (
        <PaymentContext.Provider value={contextValue}>
            {children}
        </PaymentContext.Provider>
    );
};

export default PaymentContext;