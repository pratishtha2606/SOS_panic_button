export interface EmergencyAlert {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  deviceId: string;
  message: string;
  contacts: {
    [key: string]: string;
  };
  acknowledged: boolean;
  ackBy?: string;
  ackTime?: number;
}

export interface AlertFilters {
  status: 'all' | 'active' | 'acknowledged';
  search: string;
}