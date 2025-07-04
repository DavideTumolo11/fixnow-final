// hooks/useLocation.js - HOOK GEOLOCALIZZAZIONE
// FixNow Sardegna - Gestione Posizione GPS
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 📍 OTTIENI POSIZIONE CORRENTE
    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📍 Requesting location permissions...');

            // Richiedi permessi
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                throw new Error('Permesso di localizzazione negato. Abilita la posizione nelle impostazioni.');
            }

            console.log('✅ Location permission granted');
            console.log('📍 Getting current position...');

            // Ottieni posizione corrente
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 15000, // 15 secondi timeout
                maximumAge: 10000, // Cache per 10 secondi
            });

            console.log('✅ Position obtained:', position.coords.latitude, position.coords.longitude);

            // Reverse geocoding per indirizzo
            let address = null;
            try {
                console.log('🔍 Getting address from coordinates...');
                const addresses = await Location.reverseGeocodeAsync({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });

                if (addresses && addresses.length > 0) {
                    const addr = addresses[0];
                    address = [
                        addr.street && addr.streetNumber ? `${addr.street} ${addr.streetNumber}` : addr.street,
                        addr.district,
                        addr.city,
                        addr.postalCode
                    ].filter(Boolean).join(', ');

                    console.log('✅ Address resolved:', address);
                }
            } catch (geocodeError) {
                console.log('⚠️ Geocoding failed:', geocodeError.message);
                // Non blocchiamo per errori di geocoding
            }

            const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                address: address || null,
                timestamp: position.timestamp
            };

            setLocation(locationData);
            return locationData;

        } catch (err) {
            console.error('❌ Location error:', err);
            const errorMessage = err.message || 'Impossibile ottenere la posizione';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 🔄 AGGIORNA POSIZIONE
    const refreshLocation = () => {
        getCurrentLocation().catch(() => {
            // Error già gestito in getCurrentLocation
        });
    };

    // 📍 OTTIENI POSIZIONE ALL'AVVIO
    useEffect(() => {
        getCurrentLocation().catch(() => {
            // Error già gestito
        });
    }, []);

    return {
        location,
        loading,
        error,
        refreshLocation,
        getCurrentLocation
    };
};