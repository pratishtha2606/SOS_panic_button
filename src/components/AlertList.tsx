import React, { useState } from 'react';
import { Clock, MapPin, User, MessageSquare, Check, Search, Filter, Phone } from 'lucide-react';
import { EmergencyAlert, AlertFilters } from '../types/Alert';
import { formatTimestamp } from '../utils/dateUtils';
import { calculateDistance, formatDistance } from '../utils/distance';

interface AlertListProps {
  alerts: EmergencyAlert[];
  selectedAlert: EmergencyAlert | null;
  userLocation: { latitude: number; longitude: number } | null;
  onAlertSelect: (alert: EmergencyAlert) => void;
  onAcknowledge: (alertId: string) => void;
}

export function AlertList({ alerts, selectedAlert, userLocation, onAlertSelect, onAcknowledge }: AlertListProps) {
  const [filters, setFilters] = useState<AlertFilters>({
    status: 'all',
    search: ''
  });

  const filteredAlerts = alerts.filter(alert => {
    // Status filter
    if (filters.status === 'active' && alert.acknowledged) return false;
    if (filters.status === 'acknowledged' && !alert.acknowledged) return false;

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        alert.name.toLowerCase().includes(search) ||
        alert.deviceId.toLowerCase().includes(search) ||
        alert.message.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const activeCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="bg-gray-900 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Emergency Alerts</h2>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              {activeCount} Active
            </div>
            <div className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
              {alerts.length} Total
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, device ID, or message..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'acknowledged'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilters(prev => ({ ...prev, status }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  filters.status === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Filter className="w-3 h-3 inline mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No alerts found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onAlertSelect(alert)}
                className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-750 border-l-4 ${
                  alert.acknowledged 
                    ? 'border-green-500 opacity-75' 
                    : 'border-red-500'
                } ${
                  selectedAlert?.id === alert.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-lg">{alert.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        alert.acknowledged 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200 animate-pulse'
                      }`}>
                        {alert.acknowledged ? 'Acknowledged' : 'Active'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{alert.message}</p>
                  </div>
                  
                  {!alert.acknowledged && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledge(alert.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Acknowledge
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(alert.timestamp)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {alert.deviceId}
                    </div>
                    {userLocation && (
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        {formatDistance(calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          alert.latitude,
                          alert.longitude
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {Object.keys(alert.contacts).length > 0 && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {Object.keys(alert.contacts).length} contacts
                    </div>
                  )}
                </div>

                {alert.acknowledged && (
                  <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Acknowledged by {alert.ackBy} • {formatTimestamp(alert.ackTime!)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}