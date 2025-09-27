import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AlertTriangle, Shield, Wifi, WifiOff } from 'lucide-react';
import { EmergencyAlert } from './types/Alert';
import { firebaseService } from './services/firebase';
import { AlertList } from './components/AlertList';
import { MapView } from './components/MapView';
import { AlertDetailModal } from './components/AlertDetailModal';
import { NotificationToast } from './components/NotificationToast';
import { TestPanel } from './components/TestPanel';
import { useGeolocation } from './hooks/useGeolocation';

function App() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [detailModalAlert, setDetailModalAlert] = useState<EmergencyAlert | null>(null);
  const [newAlertToast, setNewAlertToast] = useState<EmergencyAlert | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [responderName] = useState('Emergency Responder'); // In production, this would come from auth
  const alertSound = useRef<HTMLAudioElement | null>(null);
  const prevAlertsCount = useRef(0);
  const { latitude, longitude, error: locationError } = useGeolocation();

  // Initialize alert sound
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createBeep = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      };

      alertSound.current = { play: createBeep } as any;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }, []);

  // Subscribe to Firebase alerts
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAlerts((newAlerts) => {
      // Check for new alerts to show notifications
      if (newAlerts.length > prevAlertsCount.current && prevAlertsCount.current > 0) {
        const latestAlert = newAlerts[0];
        if (!latestAlert.acknowledged) {
          // Play sound
          if (alertSound.current) {
            try {
              alertSound.current.play();
            } catch (error) {
              console.warn('Could not play alert sound:', error);
            }
          }

          // Show toast notification
          setNewAlertToast(latestAlert);

          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(`🚨 Emergency Alert: ${latestAlert.name}`, {
              body: latestAlert.message,
              icon: '/favicon.ico'
            });
          }
        }
      }

      prevAlertsCount.current = newAlerts.length;
      setAlerts(newAlerts);
    });

    return unsubscribe;
  }, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle URL-based alert selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('alert');
    
    if (alertId && alerts.length > 0) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        setSelectedAlert(alert);
        setDetailModalAlert(alert);
      }
    }
  }, [alerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await firebaseService.acknowledgeAlert(alertId, responderName);
      toast.success('Alert acknowledged successfully');
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleViewNewAlert = () => {
    if (newAlertToast) {
      setSelectedAlert(newAlertToast);
      setNewAlertToast(null);
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const userLocation = latitude && longitude ? { latitude, longitude } : null;

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-red-600 shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Emergency Alert Dashboard</h1>
              <p className="text-red-100 text-sm">Real-time SOS monitoring system</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-600' : 'bg-red-800'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Connected' : 'Offline'}
            </div>
            
            {/* Alert Summary */}
            <div className="text-center">
              <div className="text-2xl font-bold">{activeAlerts.length}</div>
              <div className="text-xs text-red-100">Active Alerts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{alerts.length}</div>
              <div className="text-xs text-red-100">Total Today</div>
            </div>
          </div>
        </div>
      </header>

      {/* Location Permission Notice */}
      {locationError && (
        <div className="bg-orange-600 text-white p-2 text-center text-sm">
          <Shield className="w-4 h-4 inline mr-2" />
          Location access denied. Distance calculations unavailable.
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Alert List - Left Panel */}
        <div className="w-full lg:w-1/3 border-r border-gray-700">
          <AlertList
            alerts={alerts}
            selectedAlert={selectedAlert}
            userLocation={userLocation}
            onAlertSelect={setSelectedAlert}
            onAcknowledge={handleAcknowledge}
          />
        </div>

        {/* Map View - Right Panel */}
        <div className="hidden lg:block flex-1">
          <MapView
            alerts={alerts}
            selectedAlert={selectedAlert}
            onAlertSelect={(alert) => {
              setSelectedAlert(alert);
              setDetailModalAlert(alert);
            }}
            onAcknowledge={handleAcknowledge}
          />
        </div>
      </div>

      {/* Mobile Map Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <button
          onClick={() => setDetailModalAlert(selectedAlert)}
          disabled={!selectedAlert}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>
      </div>

      {/* Alert Detail Modal */}
      {detailModalAlert && (
        <AlertDetailModal
          alert={detailModalAlert}
          onClose={() => setDetailModalAlert(null)}
          onAcknowledge={handleAcknowledge}
        />
      )}

      {/* New Alert Toast Notification */}
      {newAlertToast && (
        <NotificationToast
          alert={newAlertToast}
          onView={handleViewNewAlert}
          onClose={() => setNewAlertToast(null)}
        />
      )}

      {/* Toast Container */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: 'white',
            border: '1px solid #374151',
          },
        }}
      />

      {/* Developer Test Panel */}
      <TestPanel />
    </div>
  );
}

export default App;