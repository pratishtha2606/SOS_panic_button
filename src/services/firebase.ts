import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, off, DatabaseReference } from 'firebase/database';
import { EmergencyAlert } from '../types/Alert';

const firebaseConfig = {
  apiKey: "AIzaSyDxWfGFo5_3XUwAH3RxBCBd3cCrQBBFR4E",
  authDomain: "sos-panic-button.firebaseapp.com",
  databaseURL: "https://sos-panic-button-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sos-panic-button",
  storageBucket: "sos-panic-button.firebasestorage.app",
  messagingSenderId: "385133448064",
  appId: "1:385133448064:web:a1c5200fe91a19e1af0f65",
  measurementId: "G-R9S6H7ES8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseService {
  private alertsRef: DatabaseReference;
  private listeners: Map<string, () => void> = new Map();

  constructor() {
    this.alertsRef = ref(database, 'emergency_alerts');
  }

  // Subscribe to real-time alert updates
  subscribeToAlerts(callback: (alerts: EmergencyAlert[]) => void): () => void {
    const unsubscribe = onValue(this.alertsRef, (snapshot) => {
      const data = snapshot.val();
      const alerts: EmergencyAlert[] = [];

      if (data) {
        Object.keys(data).forEach(key => {
          alerts.push({
            id: key,
            ...data[key]
          });
        });
      }

      // Sort by timestamp (newest first)
      alerts.sort((a, b) => b.timestamp - a.timestamp);
      callback(alerts);
    });

    return () => {
      off(this.alertsRef);
    };
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, responderName: string): Promise<void> {
    const alertRef = ref(database, `emergency_alerts/${alertId}`);
    await update(alertRef, {
      acknowledged: true,
      ackBy: responderName,
      ackTime: Date.now()
    });
  }

  // Add a test alert (for development)
  async addTestAlert(): Promise<void> {
    const testAlert = {
      name: "Test User",
      latitude: 12.9716 + (Math.random() - 0.5) * 0.01,
      longitude: 77.5946 + (Math.random() - 0.5) * 0.01,
      timestamp: Date.now(),
      deviceId: `TEST_${Math.random().toString(36).substr(2, 9)}`,
      message: "Test emergency alert - Please ignore",
      contacts: {
        contact1: "+919876543210",
        contact2: "+919123456789"
      },
      acknowledged: false
    };

    const newAlertRef = ref(database, `emergency_alerts/${Date.now()}`);
    await update(newAlertRef, testAlert);
  }
}

export const firebaseService = new FirebaseService();