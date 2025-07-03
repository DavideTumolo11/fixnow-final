// lib/stripe.js - Configurazione Stripe per FixNow Sardegna

// 🔒 Configurazione sicura da environment variables
export const STRIPE_CONFIG = {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    merchantId: 'merchant.com.fixnow.sardegna',
    merchantDisplayName: 'FixNow Sardegna',
    currency: 'EUR',
    supportedCountries: ['IT'],
    captureMethod: 'manual',
    confirmationMethod: 'manual'
};

// 🧮 Calcolo commissioni
export const calculateCommission = (amount, userType = 'cliente', urgency = 'normale') => {
    const baseCommission = userType === 'hotel' ? 0.06 : 0.08;
    let urgencyMultiplier = 1.0;

    if (urgency === 'emergenza') urgencyMultiplier = 2.0;
    else if (urgency === 'urgente') urgencyMultiplier = 1.3;

    const finalAmount = amount * urgencyMultiplier;
    const commissionAmount = finalAmount * baseCommission;
    const technicianAmount = finalAmount - commissionAmount;

    return {
        originalAmount: amount,
        finalAmount: Math.round(finalAmount * 100) / 100,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        technicianAmount: Math.round(technicianAmount * 100) / 100,
        urgencyMultiplier: urgencyMultiplier,
        commissionRate: baseCommission
    };
};

// 💳 Utility functions
export const formatAmountForStripe = (amount) => Math.round(amount * 100);
export const formatAmountForDisplay = (amount) => (amount / 100).toFixed(2);
export const formatEuroForDisplay = (amount) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

// 📋 Payment Intent helper
export const createPaymentIntentData = (bookingData, userProfile) => {
    const pricing = calculateCommission(
        bookingData.prezzoFinale || 100,
        userProfile.tipo_utente,
        bookingData.urgenza
    );

    return {
        amount: formatAmountForStripe(pricing.finalAmount),
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        payment_method_options: {
            card: {
                capture_method: 'manual',
                statement_descriptor_suffix: 'FIXNOW'
            }
        },
        metadata: {
            booking_id: bookingData.id,
            cliente_id: userProfile.id,
            service_type: bookingData.categoria_nome,
            urgency: bookingData.urgenza,
            user_type: userProfile.tipo_utente
        },
        description: `FixNow: ${bookingData.categoria_nome} - ${bookingData.titolo}`,
        statement_descriptor: 'FIXNOW SRDGN'
    };
};

// ✅ Validazione
export const validateStripeConfig = () => {
    if (!STRIPE_CONFIG.publishableKey) {
        throw new Error('STRIPE_PUBLISHABLE_KEY mancante nel file .env');
    }
    return true;
};

export default {
    STRIPE_CONFIG,
    calculateCommission,
    formatAmountForStripe,
    formatAmountForDisplay,
    formatEuroForDisplay,
    createPaymentIntentData,
    validateStripeConfig
};