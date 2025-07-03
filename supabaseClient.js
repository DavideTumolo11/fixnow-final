// supabaseClient.js - Versione Sicura con Environment Variables
import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANTE: Controlla che queste variabili esistano
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validazione: se mancano le API keys, mostra errore chiaro
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '❌ ERRORE: API keys Supabase mancanti!\n\n' +
        '🔧 SOLUZIONE:\n' +
        '1. Crea file .env nella root del progetto\n' +
        '2. Aggiungi:\n' +
        '   EXPO_PUBLIC_SUPABASE_URL=la_tua_url_qui\n' +
        '   EXPO_PUBLIC_SUPABASE_ANON_KEY=la_tua_chiave_qui\n' +
        '3. Riavvia: npm start'
    );
}

// Configurazione Supabase sicura
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'X-Client-Info': 'fixnow-mobile-app',
        },
    },
});

console.log('✅ Supabase client inizializzato correttamente');

export default supabase;