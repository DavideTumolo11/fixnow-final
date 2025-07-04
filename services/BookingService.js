// services/BookingService.js - SISTEMA PRENOTAZIONI REALE
// FixNow Sardegna - Gestione Completa Prenotazioni
import { supabase } from '../supabaseClient';

// 🎯 CONFIGURAZIONE PRENOTAZIONI
const BOOKING_CONFIG = {
    maxSearchRadius: 50, // km massimi per ricerca tecnici
    minSearchRadius: 5,  // km minimi per ricerca tecnici  
    maxTechnicians: 5,   // massimo tecnici da mostrare
    urgencyTimeouts: {
        normale: 4 * 60 * 60 * 1000,    // 4 ore in millisecondi
        urgente: 1 * 60 * 60 * 1000,    // 1 ora in millisecondi
        emergenza: 15 * 60 * 1000       // 15 minuti in millisecondi
    },
    commissionRates: {
        domestico: 0.08,    // 8% per domestico
        alberghiero: 0.06   // 6% per hotel
    }
};

// 🏗️ UTILITY FUNCTIONS
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Raggio Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const generateBookingCode = () => {
    return 'FN' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

const calculatePrice = (basePrice, urgency, settore, timeOfDay, isWeekend) => {
    let finalPrice = basePrice;
    let maggiorazioni = [];

    // Maggiorazione urgenza
    switch (urgency) {
        case 'urgente':
            finalPrice *= 1.3;
            maggiorazioni.push({ tipo: 'urgenza', fattore: 1.3, descrizione: 'Servizio urgente' });
            break;
        case 'emergenza':
            finalPrice *= 2.0;
            maggiorazioni.push({ tipo: 'emergenza', fattore: 2.0, descrizione: 'Emergenza 24/7' });
            break;
    }

    // Maggiorazione settore hotel
    if (settore === 'alberghiero') {
        finalPrice *= 1.3;
        maggiorazioni.push({ tipo: 'hotel', fattore: 1.3, descrizione: 'Settore alberghiero' });
    }

    // Maggiorazione orario notturno (22:00-06:00)
    if (timeOfDay < 6 || timeOfDay >= 22) {
        finalPrice *= 1.4;
        maggiorazioni.push({ tipo: 'notturno', fattore: 1.4, descrizione: 'Orario notturno' });
    }

    // Maggiorazione weekend
    if (isWeekend) {
        finalPrice *= 1.25;
        maggiorazioni.push({ tipo: 'weekend', fattore: 1.25, descrizione: 'Weekend' });
    }

    return {
        prezzo_finale: Math.round(finalPrice * 100) / 100,
        prezzo_base: basePrice,
        maggiorazioni
    };
};

class BookingService {
    // 📝 CREA NUOVA PRENOTAZIONE
    static async createBooking(bookingData, userLocation, userProfile) {
        try {
            console.log('📝 Creating new booking:', bookingData.titolo);

            // Validazione input
            if (!bookingData.categoria_id || !bookingData.titolo || !bookingData.descrizione) {
                throw new Error('Dati prenotazione incompleti');
            }

            if (!userLocation?.latitude || !userLocation?.longitude) {
                throw new Error('Posizione GPS richiesta');
            }

            if (!userProfile?.id) {
                throw new Error('Utente non autenticato');
            }

            // Ottieni dettagli categoria
            const { data: categoria, error: categoriaError } = await supabase
                .from('categorie')
                .select('*')
                .eq('id', bookingData.categoria_id)
                .single();

            if (categoriaError || !categoria) {
                throw new Error('Categoria servizio non trovata');
            }

            // Calcola pricing
            const now = new Date();
            const timeOfDay = now.getHours();
            const isWeekend = now.getDay() === 0 || now.getDay() === 6;

            const pricing = calculatePrice(
                categoria.tariffa_base_min,
                bookingData.urgenza || 'normale',
                userProfile.tipo_utente === 'hotel' ? 'alberghiero' : 'domestico',
                timeOfDay,
                isWeekend
            );

            // Prepara dati prenotazione
            const prenotazioneData = {
                codice_prenotazione: generateBookingCode(),
                cliente_id: userProfile.id,
                categoria_id: bookingData.categoria_id,
                titolo: bookingData.titolo.trim(),
                descrizione: bookingData.descrizione.trim(),
                urgenza: bookingData.urgenza || 'normale',
                settore: userProfile.tipo_utente === 'hotel' ? 'alberghiero' : 'domestico',

                // Localizzazione
                indirizzo_intervento: userLocation.address || `${userLocation.latitude}, ${userLocation.longitude}`,
                coordinate_intervento: `POINT(${userLocation.longitude} ${userLocation.latitude})`,
                note_accesso: bookingData.note_accesso || null,

                // Multimedia
                foto_problema: bookingData.foto_problema || [],
                video_problema: bookingData.video_problema || null,

                // Pricing
                budget_massimo: pricing.prezzo_finale * 1.2, // 20% buffer
                preventivo_iniziale: pricing.prezzo_finale,
                maggiorazioni_applicate: pricing.maggiorazioni,
                commissione_fixnow: pricing.prezzo_finale * BOOKING_CONFIG.commissionRates[userProfile.tipo_utente === 'hotel' ? 'alberghiero' : 'domestico'],

                // Timing
                finestra_oraria_inizio: bookingData.finestra_oraria_inizio || null,
                finestra_oraria_fine: bookingData.finestra_oraria_fine || null,

                // Stati
                stato: 'pending'
            };

            // Salva prenotazione nel database
            const { data: prenotazione, error: prenotazioneError } = await supabase
                .from('prenotazioni')
                .insert(prenotazioneData)
                .select(`
                    *,
                    categorie(nome, icona, settore),
                    profili!cliente_id(nome, cognome, tipo_utente)
                `)
                .single();

            if (prenotazioneError) {
                console.error('❌ Booking creation error:', prenotazioneError);
                throw new Error('Errore durante la creazione della prenotazione');
            }

            console.log('✅ Booking created:', prenotazione.codice_prenotazione);

            // Invia notifiche ai tecnici
            await this.notifyAvailableTechnicians(prenotazione, userLocation);

            return {
                success: true,
                prenotazione,
                pricing,
                categoria
            };

        } catch (error) {
            console.error('❌ CreateBooking failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🔍 TROVA TECNICI DISPONIBILI
    static async findAvailableTechnicians(prenotazione, userLocation, radiusKm = BOOKING_CONFIG.maxSearchRadius) {
        try {
            console.log('🔍 Finding technicians for booking:', prenotazione.codice_prenotazione);

            // Query tecnici disponibili con PostGIS
            const { data: tecnici, error } = await supabase
                .rpc('find_nearby_technicians', {
                    user_lat: userLocation.latitude,
                    user_lng: userLocation.longitude,
                    categoria_id: prenotazione.categoria_id,
                    max_distance_km: radiusKm,
                    urgenza_level: prenotazione.urgenza
                });

            if (error) {
                console.error('❌ Technician search error:', error);

                // Fallback query manuale se RPC non funziona
                return await this.findTechniciansManual(prenotazione, userLocation, radiusKm);
            }

            console.log(`✅ Found ${tecnici?.length || 0} available technicians`);

            // Calcola scoring e ordina
            const techniciansWithScore = tecnici.map(tech => {
                const distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    tech.coordinate.coordinates[1], // lat
                    tech.coordinate.coordinates[0]  // lng
                );

                // Algoritmo scoring
                const score = this.calculateTechnicianScore(tech, distance, prenotazione.urgenza);

                return {
                    ...tech,
                    distanza: Math.round(distance * 10) / 10,
                    score,
                    tempo_arrivo_stimato: Math.max(15, Math.round(distance * 2)), // 2 min per km, min 15 min
                    prezzo_stimato: this.calculateTechnicianPrice(tech, prenotazione)
                };
            })
                .sort((a, b) => b.score - a.score)
                .slice(0, BOOKING_CONFIG.maxTechnicians);

            return {
                success: true,
                tecnici: techniciansWithScore,
                count: techniciansWithScore.length
            };

        } catch (error) {
            console.error('❌ FindTechnicians failed:', error);
            return {
                success: false,
                error: error.message,
                tecnici: []
            };
        }
    }

    // 🔍 RICERCA MANUALE TECNICI (fallback)
    static async findTechniciansManual(prenotazione, userLocation, radiusKm) {
        console.log('🔄 Using manual technician search fallback');

        const { data: tecnici, error } = await supabase
            .from('profili')
            .select(`
                id, nome, cognome, rating_medio, numero_interventi_completati,
                specializzazioni, tariffe, coordinate, raggio_azione_km,
                disponibile, ultima_attivita
            `)
            .eq('tipo_utente', 'tecnico')
            .eq('disponibile', true)
            .contains('specializzazioni', [prenotazione.categoria_id])
            .gte('rating_medio', 3.0)
            .not('coordinate', 'is', null);

        if (error) {
            throw error;
        }

        // Filtra per distanza manualmente
        const tecniciVicini = tecnici.filter(tech => {
            if (!tech.coordinate) return false;

            const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                tech.coordinate.coordinates[1],
                tech.coordinate.coordinates[0]
            );

            return distance <= radiusKm && distance <= tech.raggio_azione_km;
        });

        return tecniciVicini;
    }

    // 📊 CALCOLA SCORE TECNICO
    static calculateTechnicianScore(tech, distance, urgenza) {
        let score = 0;

        // Peso distanza (40%) - meno distanza = più score
        score += (50 - distance) * 0.4;

        // Peso rating (30%)
        score += (tech.rating_medio - 3) * 10 * 0.3;

        // Peso esperienza (20%)
        score += Math.min(tech.numero_interventi_completati / 10, 10) * 0.2;

        // Bonus urgenza se tecnico disponibile (10%)
        const lastActivity = new Date(tech.ultima_attivita);
        const isRecentlyActive = (Date.now() - lastActivity.getTime()) < 30 * 60 * 1000; // 30 min
        if (urgenza === 'emergenza' && isRecentlyActive) {
            score += 20 * 0.1;
        }

        return Math.max(0, Math.round(score * 100) / 100);
    }

    // 💰 CALCOLA PREZZO TECNICO
    static calculateTechnicianPrice(tech, prenotazione) {
        const baseTariff = tech.tariffe?.[prenotazione.categoria_id] || 80;

        // Applica maggiorazioni
        let finalPrice = baseTariff;

        switch (prenotazione.urgenza) {
            case 'urgente':
                finalPrice *= 1.3;
                break;
            case 'emergenza':
                finalPrice *= 2.0;
                break;
        }

        if (prenotazione.settore === 'alberghiero') {
            finalPrice *= 1.3;
        }

        return Math.round(finalPrice);
    }

    // 📢 NOTIFICA TECNICI DISPONIBILI
    static async notifyAvailableTechnicians(prenotazione, userLocation) {
        try {
            console.log('📢 Notifying available technicians...');

            // Trova tecnici nel raggio
            const result = await this.findAvailableTechnicians(prenotazione, userLocation);

            if (!result.success || result.tecnici.length === 0) {
                console.log('⚠️ No technicians found to notify');
                return;
            }

            // Prepara notifiche
            const notifiche = result.tecnici.map(tech => ({
                destinatario_id: tech.id,
                titolo: '🔧 Nuova Richiesta Disponibile',
                contenuto: `${prenotazione.titolo} - €${tech.prezzo_stimato} - ${tech.distanza}km`,
                tipo: 'nuova_richiesta',
                prenotazione_id: prenotazione.id,
                dati_extra: {
                    categoria: prenotazione.categorie?.nome,
                    urgenza: prenotazione.urgenza,
                    distanza: tech.distanza,
                    prezzo_stimato: tech.prezzo_stimato,
                    tempo_arrivo: tech.tempo_arrivo_stimato
                }
            }));

            // Salva notifiche nel database
            const { error: notificheError } = await supabase
                .from('notifiche')
                .insert(notifiche);

            if (notificheError) {
                console.error('❌ Notifications error:', notificheError);
            } else {
                console.log(`✅ ${notifiche.length} notifications sent`);
            }

            // TODO: Invia push notifications reali
            // await this.sendPushNotifications(result.tecnici, prenotazione);

        } catch (error) {
            console.error('❌ Notify technicians failed:', error);
        }
    }

    // ✅ ACCETTA PRENOTAZIONE (per tecnici)
    static async acceptBooking(prenotazioneId, tecnicoId, tempoArrivoStimato) {
        try {
            console.log('✅ Accepting booking:', prenotazioneId);

            // Verifica che prenotazione sia ancora disponibile
            const { data: prenotazione, error: checkError } = await supabase
                .from('prenotazioni')
                .select('*')
                .eq('id', prenotazioneId)
                .eq('stato', 'pending')
                .single();

            if (checkError || !prenotazione) {
                throw new Error('Prenotazione non più disponibile');
            }

            // Aggiorna prenotazione
            const { data: updatedBooking, error: updateError } = await supabase
                .from('prenotazioni')
                .update({
                    tecnico_id: tecnicoId,
                    stato: 'accepted',
                    data_accettazione: new Date().toISOString(),
                    tempo_arrivo_stimato: tempoArrivoStimato
                })
                .eq('id', prenotazioneId)
                .select(`
                    *,
                    categorie(nome, icona),
                    profili!cliente_id(nome, cognome, telefono)
                `)
                .single();

            if (updateError) {
                throw updateError;
            }

            // Notifica al cliente
            await supabase
                .from('notifiche')
                .insert({
                    destinatario_id: prenotazione.cliente_id,
                    titolo: '✅ Tecnico Assegnato!',
                    contenuto: `Un tecnico ha accettato la tua richiesta. Arrivo stimato: ${tempoArrivoStimato} minuti.`,
                    tipo: 'prenotazione_accettata',
                    prenotazione_id: prenotazioneId,
                    mittente_id: tecnicoId
                });

            console.log('✅ Booking accepted successfully');

            return {
                success: true,
                prenotazione: updatedBooking
            };

        } catch (error) {
            console.error('❌ Accept booking failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 📍 CONFERMA ARRIVO TECNICO
    static async confirmArrival(prenotazioneId, tecnicoId) {
        try {
            console.log('📍 Confirming arrival:', prenotazioneId);

            const { data: updatedBooking, error } = await supabase
                .from('prenotazioni')
                .update({
                    stato: 'in_progress',
                    data_arrivo_effettiva: new Date().toISOString()
                })
                .eq('id', prenotazioneId)
                .eq('tecnico_id', tecnicoId)
                .eq('stato', 'accepted')
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Notifica al cliente
            await supabase
                .from('notifiche')
                .insert({
                    destinatario_id: updatedBooking.cliente_id,
                    titolo: '📍 Tecnico Arrivato',
                    contenuto: 'Il tecnico è arrivato sul posto e sta iniziando i lavori.',
                    tipo: 'tecnico_arrivato',
                    prenotazione_id: prenotazioneId,
                    mittente_id: tecnicoId
                });

            return {
                success: true,
                prenotazione: updatedBooking
            };

        } catch (error) {
            console.error('❌ Confirm arrival failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ✅ COMPLETA PRENOTAZIONE
    static async completeBooking(prenotazioneId, tecnicoId, completionData) {
        try {
            console.log('✅ Completing booking:', prenotazioneId);

            const { data: updatedBooking, error } = await supabase
                .from('prenotazioni')
                .update({
                    stato: 'completed',
                    data_completamento: new Date().toISOString(),
                    costo_finale: completionData.costo_finale,
                    note_completamento: completionData.note_completamento || null
                })
                .eq('id', prenotazioneId)
                .eq('tecnico_id', tecnicoId)
                .eq('stato', 'in_progress')
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Aggiorna statistiche tecnico
            await this.updateTechnicianStats(tecnicoId);

            // Notifica al cliente per recensione
            await supabase
                .from('notifiche')
                .insert({
                    destinatario_id: updatedBooking.cliente_id,
                    titolo: '🎉 Lavoro Completato!',
                    contenuto: 'Il tecnico ha completato il lavoro. Lascia una recensione!',
                    tipo: 'prenotazione_completata',
                    prenotazione_id: prenotazioneId,
                    mittente_id: tecnicoId
                });

            return {
                success: true,
                prenotazione: updatedBooking
            };

        } catch (error) {
            console.error('❌ Complete booking failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 📊 AGGIORNA STATISTICHE TECNICO
    static async updateTechnicianStats(tecnicoId) {
        try {
            // Calcola nuove statistiche
            const { data: stats } = await supabase
                .from('prenotazioni')
                .select('rating_cliente, costo_finale')
                .eq('tecnico_id', tecnicoId)
                .eq('stato', 'completed')
                .not('rating_cliente', 'is', null);

            if (stats && stats.length > 0) {
                const averageRating = stats.reduce((sum, s) => sum + s.rating_cliente, 0) / stats.length;
                const totalEarnings = stats.reduce((sum, s) => sum + (s.costo_finale || 0), 0);

                await supabase
                    .from('profili')
                    .update({
                        rating_medio: Math.round(averageRating * 100) / 100,
                        numero_interventi_completati: stats.length,
                        ultima_attivita: new Date().toISOString()
                    })
                    .eq('id', tecnicoId);
            }

        } catch (error) {
            console.error('❌ Update technician stats failed:', error);
        }
    }

    // 📋 OTTIENI PRENOTAZIONI UTENTE
    static async getUserBookings(userId, status = null) {
        try {
            let query = supabase
                .from('prenotazioni')
                .select(`
                    *,
                    categorie(nome, icona, settore),
                    profili!tecnico_id(nome, cognome, telefono, rating_medio)
                `)
                .eq('cliente_id', userId)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('stato', status);
            }

            const { data: prenotazioni, error } = await query;

            if (error) {
                throw error;
            }

            return {
                success: true,
                prenotazioni: prenotazioni || []
            };

        } catch (error) {
            console.error('❌ Get user bookings failed:', error);
            return {
                success: false,
                error: error.message,
                prenotazioni: []
            };
        }
    }

    // 📋 OTTIENI PRENOTAZIONI TECNICO
    static async getTechnicianBookings(tecnicoId, status = null) {
        try {
            let query = supabase
                .from('prenotazioni')
                .select(`
                    *,
                    categorie(nome, icona, settore),
                    profili!cliente_id(nome, cognome, telefono)
                `)
                .eq('tecnico_id', tecnicoId)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('stato', status);
            }

            const { data: prenotazioni, error } = await query;

            if (error) {
                throw error;
            }

            return {
                success: true,
                prenotazioni: prenotazioni || []
            };

        } catch (error) {
            console.error('❌ Get technician bookings failed:', error);
            return {
                success: false,
                error: error.message,
                prenotazioni: []
            };
        }
    }
}

export default BookingService;