// App.js - VERSIONE CORRETTA SENZA ERRORI
// Prova con estensione esplicita:
import RealBookingScreen from './screens/RealBookingScreen.js';
import TechnicianMatchingScreen from './screens/TechnicianMatchingScreen';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { supabase } from './supabaseClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

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

// 🔧 CATEGORIE AGGIORNATE - SIMBOLI CORRETTI
const CATEGORIE_COMPLETE = [
  { id: 1, nome: 'Idraulico & Termoidraulico', icona: '🔧', urgente: true, settore: 'domestico', prezzo_base: [70, 100] },
  { id: 2, nome: 'Elettricista & Elettrodomestici', icona: '⚡', urgente: true, settore: 'domestico', prezzo_base: [80, 110] },
  { id: 3, nome: 'Fabbro & Serrature', icona: '🔐', urgente: true, settore: 'domestico', prezzo_base: [90, 130] },
  { id: 4, nome: 'Condizionatori & Climatizzazione', icona: '❄️', urgente: true, settore: 'alberghiero', prezzo_base: [90, 140] },
  { id: 5, nome: 'Muratore & Finiture', icona: '🧱', urgente: false, settore: 'domestico', prezzo_base: [70, 110] },
  { id: 6, nome: 'Imbianchino & Pareti', icona: '🎨', urgente: false, settore: 'domestico', prezzo_base: [60, 90] },
  { id: 7, nome: 'Vetraio & Serramentista', icona: '🪟', urgente: true, settore: 'domestico', prezzo_base: [80, 120] },
  { id: 8, nome: 'Antennista & TV Satellitare', icona: '📡', urgente: false, settore: 'domestico', prezzo_base: [70, 110] },
  { id: 9, nome: 'Informatico & Reti', icona: '💻', urgente: false, settore: 'domestico', prezzo_base: [60, 90] },
  { id: 10, nome: 'Energie Rinnovabili', icona: '☀️', urgente: false, settore: 'domestico', prezzo_base: [90, 160] },
  { id: 11, nome: 'Giardiniere & Potature', icona: '🌿', urgente: false, settore: 'alberghiero', prezzo_base: [50, 90] },
  { id: 12, nome: 'Piscine & Impianti Idrici', icona: '🏊', urgente: true, settore: 'alberghiero', prezzo_base: [100, 200] },
  { id: 13, nome: 'Pulizie & Disinfestazione', icona: '🧹', urgente: true, settore: 'alberghiero', prezzo_base: [60, 120] },
  { id: 14, nome: 'Pozzi Artesiani & Desalinizzazione', icona: '💧', urgente: false, settore: 'domestico', prezzo_base: [100, 180] },
  { id: 15, nome: 'Assistenza Auto Mobile', icona: '🚗', urgente: true, settore: 'domestico', prezzo_base: [80, 150] },
  { id: 16, nome: 'Veterinario Emergenze', icona: '🐕', urgente: true, settore: 'domestico', prezzo_base: [90, 160] }
];

// 🔧 LIVELLI URGENZA CORRETTI - NIENTE SIMBOLI E PERCENTUALI
const URGENCY_LEVELS = [
  { id: 'normale', nome: '🟢 Normale', desc: 'Entro 2-4 ore' },
  { id: 'urgente', nome: '🟡 Urgente', desc: 'Entro 1 ora' },
  { id: 'emergenza', nome: '🔴 Emergenza', desc: 'Entro 15 minuti' }
];

