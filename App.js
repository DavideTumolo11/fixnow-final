// App.js - VERSIONE MIGLIORATA con feedback utente
import { StripeProvider } from '@stripe/stripe-react-native';
import { PaymentProvider } from './contexts/PaymentContext';
import { STRIPE_CONFIG, validateStripeConfig } from './lib/stripe';
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

// 🔧 CATEGORIE AGGIORNATE (rimosso "Impermeabilizzazioni" e "Altri Servizi Urgenti")
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

// SIMPLE LOGIN SCREEN COMPONENT
function SimpleLoginScreen({ onNavigate }) {
  const [email, setEmail] = useState('test@fixnow.it');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);

    // Simula login (in una vera app useresti AuthContext)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        '✅ Login Simulato',
        'Per ora simulo il login. In produzione si collegherà a Supabase.',
        [{ text: 'OK', onPress: () => onNavigate('home') }]
      );
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.loginContainer}>
        <View style={styles.loginHeader}>
          <Text style={styles.logo}>FixNow</Text>
          <Text style={styles.tagline}>Assistenza Tecnica 24/7</Text>
          <Text style={styles.subtitle}>Accedi al tuo account</Text>
        </View>

        <View style={styles.loginForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>📧 Email</Text>
            <TextInput
              style={styles.input}
              placeholder="La tua email"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>🔒 Password</Text>
            <TextInput
              style={styles.input}
              placeholder="La tua password"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>🔑 Accedi</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => onNavigate('register')}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>📝 Registrati</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.devInfo}>
          <Text style={styles.devTitle}>🚧 Account di Test</Text>
          <Text style={styles.devText}>Email: test@fixnow.it</Text>
          <Text style={styles.devText}>Password: password123</Text>
          <Text style={styles.devText}>⚡ Login simulato per demo</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// SIMPLE REGISTER SCREEN COMPONENT
