import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { EmergencyAlert } from '../types/Alert';
import { formatTimestamp, formatFullDate } from '../utils/dateUtils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different alert states
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const acknowledgedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  alerts: EmergencyAlert[];
  selectedAlert: EmergencyAlert | null;
  onAlertSelect: (alert: EmergencyAlert) => void;
  onAcknowledge: (alertId: string) => void;
}

function MapController({ alerts, selectedAlert }: { alerts: EmergencyAlert[]; selectedAlert: EmergencyAlert | null }) {
  const map = useMap();

  useEffect(() => {
    if (alerts.length > 0) {
      const bounds = L.latLngBounds(alerts.map(alert => [alert.latitude, alert.longitude]));
      
      if (selectedAlert) {
        // Focus on selected alert
        map.setView([selectedAlert.latitude, selectedAlert.longitude], 16);
      } else {
        // Fit all alerts
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [alerts, selectedAlert, map]);

  return null;
}

export function MapView({ alerts, selectedAlert, onAlertSelect, onAcknowledge }: MapViewProps) {
  const mapRef = useRef<L.Map>(null);

  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore coordinates
  const defaultZoom = 13;

  return (
    <div className="h-full relative">
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController alerts={alerts} selectedAlert={selectedAlert} />
        
        {alerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.latitude, alert.longitude]}
            icon={alert.acknowledged ? acknowledgedIcon : activeIcon}
            eventHandlers={{
              click: () => onAlertSelect(alert),
            }}
          >
            <Popup className="emergency-popup">
              <div className="p-2 min-w-[250px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{alert.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    alert.acknowledged 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {alert.acknowledged ? 'Acknowledged' : 'Active'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><strong>Message:</strong> {alert.message}</p>
                  <p><strong>Device:</strong> {alert.deviceId}</p>
                  <p><strong>Time:</strong> {formatFullDate(alert.timestamp)}</p>
                  <p><strong>Location:</strong> {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}</p>
                  
                  {Object.keys(alert.contacts).length > 0 && (
                    <div>
                      <strong>Emergency Contacts:</strong>
                      <ul className="mt-1 space-y-1">
                        {Object.entries(alert.contacts).map(([key, contact]) => (
                          <li key={key} className="flex items-center justify-between">
                            <span>{contact}</span>
                            <a
                              href={`tel:${contact}`}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Call
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {alert.acknowledged && (
                    <p className="text-green-700">
                      <strong>Acknowledged by:</strong> {alert.ackBy} 
                      <br />
                      <small>{formatTimestamp(alert.ackTime!)}</small>
                    </p>
                  )}
                </div>
                
                {!alert.acknowledged && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge(alert.id);
                    }}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Acknowledge Alert
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-sm">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Active Alert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Acknowledged</span>
          </div>
        </div>
      </div>
    </div>
  );
}