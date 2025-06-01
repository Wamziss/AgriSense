// App.js - Main React Native App
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Camera } from 'expo-camera';
// import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Icons Component (since we can't use lucide-react in React Native)

const Icon = ({ name, size = 24, color = '#000' }: { name: 'camera' | 'leaf' | 'alert' | 'check' | 'users' | 'chart' | 'book' | 'settings' | 'battery' | 'wifi' | 'mic' | 'sun' | 'moon' | 'share' | 'download' | 'star' | 'home' | 'search' | 'location' | 'time'; size?: number; color?: string }) => {
  const icons = {
    camera: '📷',
    leaf: '🌿',
    alert: '⚠️',
    check: '✅',
    users: '👥',
    chart: '📊',
    book: '📚',
    settings: '⚙️',
    battery: '🔋',
    wifi: '📶',
    mic: '🎤',
    sun: '☀️',
    moon: '🌙',
    share: '📤',
    download: '⬇️',
    star: '⭐',
    home: '🏠',
    search: '🔍',
    location: '📍',
    time: '⏰',
  };
  
  return (
    <Text style={{ fontSize: size, color }}>
      {icons[name] || '●'}
    </Text>
  );
};const AgriSenseApp = () => {  // State Management
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0.85);
  const [detectionResult, setDetectionResult] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('maize');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [scannedImages, setScannedImages] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Animations
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Mock Data
  const recentScans = [
    {
      id: 1,
      crop: 'Maize',
      disease: 'Corn Borer',
      confidence: 92,
      date: '2 hours ago',
      severity: 'high',
      image: 'https://via.placeholder.com/100x100/4ade80/ffffff?text=🌽'
    },
    {
      id: 2,
      crop: 'Tomato',
      disease: 'Blight',
      confidence: 88,
      date: '1 day ago',
      severity: 'medium',
      image: 'https://via.placeholder.com/100x100/ef4444/ffffff?text=🍅'
    },
    {
      id: 3,
      crop: 'Cassava',
      disease: 'Mosaic Virus',
      confidence: 95,
      date: '2 days ago',
      severity: 'high',
      image: 'https://via.placeholder.com/100x100/f59e0b/ffffff?text=🥔'
    },
  ];

  const cropTypes = [
    { id: 'maize', name: 'Maize', icon: '🌽', color: '#eab308' },
    { id: 'tomato', name: 'Tomato', icon: '🍅', color: '#ef4444' },
    { id: 'cassava', name: 'Cassava', icon: '🥔', color: '#d97706' },
    { id: 'beans', name: 'Beans', icon: '🫘', color: '#059669' },
  ];

  // Theme Configuration
  const theme = {
    primary: '#10b981',
    secondary: '#065f46',
    background: isDarkMode ? '#111827' : '#f0fdf4',
    surface: isDarkMode ? '#1f2937' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#111827',
    textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',
    border: isDarkMode ? '#374151' : '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  // Initialize App
  useEffect(() => {
    initializeApp();
    startPulseAnimation();
  }, []);

            const initializeApp = async () => {
              // Get Camera Permission
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasCameraPermission(status === 'granted' ? true : null);

              // Get Location Permission
              const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
              if (locationStatus === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation(location as any);
              }
      // Monitor Network Status
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected);
      });

      // Monitor Battery Level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      setBatteryLevel(batteryLevel);

      // Load Saved Data
      loadSavedData();

      return () => unsubscribe();
    };
  const loadSavedData = async () => {
    try {
      const savedScans = await AsyncStorage.getItem('scannedImages');
      if (savedScans) {
        setScannedImages(JSON.parse(savedScans));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const simulateScanning = async () => {
    if (!hasCameraPermission) {
      Alert.alert('Camera Permission', 'Please grant camera permission to scan crops.');
      return;
    }

    setIsScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start scanning animation
    Animated.timing(scanAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Simulate AI processing
    setTimeout(() => {
      setIsScanning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const mockResult = {
        disease: 'Corn Leaf Blight',
        confidence: 94,
        severity: 'medium',
        treatment: 'Apply fungicide spray every 7 days for 3 weeks',
        prevention: 'Ensure proper drainage and plant spacing. Remove infected debris.',
        detectedAt: new Date().toISOString(),
        location: userLocation,
        cropType: selectedCrop,
      };

      setDetectionResult(mockResult);
      saveDetectionResult(mockResult);
      setCurrentScreen('results');
      scanAnimation.setValue(0);
    }, 3000);
  };

  const saveDetectionResult = async (result) => {
    try {
      const updatedScans = [result, ...scannedImages];
      await AsyncStorage.setItem('scannedImages', JSON.stringify(updatedScans));
      setScannedImages(updatedScans);
    } catch (error) {
      console.error('Error saving detection result:', error);
    }
  };

  // Status Bar Component
  const StatusBarComponent = () => (
    <View style={[styles.statusBar, { backgroundColor: theme.surface }]}>
      <View style={styles.statusLeft}>
        <View style={styles.statusItem}>
          <Icon name="wifi" size={16} color={isOnline ? theme.success : theme.textSecondary} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Icon name="battery" size={16} color={batteryLevel > 0.2 ? theme.success : theme.error} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {Math.round(batteryLevel * 100)}%
          </Text>
        </View>
      </View>
      <View style={styles.statusRight}>
        <TouchableOpacity onPress={() => setVoiceEnabled(!voiceEnabled)}>
          <Icon name="mic" size={16} color={voiceEnabled ? theme.success : theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
          <Icon name={isDarkMode ? 'sun' : 'moon'} size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Dashboard Screen
  const DashboardScreen = () => (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBarComponent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
            <Icon name="leaf" size={32} color="white" />
          </View>
          <View>
            <Text style={[styles.appTitle, { color: theme.text }]}>AgriSense</Text>
            <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
              Smart crop disease detection
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning,</Text>
          <Text style={[styles.userName, { color: theme.text }]}>John Farmer</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: theme.text }]}>24</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Scans Today</Text>
          </View>
          <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
            <Icon name="chart" size={20} color="#2563eb" />
          </View>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: theme.text }]}>94%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Accuracy</Text>
          </View>
          <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
            <Icon name="check" size={20} color="#16a34a" />
          </View>
        </View>
      </View>

      {/* Main Scan Button */}
      <TouchableOpacity
        style={styles.scanButtonContainer}
        onPress={simulateScanning}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.primary, '#059669']}
          style={styles.scanButton}
        >
          <Animated.View
            style={[
              styles.scanButtonContent,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <View style={styles.scanIconContainer}>
              <Icon name="camera" size={48} color="white" />
            </View>
            <Text style={styles.scanButtonTitle}>Scan Your Crop</Text>
            <Text style={styles.scanButtonSubtitle}>
              Take a photo to detect diseases instantly
            </Text>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Crop Selection */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Crop Type</Text>
        <View style={styles.cropGrid}>
          {cropTypes.map((crop) => (
            <TouchableOpacity
              key={crop.id}
              style={[
                styles.cropCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedCrop === crop.id ? theme.primary : theme.border,
                  borderWidth: selectedCrop === crop.id ? 2 : 1,
                }
              ]}
              onPress={() => setSelectedCrop(crop.id)}
            >
              <View style={[styles.cropIcon, { backgroundColor: crop.color + '20' }]}>
                <Text style={styles.cropEmoji}>{crop.icon}</Text>
              </View>
              <Text style={[styles.cropName, { color: theme.text }]}>{crop.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Scans */}
      <View style={[styles.sectionContainer, { marginBottom: 100 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Scans</Text>
          <TouchableOpacity>
            <Text style={[styles.sectionAction, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentScans.map((scan) => (
          <View key={scan.id} style={[styles.scanCard, { backgroundColor: theme.surface }]}>
            <Image source={{ uri: scan.image }} style={styles.scanImage} />
            <View style={styles.scanInfo}>
              <Text style={[styles.scanDisease, { color: theme.text }]}>{scan.disease}</Text>
              <Text style={[styles.scanDetails, { color: theme.textSecondary }]}>
                {scan.crop} • {scan.confidence}% confident
              </Text>
              <Text style={[styles.scanDate, { color: theme.textSecondary }]}>{scan.date}</Text>
            </View>
            <View style={[
              styles.severityIndicator,
              { backgroundColor: scan.severity === 'high' ? theme.error : theme.warning }
            ]} />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // Scanning Screen
  const ScanningScreen = () => (
    <View style={styles.scanningContainer}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <StatusBarComponent />
      
      <View style={styles.cameraContainer}>
        <View style={styles.cameraOverlay}>
          <View style={styles.scanningBorder} />
          <Animated.View style={[
            styles.scanningLine,
            {
              top: scanAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['20%', '80%'],
              }),
            }
          ]} />
        </View>
        
        <View style={styles.scanningContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.scanningTitle}>Analyzing Your Crop</Text>
          <Text style={styles.scanningSubtitle}>AI is detecting potential diseases...</Text>
        </View>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setIsScanning(false);
            setCurrentScreen('dashboard');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Results Screen
  const ResultsScreen = () => (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBarComponent />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => setCurrentScreen('dashboard')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Scan Results</Text>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.surface }]}>
          <Icon name="share" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Result Card */}
      <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
        <View style={styles.resultHeader}>
          <View style={[styles.diseaseIcon, { backgroundColor: theme.warning + '20' }]}>
            <Icon name="alert" size={40} color={theme.warning} />
          </View>
          <Text style={[styles.diseaseName, { color: theme.text }]}>
            {detectionResult?.disease}
          </Text>
          <View style={styles.confidenceContainer}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size={16}
                  color={i < 4 ? theme.warning : theme.textSecondary}
                />
              ))}
            </View>
            <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
              {detectionResult?.confidence}% Confident
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: theme.warning + '20' }]}>
            <Text style={[styles.severityText, { color: theme.warning }]}>
              {detectionResult?.severity} Severity
            </Text>
          </View>
        </View>

        {/* Treatment Section */}
        <View style={styles.treatmentContainer}>
          <View style={[styles.treatmentCard, { backgroundColor: theme.success + '10' }]}>
            <View style={styles.treatmentHeader}>
              <Icon name="check" size={20} color={theme.success} />
              <Text style={[styles.treatmentTitle, { color: theme.success }]}>
                Recommended Treatment
              </Text>
            </View>
            <Text style={[styles.treatmentText, { color: theme.text }]}>
              {detectionResult?.treatment}
            </Text>
          </View>

          <View style={[styles.treatmentCard, { backgroundColor: '#dbeafe' }]}>
            <View style={styles.treatmentHeader}>
              <Icon name="leaf" size={20} color="#2563eb" />
              <Text style={[styles.treatmentTitle, { color: '#2563eb' }]}>
                Prevention Tips
              </Text>
            </View>
            <Text style={[styles.treatmentText, { color: theme.text }]}>
              {detectionResult?.prevention}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { marginBottom: 100 }]}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
          <Icon name="download" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Save to My Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.surface }]}>
          <Icon name="users" size={20} color={theme.text} />
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Share with Community
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.surface }]}>
          <Icon name="book" size={20} color={theme.text} />
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Learn More About This Disease
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Bottom Navigation
  const BottomNavigation = () => (
    <View style={[styles.bottomNav, { backgroundColor: theme.surface }]}>
      {[
        { id: 'dashboard', icon: 'home', label: 'Home' },
        { id: 'community', icon: 'users', label: 'Community' },
        { id: 'analytics', icon: 'chart', label: 'Analytics' },
        { id: 'learn', icon: 'book', label: 'Learn' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ].map(({ id, icon, label }) => (
        <TouchableOpacity
          key={id}
          style={[
            styles.navItem,
            currentScreen === id && { backgroundColor: theme.primary + '10' }
          ]}
          onPress={() => setCurrentScreen(id)}
        >
          <Icon
            name={icon}
            size={24}
            color={currentScreen === id ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[
              styles.navLabel,
              { color: currentScreen === id ? theme.primary : theme.textSecondary }
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Placeholder Screens
  const PlaceholderScreen = ({ title, icon }) => (
    <View style={[styles.container, styles.placeholderContainer, { backgroundColor: theme.background }]}>
      <StatusBarComponent />
      <View style={styles.placeholderContent}>
        <Icon name={icon} size={64} color={theme.textSecondary} />
        <Text style={[styles.placeholderTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.placeholderSubtitle, { color: theme.textSecondary }]}>
          Coming soon...
        </Text>
      </View>
    </View>
  );

  // Main Render
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'scanning' && <ScanningScreen />}
      {currentScreen === 'results' && <ResultsScreen />}
      {currentScreen === 'community' && <PlaceholderScreen title="Community" icon="users" />}
      {currentScreen === 'analytics' && <PlaceholderScreen title="Analytics" icon="chart" />}
      {currentScreen === 'learn' && <PlaceholderScreen title="Learn" icon="book" />}
      {currentScreen === 'settings' && <PlaceholderScreen title="Settings" icon="settings" />}
      
      {!['scanning', 'results'].includes(currentScreen) && <BottomNavigation />}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  scanButton: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonContent: {
    alignItems: 'center',
  },
  scanIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  scanButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cropCard: {
    width: (width - 72) / 2,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cropIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropEmoji: {
    fontSize: 24,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  scanCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  scanDisease: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scanDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  scanDate: {
    fontSize: 12,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  // Scanning Screen Styles
  scanningContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningBorder: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  scanningLine: {
    position: 'absolute',
    left: width * 0.15,
    right: width * 0.15,
    height: 3,
    backgroundColor: '#10b981',
    borderRadius: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  scanningContent: {
    position: 'absolute',
    bottom: 200,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  scanningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  scanningSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Results Screen Styles
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultCard: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  diseaseIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  treatmentContainer: {
    gap: 16,
  },
  treatmentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  treatmentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  treatmentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Bottom Navigation Styles
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  // Placeholder Screen Styles
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AgriSenseApp;
