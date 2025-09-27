import React from 'react';
import { X, MapPin, Clock } from 'lucide-react';
import { EmergencyAlert } from '../types/Alert';
import { formatTimestamp } from '../utils/dateUtils';

interface NotificationToastProps {
  alert: EmergencyAlert;
  onView: () => void;
  onClose: () => void;
}

export function NotificationToast({ alert, onView, onClose }: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-red-600 text-white rounded-lg shadow-xl p-4 max-w-sm animate-slide-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
            <span className="font-semibold text-sm">NEW EMERGENCY ALERT</span>
          </div>
          
          <h3 className="font-bold text-lg mb-1">{alert.name}</h3>
          <p className="text-red-100 text-sm mb-2 line-clamp-2">{alert.message}</p>
          
          <div className="flex items-center gap-4 text-xs text-red-200 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(alert.timestamp)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {alert.deviceId}
            </div>
          </div>
          
          <button
            onClick={onView}
            className="bg-white text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors"
          >
            View on Map
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="text-red-200 hover:text-white p-1 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}