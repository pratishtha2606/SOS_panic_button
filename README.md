# SOS Panic Button - Emergency Alert Dashboard

A real-time emergency alert monitoring system built with React and Firebase. This dashboard receives and displays SOS alerts from panic buttons, showing their location on an interactive map and enabling emergency responders to acknowledge alerts.

## 🚨 Features

### Core Functionality
- **Real-time Alert Monitoring**: Live updates from Firebase Realtime Database
- **Interactive Map**: Leaflet-based map with color-coded alert markers
- **Acknowledgment System**: Mark alerts as resolved with responder tracking
- **Audio & Visual Notifications**: Sound alerts and toast notifications for new emergencies
- **Mobile Responsive**: Optimized for both desktop and mobile use
- **Emergency Contacts**: Call/SMS integration for emergency contacts

### Advanced Features
- **Filtering & Search**: Filter by status (all/active/acknowledged) and search by name/device
- **Distance Calculation**: Shows distance from user location (if permitted)
- **Deep Linking**: Shareable links to specific alerts
- **Offline Detection**: Shows connection status
- **Dark Theme**: Emergency services-focused dark UI
- **Cloud Functions**: Automated SMS/push notifications

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Map**: React-Leaflet, OpenStreetMap
- **Backend**: Firebase Realtime Database
- **Notifications**: Firebase Cloud Functions, Twilio (SMS), FCM (Push)
- **Build**: Vite
- **Deployment**: Firebase Hosting

## 📋 Prerequisites

- Node.js 18 or later
- Firebase account
- (Optional) Twilio account for SMS notifications
- (Optional) Google Maps API key

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd sos-emergency-dashboard
npm install
```

### 2. Firebase Setup

#### Configure Firebase Project
The project is pre-configured to connect to the SOS Panic Button Firebase project:
- Database URL: `https://sos-panic-button-default-rtdb.asia-southeast1.firebasedatabase.app`
- Project ID: `sos-panic-button`

#### Set Database Rules
In Firebase Console, go to Realtime Database → Rules and paste the following:

```json
{
  "rules": {
    "emergency_alerts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$alertId": {
        ".validate": "newData.hasChildren(['name', 'latitude', 'longitude', 'timestamp', 'deviceId', 'message', 'contacts', 'acknowledged'])",
        "name": { ".validate": "newData.isString() && newData.val().length > 0" },
        "latitude": { ".validate": "newData.isNumber() && newData.val() >= -90 && newData.val() <= 90" },
        "longitude": { ".validate": "newData.isNumber() && newData.val() >= -180 && newData.val() <= 180" },
        "timestamp": { ".validate": "newData.isNumber() && newData.val() > 0" },
        "deviceId": { ".validate": "newData.isString() && newData.val().length > 0" },
        "message": { ".validate": "newData.isString()" },
        "contacts": { ".validate": "newData.hasChildren()" },
        "acknowledged": { ".validate": "newData.isBoolean()" }
      }
    },
    "responder_tokens": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

**⚠️ Security Note**: For development, you can temporarily use:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
**Remember to secure these rules before production deployment!**

### 3. Development Server
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### 4. Test the System
- Click the settings icon (bottom-left) to access developer tools
- Click "Add Test Alert" to create a sample emergency alert
- Watch the alert appear in real-time with sound notification

## 🗺 Map Configuration

### Using OpenStreetMap (Default - Free)
The dashboard uses OpenStreetMap by default. No API key required.

### Switching to Google Maps (Optional)
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Replace the map component in `src/components/MapView.tsx`
3. Add your API key to environment variables

## 📱 Cloud Functions Setup (Optional)

### Prerequisites
- Firebase CLI: `npm install -g firebase-tools`
- Twilio account (for SMS notifications)

### Deploy Functions
```bash
cd functions/sendNotifications
npm install

# Configure Twilio (optional)
firebase functions:config:set twilio.sid="your_twilio_sid"
firebase functions:config:set twilio.token="your_twilio_token"  
firebase functions:config:set twilio.phone="+1234567890"

# Deploy
firebase deploy --only functions
```

### Function Endpoints
- `sendEmergencyNotifications`: Triggered automatically on new alerts
- `testNotification`: HTTP endpoint for testing notifications
- `registerResponderToken`: Register FCM tokens for push notifications

## 📊 Data Schema

### Emergency Alert Structure
```json
{
  "emergency_alerts": {
    "alertId": {
      "name": "John Doe",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "timestamp": 1693123456789,
      "deviceId": "NodeMCU_001",
      "message": "Needs medical help",
      "contacts": {
        "contact1": "+919876543210",
        "contact2": "+919123456789"
      },
      "acknowledged": false,
      "ackBy": "Responder Name",
      "ackTime": 1693123500000
    }
  }
}
```

## 🌐 Deployment

### Firebase Hosting
```bash
# Build the project
npm run build

# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (if not already done)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Other Hosting Platforms
The built files in `dist/` can be deployed to any static hosting service:
- Netlify
- Vercel
- AWS S3
- GitHub Pages

## 🔧 Environment Variables

Create `.env` file for custom configurations:
```env
# Optional: Custom Firebase config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_DATABASE_URL=your_database_url

# Optional: Google Maps API key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 📱 Mobile App Integration

For panic button devices/apps to send alerts, they should POST to the Firebase Realtime Database:

```javascript
// Example: Sending an alert from a panic button
const alertData = {
  name: "Emergency User",
  latitude: userLocation.lat,
  longitude: userLocation.lng,
  timestamp: Date.now(),
  deviceId: "DEVICE_123",
  message: "Emergency assistance needed",
  contacts: {
    contact1: "+1234567890",
    contact2: "+0987654321"
  },
  acknowledged: false
};

// Push to Firebase
fetch('https://sos-panic-button-default-rtdb.asia-southeast1.firebasedatabase.app/emergency_alerts.json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(alertData)
});
```

## 🔐 Security Considerations

### Production Security Checklist
- [ ] Enable Firebase Authentication
- [ ] Restrict database rules to authenticated users only
- [ ] Use HTTPS for all communications
- [ ] Implement proper CORS policies
- [ ] Sanitize user inputs
- [ ] Rate limit API calls
- [ ] Monitor for suspicious activities
- [ ] Regular security audits

### Recommended Database Rules (Production)
```json
{
  "rules": {
    "emergency_alerts": {
      ".read": "auth != null && auth.token.role == 'responder'",
      ".write": "auth != null && (auth.token.role == 'device' || auth.token.role == 'responder')"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check Firebase configuration
   - Verify database URL is correct
   - Ensure database rules allow read/write

2. **Map Not Loading**
   - Check internet connection
   - Verify Leaflet CSS is loaded
   - Check browser console for errors

3. **Notifications Not Working**
   - Check browser notification permissions
   - Verify audio context is enabled
   - Check Firebase Functions logs

4. **Location Not Working**
   - Ensure HTTPS (required for geolocation)
   - Check browser location permissions
   - Verify GPS is enabled

### Debug Mode
Enable debug logging by adding to localStorage:
```javascript
localStorage.setItem('debug', 'true');
```

## 📞 Support

For issues and questions:
- Check the browser console for error messages
- Review Firebase console for database issues
- Test with sample data using the developer tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Emergency Use Disclaimer

This software is designed for emergency response purposes. While every effort has been made to ensure reliability, users should not rely solely on this system for critical emergency response. Always maintain backup communication methods and follow established emergency protocols.