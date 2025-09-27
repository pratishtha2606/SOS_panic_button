const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Twilio configuration (set these in Firebase Functions config)
// firebase functions:config:set twilio.sid="your_twilio_sid" twilio.token="your_twilio_token" twilio.phone="+1234567890"
const twilio = require('twilio');

/**
 * Cloud Function triggered when new emergency alert is added
 * Sends SMS notifications to emergency contacts
 */
exports.sendEmergencyNotifications = functions.database
  .ref('/emergency_alerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    try {
      const alert = snapshot.val();
      const alertId = context.params.alertId;
      
      console.log(`Processing new emergency alert: ${alertId}`, alert);

      // Validate alert data
      if (!alert.name || !alert.latitude || !alert.longitude || !alert.contacts) {
        console.error('Invalid alert data:', alert);
        return null;
      }

      const notifications = [];

      // Send SMS notifications using Twilio
      if (functions.config().twilio && functions.config().twilio.sid) {
        const client = twilio(
          functions.config().twilio.sid,
          functions.config().twilio.token
        );

        const message = `🚨 EMERGENCY ALERT 🚨
Name: ${alert.name}
Message: ${alert.message}
Device: ${alert.deviceId}
Location: https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}
Time: ${new Date(alert.timestamp).toLocaleString()}

This is an automated emergency notification.`;

        // Send SMS to each contact
        for (const [key, phoneNumber] of Object.entries(alert.contacts)) {
          try {
            const sms = await client.messages.create({
              body: message,
              from: functions.config().twilio.phone,
              to: phoneNumber
            });
            
            notifications.push({
              type: 'sms',
              contact: phoneNumber,
              status: 'sent',
              sid: sms.sid
            });
            
            console.log(`SMS sent to ${phoneNumber}: ${sms.sid}`);
          } catch (smsError) {
            console.error(`Failed to send SMS to ${phoneNumber}:`, smsError);
            notifications.push({
              type: 'sms',
              contact: phoneNumber,
              status: 'failed',
              error: smsError.message
            });
          }
        }
      } else {
        console.warn('Twilio not configured. SMS notifications disabled.');
      }

      // Send push notifications using FCM (Firebase Cloud Messaging)
      // This requires storing FCM tokens for emergency responders
      try {
        const payload = {
          notification: {
            title: `🚨 Emergency Alert: ${alert.name}`,
            body: `${alert.message} - Location: ${alert.latitude}, ${alert.longitude}`,
            icon: '/favicon.ico',
            click_action: `https://your-domain.com/?alert=${alertId}`
          },
          data: {
            alertId: alertId,
            latitude: alert.latitude.toString(),
            longitude: alert.longitude.toString(),
            timestamp: alert.timestamp.toString()
          }
        };

        // Get FCM tokens for emergency responders from database
        const tokensSnapshot = await admin.database()
          .ref('/responder_tokens')
          .once('value');
        
        const tokens = [];
        if (tokensSnapshot.exists()) {
          tokensSnapshot.forEach(child => {
            tokens.push(child.val());
          });
        }

        if (tokens.length > 0) {
          const response = await admin.messaging().sendToDevice(tokens, payload);
          
          notifications.push({
            type: 'push',
            status: 'sent',
            successCount: response.successCount,
            failureCount: response.failureCount
          });
          
          console.log(`Push notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
        } else {
          console.warn('No FCM tokens found for responders');
        }
      } catch (pushError) {
        console.error('Failed to send push notifications:', pushError);
        notifications.push({
          type: 'push',
          status: 'failed',
          error: pushError.message
        });
      }

      // Store notification results in database
      await admin.database()
        .ref(`/emergency_alerts/${alertId}/notifications`)
        .set({
          sentAt: admin.database.ServerValue.TIMESTAMP,
          results: notifications
        });

      console.log(`Notification processing completed for alert ${alertId}`);
      return notifications;

    } catch (error) {
      console.error('Error processing emergency alert:', error);
      
      // Store error in database for debugging
      await admin.database()
        .ref(`/emergency_alerts/${context.params.alertId}/notifications`)
        .set({
          sentAt: admin.database.ServerValue.TIMESTAMP,
          error: error.message,
          results: []
        });
      
      throw error;
    }
  });

/**
 * HTTP function to manually trigger notifications (for testing)
 */
exports.testNotification = functions.https.onRequest(async (req, res) => {
  try {
    const testAlert = {
      name: 'Test User',
      message: 'This is a test emergency alert',
      deviceId: 'TEST_DEVICE_001',
      latitude: 12.9716,
      longitude: 77.5946,
      timestamp: Date.now(),
      contacts: {
        contact1: '+919876543210' // Replace with your test number
      }
    };

    const alertRef = admin.database().ref('/emergency_alerts').push();
    await alertRef.set(testAlert);

    res.json({
      success: true,
      message: 'Test alert created',
      alertId: alertRef.key
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Function to manage FCM tokens for responders
 */
exports.registerResponderToken = functions.https.onRequest(async (req, res) => {
  try {
    const { token, responderId } = req.body;
    
    if (!token || !responderId) {
      return res.status(400).json({
        error: 'Token and responderId are required'
      });
    }

    await admin.database()
      .ref(`/responder_tokens/${responderId}`)
      .set(token);

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});