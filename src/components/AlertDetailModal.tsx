import React from 'react';
import { X, Clock, MapPin, User, Phone, MessageSquare, ExternalLink, Copy, Check } from 'lucide-react';
import { EmergencyAlert } from '../types/Alert';
import { formatTimestamp, formatFullDate } from '../utils/dateUtils';

interface AlertDetailModalProps {
  alert: EmergencyAlert;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
}

export function AlertDetailModal({ alert, onClose, onAcknowledge }: AlertDetailModalProps) {
  const [copySuccess, setCopySuccess] = React.useState(false);

  const shareUrl = `${window.location.origin}?alert=${alert.id}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCallContact = (contact: string) => {
    window.open(`tel:${contact}`, '_self');
  };

  const handleSMSContact = (contact: string) => {
    const message = encodeURIComponent(`Emergency Alert: ${alert.name} needs assistance. Location: ${alert.latitude}, ${alert.longitude}`);
    window.open(`sms:${contact}?body=${message}`, '_self');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{alert.name}</h2>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  alert.acknowledged 
                    ? 'bg-green-900 text-green-200' 
                    : 'bg-red-900 text-red-200 animate-pulse'
                }`}>
                  {alert.acknowledged ? 'Acknowledged' : 'Active Emergency'}
                </span>
              </div>
              <p className="text-gray-300 text-lg">{alert.message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 -m-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Alert Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{formatTimestamp(alert.timestamp)}</div>
                    <div className="text-sm text-gray-400">{formatFullDate(alert.timestamp)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Device ID</div>
                    <div className="text-sm text-gray-400">{alert.deviceId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Coordinates</div>
                    <div className="text-sm text-gray-400">
                      {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Emergency Message</div>
                    <div className="text-sm text-gray-400">{alert.message}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Emergency Contacts</h3>
              
              {Object.keys(alert.contacts).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(alert.contacts).map(([key, contact]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{contact}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCallContact(contact)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Call
                        </button>
                        <button
                          onClick={() => handleSMSContact(contact)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          SMS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No emergency contacts available</p>
              )}
            </div>
          </div>

          {/* Acknowledgment Status */}
          {alert.acknowledged && (
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-400" />
                <div>
                  <div className="font-medium text-green-200">Alert Acknowledged</div>
                  <div className="text-sm text-green-300">
                    By {alert.ackBy} • {formatTimestamp(alert.ackTime!)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Google Maps
            </a>

            <button
              onClick={handleCopyLink}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Share Link
                </>
              )}
            </button>

            {!alert.acknowledged && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Acknowledge Alert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}