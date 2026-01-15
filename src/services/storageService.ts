import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DEVICES: 'netscan_devices',
  FAVORITES: 'netscan_favorites',
  SETTINGS: 'netscan_settings',
  SCAN_HISTORY: 'netscan_history',
};

export interface Device {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  deviceType: 'router' | 'phone' | 'pc' | 'tv' | 'iot' | 'unknown';
  isFavorite: boolean;
  isTrusted: boolean;
  customName?: string;
  notes?: string;
  lastSeen: number;
  firstSeen: number;
  isOnline: boolean;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  scanInterval: number;
  scanTimeout: number;
  notifyNewDevices: boolean;
  notifyOffline: boolean;
}

export interface ScanHistoryEntry {
  timestamp: number;
  deviceCount: number;
  networkName: string;
}

const defaultSettings: Settings = {
  theme: 'dark',
  scanInterval: 30000,
  scanTimeout: 5000,
  notifyNewDevices: true,
  notifyOffline: false,
};

export const storageService = {
  // Devices
  async getDevices(): Promise<Device[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DEVICES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  },

  async saveDevices(devices: Device[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.DEVICES, JSON.stringify(devices));
    } catch (error) {
      console.error('Error saving devices:', error);
    }
  },

  async addOrUpdateDevice(device: Partial<Device> & { mac: string }): Promise<Device> {
    const devices = await this.getDevices();
    const now = Date.now();
    const index = devices.findIndex(d => d.mac === device.mac);

    if (index >= 0) {
      devices[index] = {
        ...devices[index],
        ...device,
        lastSeen: now,
        isOnline: true,
      };
      await this.saveDevices(devices);
      return devices[index];
    } else {
      const newDevice: Device = {
        id: device.mac,
        ip: device.ip || '',
        mac: device.mac,
        hostname: device.hostname || '',
        vendor: device.vendor || 'Unknown',
        deviceType: device.deviceType || 'unknown',
        isFavorite: false,
        isTrusted: false,
        customName: undefined,
        notes: undefined,
        firstSeen: now,
        lastSeen: now,
        isOnline: true,
        ...device,
      };
      devices.push(newDevice);
      await this.saveDevices(devices);
      return newDevice;
    }
  },

  async toggleFavorite(mac: string): Promise<void> {
    const devices = await this.getDevices();
    const device = devices.find(d => d.mac === mac);
    if (device) {
      device.isFavorite = !device.isFavorite;
      await this.saveDevices(devices);
    }
  },

  async toggleTrusted(mac: string): Promise<void> {
    const devices = await this.getDevices();
    const device = devices.find(d => d.mac === mac);
    if (device) {
      device.isTrusted = !device.isTrusted;
      await this.saveDevices(devices);
    }
  },

  async updateDeviceName(mac: string, name: string): Promise<void> {
    const devices = await this.getDevices();
    const device = devices.find(d => d.mac === mac);
    if (device) {
      device.customName = name;
      await this.saveDevices(devices);
    }
  },

  async deleteDevice(mac: string): Promise<void> {
    const devices = await this.getDevices();
    const filtered = devices.filter(d => d.mac !== mac);
    await this.saveDevices(filtered);
  },

  async markDevicesOffline(onlineMacs: string[]): Promise<void> {
    const devices = await this.getDevices();
    devices.forEach(device => {
      device.isOnline = onlineMacs.includes(device.mac);
    });
    await this.saveDevices(devices);
  },

  // Settings
  async getSettings(): Promise<Settings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  },

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      const current = await this.getSettings();
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Scan History
  async getScanHistory(): Promise<ScanHistoryEntry[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCAN_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting scan history:', error);
      return [];
    }
  },

  async addScanHistory(entry: ScanHistoryEntry): Promise<void> {
    try {
      const history = await this.getScanHistory();
      history.unshift(entry);
      // Keep only last 100 entries
      const trimmed = history.slice(0, 100);
      await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error adding scan history:', error);
    }
  },

  // Clear all
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