function SimpleRegisterScreen({ onNavigate }) {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    tipo_utente: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const USER_TYPES = [
    { id: 'cliente', nome: '👤 Cliente', descrizione: 'Richiedo servizi' },
    { id: 'tecnico', nome: '🔧 Tecnico', descrizione: 'Offro servizi' },
    { id: 'hotel', nome: '🏨 Hotel', descrizione: 'Gestisco struttura' }
  ];

  const handleRegister = () => {
    if (!formData.nome || !formData.email || !formData.tipo_utente) {
      Alert.alert('❌ Campi obbligatori', 'Compila tutti i campi richiesti.', [{ text: 'OK' }]);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        '✅ Registrazione Simulata',
        `Account ${formData.tipo_utente} creato per ${formData.nome}!\n\nIn produzione si registrerà su Supabase.`,
        [{ text: 'Accedi', onPress: () => onNavigate('login') }]
      );
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.registerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.registerHeader}>
        <TouchableOpacity onPress={() => onNavigate('login')}>
          <Text style={styles.backButton}>← Indietro</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>FixNow</Text>
        <Text style={styles.subtitle}>Crea il tuo account</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Tipo di Account</Text>
        {USER_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.userTypeCard,
              formData.tipo_utente === type.id && styles.userTypeSelected
            ]}
            onPress={() => setFormData({ ...formData, tipo_utente: type.id })}
          >
            <Text style={styles.userTypeName}>{type.nome}</Text>
            <Text style={styles.userTypeDesc}>{type.descrizione}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Informazioni</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            placeholder="Il tuo nome"
            value={formData.nome}
            onChangeText={(text) => setFormData({ ...formData, nome: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="la.tua.email@example.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimo 6 caratteri"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.registerSubmitButton, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.registerSubmitText}>🚀 Crea Account</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// SIMPLE BOOKING SCREEN COMPONENT
function SimpleBookingScreen({ onNavigate, selectedCategory }) {
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('normale');

  const URGENCY_LEVELS = [
    { id: 'normale', nome: '🟢 Normale', desc: '2-4 ore', extra: '0%' },
    { id: 'urgente', nome: '🟡 Urgente', desc: '< 1 ora', extra: '+30%' },
    { id: 'emergenza', nome: '🔴 Emergenza', desc: '< 15 min', extra: '+100%' }
  ];

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

      {/* 🔧 HEADER CORRETTO - TITOLO SOPRA, BOTTONE SOTTO A SINISTRA */}
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
              <Text style={styles.urgencyPrice}>{urgency.extra}</Text>
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

        {/* 🔧 RIDOTTO SPAZIO IN FONDO */}
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
          text: '✅ Conferma e Paga', // 🔧 CAMBIATO il testo
          onPress: () => {
            // 🔧 NAVIGA alla schermata pagamento invece di confermare subito
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

      {/* 🔧 HEADER CORRETTO - TITOLO SOPRA, BOTTONE SOTTO A SINISTRA */}
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

// MAIN APP COMPONENT
function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('login'); // Inizia con login
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

  // HOME SCREEN
  if (currentScreen === 'home') {
    return <HomeScreen navigate={navigate} supabaseStatus={supabaseStatus} onTestConnection={testSupabaseConnection} />;
  }

  // SCREEN ROUTING
  switch (currentScreen) {
    case 'login':
      return <SimpleLoginScreen onNavigate={navigate} />;
    case 'register':
      return <SimpleRegisterScreen onNavigate={navigate} />;
    case 'booking':
      return <SimpleBookingScreen onNavigate={navigate} selectedCategory={screenData.categoria} />;
    case 'matching':
      return <SimpleMatchingScreen onNavigate={navigate} bookingData={screenData} />;
    default:
      return <SimpleLoginScreen onNavigate={navigate} />;
  }
}

// HOME SCREEN COMPONENT 
function HomeScreen({ navigate, supabaseStatus, onTestConnection }) {
  // 🔧 FIX: Funzione handleCategoriaPress corretta
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
      'Attivazione servizio emergenza 24/7\n\n⏱️ Risposta < 10 minuti\n💰 Tariffa +100%',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: '🚨 ATTIVA SOS', style: 'destructive', onPress: () => navigate('booking', { urgenza: 'emergenza' }) }
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
        <TouchableOpacity onPress={() => navigate('login')} style={styles.userInfo}>
          <Text style={styles.headerTitle}>FixNow Sardegna</Text>
          <Text style={styles.headerSubtitle}>👋 Demo Utente (Tap per Logout)</Text>
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

        {/* 🔧 CATEGORIE URGENTI SENZA PREZZI */}
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

        {/* 🔧 CATEGORIE STANDARD SENZA PREZZI */}
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
          <Text style={styles.devTitle}>🎉 MVP FixNow - App Migliorata!</Text>
          <Text style={styles.devText}>✅ Autenticazione Simulata</Text>
          <Text style={styles.devText}>✅ 16 Categorie Ottimizzate</Text>
          <Text style={styles.devText}>✅ Sistema Prenotazioni</Text>
          <Text style={styles.devText}>✅ Matching Tecnici</Text>
          <Text style={styles.devText}>✅ Navigazione con Back Button</Text>
          <Text style={styles.devText}>✅ Design Mobile-First</Text>
          <Text style={styles.devText}>✅ Prezzi solo nei dettagli</Text>
          <Text style={styles.devText}>✅ UI/UX Migliorata</Text>
          <Text style={styles.devText}>🔄 Pronto per Supabase reale</Text>
          <Text style={styles.devText}>⏳ Sistema Pagamenti Stripe</Text>
          <Text style={styles.devText}>⏳ Chat Real-time</Text>
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

  // LOGIN STYLES
  loginContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  loginForm: {
    marginBottom: 30,
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
  loginButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  devInfo: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  devText: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },

  // REGISTER STYLES
  registerContainer: {
    padding: 20,
  },
  registerHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  section: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  userTypeCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.light,
  },
  userTypeSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F2',
  },
  userTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  userTypeDesc: {
    fontSize: 14,
    color: COLORS.gray,
  },
  registerSubmitButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  registerSubmitText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // BOOKING STYLES
  bookingHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 10,        // 🔧 Ridotto
    paddingHorizontal: 20,
    flexDirection: 'column',  // 🔧 CAMBIATO DA 'row' A 'column'
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // 🔧 Bottone a SINISTRA
    alignItems: 'center',
  },
  headerBottomSpacer: {
    flex: 1,
  },
  backButtonContainer: {
    // Container del bottone
  },
  backButton: {
    color: COLORS.white,
    fontSize: 11,             // 🔧 Piccolissimo
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
  headerSpacer: {
    width: 80,            // 🔧 Aumentato da 60 a 80 per bilanciare
  },
  bookingContent: {
    flex: 1,
    padding: 20,
    paddingTop: 10,           // 🔧 Ridotto da 20 a 10 per ridurre spazio
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
  urgencyPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
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

  // MATCHING STYLES
  matchingHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 10,        // 🔧 Ridotto
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

  // HOME STYLES
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
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
});