// SIMPLE BOOKING SCREEN COMPONENT - AGGIORNATO
function SimpleBookingScreen({ onNavigate, selectedCategory }) {
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('normale');

  const handleSubmit = () => {
    if (!problemTitle || !problemDescription) {
      Alert.alert('❌ Campi obbligatori', 'Inserisci titolo e descrizione del problema.', [{ text: 'OK' }]);
      return;
    }

    const urgencyData = URGENCY_LEVELS.find(u => u.id === urgencyLevel);

    Alert.alert(
      '🔍 Richiesta Creata!',
      `Problema: ${problemTitle}\nCategoria: ${selectedCategory?.nome || 'Generica'}\nUrgenza: ${urgencyData.nome}\n\nCerco i tecnici disponibili...`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: '🎯 Trova Tecnici', onPress: () => onNavigate('matching', { problema: problemTitle, categoria: selectedCategory }) }
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.bookingHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Richiedi Assistenza</Text>
        </View>
        <View style={styles.headerBottom}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.backButton}>← Indietro</Text>
          </TouchableOpacity>
          <View style={styles.headerBottomSpacer} />
        </View>
      </View>

      <ScrollView style={styles.bookingContent}>
        {selectedCategory && (
          <View style={styles.selectedCategory}>
            <Text style={styles.selectedCategoryTitle}>
              {selectedCategory.icona} {selectedCategory.nome}
            </Text>
            <Text style={styles.selectedCategoryPrice}>
              Tariffa: €{selectedCategory.prezzo_base[0]}-{selectedCategory.prezzo_base[1]}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Livello di Urgenza</Text>
          {URGENCY_LEVELS.map((urgency) => (
            <TouchableOpacity
              key={urgency.id}
              style={[
                styles.urgencyCard,
                urgencyLevel === urgency.id && styles.urgencySelected
              ]}
              onPress={() => setUrgencyLevel(urgency.id)}
            >
              <View style={styles.urgencyLeft}>
                <Text style={styles.urgencyName}>{urgency.nome}</Text>
                <Text style={styles.urgencyDescription}>{urgency.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Descrivi il Problema</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Titolo problema *</Text>
            <TextInput
              style={styles.input}
              placeholder="es: Perdita rubinetto cucina"
              value={problemTitle}
              onChangeText={setProblemTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrizione dettagliata *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrivi il problema in dettaglio..."
              value={problemDescription}
              onChangeText={setProblemDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>🎯 Trova Tecnici</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// SIMPLE MATCHING SCREEN COMPONENT
function SimpleMatchingScreen({ onNavigate, bookingData }) {
  const [loading, setLoading] = useState(true);

  const MOCK_TECHNICIANS = [
    { id: 1, nome: 'Mario Bianchi', rating: 4.8, distanza: 2.3, tempo: 15, prezzo: 75, interventi: 127 },
    { id: 2, nome: 'Giuseppe Rossi', rating: 4.9, distanza: 3.7, tempo: 22, prezzo: 80, interventi: 89 },
    { id: 3, nome: 'Antonio Serra', rating: 4.6, distanza: 5.2, tempo: 35, prezzo: 70, interventi: 156 }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);

  const handleSelectTechnician = (tech) => {
    Alert.alert(
      `🔧 ${tech.nome}`,
      `Rating: ${tech.rating}⭐ (${tech.interventi} interventi)\nDistanza: ${tech.distanza}km\nArrivo: ${tech.tempo} min\nPrezzo: €${tech.prezzo}\n\nConfermi la scelta?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: '✅ Conferma e Paga',
          onPress: () => {
            onNavigate('payment', {
              selectedTechnician: tech,
              bookingData: {
                ...bookingData,
                tecnico_id: tech.id,
                prezzoFinale: tech.prezzo
              }
            });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>🔍 Cerco i migliori tecnici...</Text>
        <Text style={styles.loadingSubtext}>Analizzando disponibilità e distanza</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.matchingHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tecnici Disponibili</Text>
        </View>
        <View style={styles.headerBottom}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => onNavigate('booking')}
          >
            <Text style={styles.backButton}>← Indietro</Text>
          </TouchableOpacity>
          <View style={styles.headerBottomSpacer} />
        </View>
      </View>

      <ScrollView style={styles.matchingContent}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>🎯 {MOCK_TECHNICIANS.length} Tecnici Trovati</Text>
          <Text style={styles.resultsSubtitle}>Ordinati per compatibilità e rating</Text>
        </View>

        {MOCK_TECHNICIANS.map((tech, index) => (
          <TouchableOpacity
            key={tech.id}
            style={[styles.technicianCard, index === 0 && styles.bestMatch]}
            onPress={() => handleSelectTechnician(tech)}
          >
            {index === 0 && (
              <View style={styles.bestMatchBadge}>
                <Text style={styles.bestMatchText}>🏆 MIGLIOR MATCH</Text>
              </View>
            )}

            <View style={styles.technicianHeader}>
              <View style={styles.technicianAvatar}>
                <Text style={styles.avatarText}>{tech.nome.charAt(0)}{tech.nome.split(' ')[1].charAt(0)}</Text>
              </View>
              <View style={styles.technicianInfo}>
                <Text style={styles.technicianName}>{tech.nome}</Text>
                <Text style={styles.technicianRating}>⭐ {tech.rating} ({tech.interventi} interventi)</Text>
              </View>
              <View style={styles.technicianPrice}>
                <Text style={styles.priceText}>€{tech.prezzo}</Text>
              </View>
            </View>

            <View style={styles.technicianFooter}>
              <Text style={styles.footerText}>📍 {tech.distanza}km</Text>
              <Text style={styles.footerText}>⏱️ {tech.tempo} min</Text>
              <Text style={styles.footerText}>🔧 Disponibile ora</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// 🔧 MAIN APP COMPONENT - AUTHCONTEXT REALE
function MainApp() {
  const { isAuthenticated, initializing, user, profile } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenData, setScreenData] = useState({});
  const [supabaseStatus, setSupabaseStatus] = useState('testing');

  const navigate = (screen, data = {}) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  // Test Supabase connection
  useEffect(() => {
    console.log('🚀 FixNow Sardegna Starting...');
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setSupabaseStatus('testing');
      const { data, error } = await supabase.from('profili').select('count').limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error.message);
        setSupabaseStatus('error');
      } else {
        console.log('✅ Database connection successful!');
        setSupabaseStatus('connected');
      }
    } catch (error) {
      console.error('❌ Supabase test failed:', error);
      setSupabaseStatus('error');
    }
  };

  // 🔄 LOADING SCREEN
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>🚀 Caricamento FixNow...</Text>
        <Text style={styles.loadingSubtext}>Inizializzazione app in corso</Text>
      </View>
    );
  }

  // 🔐 NON AUTENTICATO - MOSTRA LOGIN/REGISTER
  if (!isAuthenticated) {
    if (currentScreen === 'register') {
      return <RegisterScreen navigation={{ navigate: () => setCurrentScreen('login') }} />;
    }
    return <LoginScreen navigation={{ navigate: () => setCurrentScreen('register') }} />;
  }

  // ✅ AUTENTICATO - MOSTRA APP PRINCIPALE
  if (currentScreen === 'booking') {
    return <RealBookingScreen
      navigation={{
        navigate,
        goBack: () => navigate('home')
      }}
      route={{ params: screenData }}
    />;
  }

  if (currentScreen === 'matching') {
    return <TechnicianMatchingScreen
      navigation={{
        navigate,
        goBack: () => navigate('booking')
      }}
      route={{ params: screenData }}
    />;
  }

  // HOME SCREEN AUTENTICATA
  return <HomeScreen navigate={navigate} supabaseStatus={supabaseStatus} onTestConnection={testSupabaseConnection} user={user} profile={profile} />;
}

// 🏠 HOME SCREEN COMPONENT - CON UTENTE REALE
function HomeScreen({ navigate, supabaseStatus, onTestConnection, user, profile }) {
  const { signOut } = useAuth();

  const handleCategoriaPress = (categoria) => {
    Alert.alert(
      `${categoria.icona} ${categoria.nome}`,
      `${categoria.urgente ? '⚡ SERVIZIO URGENTE' : '🕐 SERVIZIO STANDARD'}\nTariffa: €${categoria.prezzo_base[0]}-${categoria.prezzo_base[1]}\nSettore: ${categoria.settore === 'domestico' ? 'Casa e privati' : 'Hotel e strutture'}\n\nVuoi creare una richiesta?`,
      [
        { text: 'Solo Info', style: 'cancel' },
        { text: '🚀 Crea Richiesta', onPress: () => navigate('booking', { categoria }) }
      ]
    );
  };

  const handleSOSPress = () => {
    Alert.alert(
      '🚨 EMERGENZA SOS',
      'Attivazione servizio emergenza 24/7\n\n⏱️ Risposta entro 10 minuti\n💰 Tariffa maggiorata',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: '🚨 ATTIVA SOS', style: 'destructive', onPress: () => navigate('booking', { urgenza: 'emergenza' }) }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Logout',
      'Vuoi disconnetterti dal tuo account?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Logout', onPress: signOut, style: 'destructive' }
      ]
    );
  };

  const getStatusColor = () => {
    switch (supabaseStatus) {
      case 'connected': return COLORS.success;
      case 'error': return COLORS.warning;
      default: return COLORS.secondary;
    }
  };

  const getStatusText = () => {
    switch (supabaseStatus) {
      case 'connected': return '✅ Sistema Operativo';
      case 'error': return '⚠️ Connessione DB';
      default: return '🔄 Test Connessione';
    }
  };

  const categorieUrgenti = CATEGORIE_COMPLETE.filter(c => c.urgente);
  const categorieStandard = CATEGORIE_COMPLETE.filter(c => !c.urgente);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.userInfo}>
          <Text style={styles.headerTitle}>FixNow Sardegna</Text>
          <Text style={styles.headerSubtitle}>
            👋 {profile?.nome || user?.email || 'Utente'} ({profile?.tipo_utente || 'cliente'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
          onPress={onTestConnection}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <Text style={styles.sosIcon}>🚨</Text>
          <Text style={styles.sosText}>EMERGENZA SOS</Text>
          <Text style={styles.sosSubtext}>Assistenza immediata 24/7</Text>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigate('booking')}>
            <Text style={styles.quickActionIcon}>🚀</Text>
            <Text style={styles.quickActionText}>Richiedi Assistenza</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('📋 Demo', 'Funzione in sviluppo')}>
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>Le Mie Prenotazioni</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Servizi Urgenti</Text>
          <Text style={styles.sectionSubtitle}>Risposta entro 15 minuti</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {categorieUrgenti.map((categoria) => (
            <TouchableOpacity
              key={categoria.id}
              style={[styles.categoryCard, styles.categoryUrgent]}
              onPress={() => handleCategoriaPress(categoria)}
            >
              <Text style={styles.categoryIcon}>{categoria.icona}</Text>
              <Text style={styles.categoryName}>{categoria.nome}</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENTE</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Altri Servizi</Text>
          <Text style={styles.sectionSubtitle}>Risposta entro 2 ore</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {categorieStandard.map((categoria) => (
            <TouchableOpacity
              key={categoria.id}
              style={styles.categoryCard}
              onPress={() => handleCategoriaPress(categoria)}
            >
              <Text style={styles.categoryIcon}>{categoria.icona}</Text>
              <Text style={styles.categoryName}>{categoria.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.devInfo}>
          <Text style={styles.devTitle}>🎉 FixNow - Autenticazione Reale!</Text>
          <Text style={styles.devText}>✅ Login/Register Supabase funzionante</Text>
          <Text style={styles.devText}>✅ Utente: {profile?.nome || 'Caricamento...'}</Text>
          <Text style={styles.devText}>✅ Tipo: {profile?.tipo_utente || 'cliente'}</Text>
          <Text style={styles.devText}>✅ 16 Categorie ottimizzate</Text>
          <Text style={styles.devText}>✅ Simboli e percentuali corretti</Text>
          <Text style={styles.devText}>✅ Sistema prenotazioni</Text>
          <Text style={styles.devText}>✅ Matching tecnici</Text>
          <Text style={styles.devText}>⏳ Sistema pagamenti Stripe</Text>
          <Text style={styles.devText}>⏳ Chat real-time</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// APP WRAPPER
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
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
  bookingHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'column',
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerBottomSpacer: {
    flex: 1,
  },
  backButtonContainer: {},
  backButton: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    minWidth: 45,
    textAlign: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookingContent: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  selectedCategory: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  selectedCategoryPrice: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
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
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchingHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'column',
  },
  matchingContent: {
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
  },
  bestMatch: {
    borderColor: COLORS.success,
    backgroundColor: '#F8FFF8',
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
  technicianRating: {
    fontSize: 14,
    color: COLORS.gray,
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
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 110,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sosButton: {
    backgroundColor: '#FF4444',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  sosIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  sosText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  sosSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: COLORS.dark,
    opacity: 0.7,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryUrgent: {
    borderWidth: 2,
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
    marginBottom: 8,
  },
  urgentBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  devInfo: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  devText: {
    fontSize: 12,
    color: COLORS.success,
    marginBottom: 2,
  },
});