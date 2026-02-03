import { NativeModules, Platform } from 'react-native';

const { NetworkScanner } = NativeModules;

export interface WifiInfo {
  ssid: string;
  bssid: string;
  rssi: number;
  linkSpeed: number;
  ip: string;
}

export interface ScannedDevice {
  ip: string;
  hostname: string;
  mac: string;
}

export interface PingResult {
  success: boolean;
  latency: number;
  ip?: string;
  error?: string;
}

export interface PortResult {
  open: boolean;
  port: number;
}

export interface DnsResult {
  hostname: string;
  addresses: string[];
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  latency: number;
}

// MAC vendor prefixes (subset for common devices)
const MAC_VENDORS: Record<string, string> = {
  '00:00:0C': 'Cisco',
  '00:1A:2B': 'Ayecom',
  '00:1B:63': 'Apple',
  '00:1E:C2': 'Apple',
  '00:21:E9': 'Apple',
  '00:23:12': 'Apple',
  '00:25:00': 'Apple',
  '00:26:08': 'Apple',
  '00:26:BB': 'Apple',
  '00:50:56': 'VMware',
  '08:00:27': 'VirtualBox',
  '18:65:90': 'Apple',
  '28:CF:DA': 'Apple',
  '34:51:C9': 'Apple',
  '38:C9:86': 'Apple',
  '40:33:1A': 'Apple',
  '44:D8:84': 'Apple',
  '48:60:BC': 'Apple',
  '4C:57:CA': 'Apple',
  '54:26:96': 'Apple',
  '58:55:CA': 'Apple',
  '5C:F9:38': 'Apple',
  '60:03:08': 'Apple',
  '64:20:0C': 'Apple',
  '68:5B:35': 'Apple',
  '6C:40:08': 'Apple',
  '70:DE:E2': 'Apple',
  '74:E1:B6': 'Apple',
  '78:31:C1': 'Apple',
  '7C:D1:C3': 'Apple',
  '80:49:71': 'Apple',
  '84:38:35': 'Apple',
  '88:66:A5': 'Apple',
  '8C:85:90': 'Apple',
  '90:8D:6C': 'Apple',
  '94:94:26': 'Apple',
  '98:D6:BB': 'Apple',
  '9C:20:7B': 'Apple',
  'A0:99:9B': 'Apple',
  'A4:D1:8C': 'Apple',
  'A8:88:08': 'Apple',
  'AC:BC:32': 'Apple',
  'B0:34:95': 'Apple',
  'B4:F0:AB': 'Apple',
  'B8:C1:11': 'Apple',
  'BC:52:B7': 'Apple',
  'C0:63:94': 'Apple',
  'C4:2C:03': 'Apple',
  'C8:69:CD': 'Apple',
  'CC:08:E0': 'Apple',
  'D0:03:4B': 'Apple',
  'D4:61:9D': 'Apple',
  'D8:00:4D': 'Apple',
  'DC:2B:2A': 'Apple',
  'E0:5F:45': 'Apple',
  'E4:8B:7F': 'Apple',
  'E8:06:88': 'Apple',
  'EC:35:86': 'Apple',
  'F0:B4:79': 'Apple',
  'F4:37:B7': 'Apple',
  'F8:1E:DF': 'Apple',
  'FC:E9:98': 'Apple',
  'B8:27:EB': 'Raspberry Pi',
  'DC:A6:32': 'Raspberry Pi',
  'E4:5F:01': 'Raspberry Pi',
  '00:1A:79': 'Samsung',
  '00:21:4C': 'Samsung',
  '00:26:5D': 'Samsung',
  '08:08:C2': 'Samsung',
  '10:1D:C0': 'Samsung',
  '18:3A:2D': 'Samsung',
  '20:13:E0': 'Samsung',
  '28:98:7B': 'Samsung',
  '30:CD:A7': 'Samsung',
  '34:23:BA': 'Samsung',
  '38:01:95': 'Samsung',
  '40:0E:85': 'Samsung',
  '44:6D:6C': 'Samsung',
  '48:44:F7': 'Samsung',
  '50:01:BB': 'Samsung',
  '54:40:AD': 'Samsung',
  '58:C3:8B': 'Samsung',
  '60:D0:A9': 'Samsung',
  '64:77:91': 'Samsung',
  '68:48:98': 'Samsung',
  '6C:2F:2C': 'Samsung',
  '70:F9:27': 'Samsung',
  '00:0C:29': 'VMware',
  '00:15:5D': 'Microsoft Hyper-V',
  '00:0D:3A': 'Microsoft',
  '00:17:FA': 'Microsoft',
  '28:18:78': 'Microsoft',
  '30:59:B7': 'Microsoft',
  '44:03:2C': 'Intel',
  '4C:34:88': 'Intel',
  '58:A0:23': 'Intel',
  '64:80:99': 'Intel',
  '7C:5C:F8': 'Intel',
  '88:53:95': 'Intel',
  '00:24:D4': 'NETGEAR',
  '00:26:F2': 'NETGEAR',
  '20:4E:7F': 'NETGEAR',
  '30:46:9A': 'NETGEAR',
  '44:94:FC': 'NETGEAR',
  '6C:B0:CE': 'NETGEAR',
  '84:1B:5E': 'NETGEAR',
  '9C:3D:CF': 'NETGEAR',
  'A4:2B:8C': 'NETGEAR',
  'C0:3F:0E': 'NETGEAR',
  'E0:91:F5': 'NETGEAR',
  '00:18:E7': 'TP-Link',
  '14:CC:20': 'TP-Link',
  '30:B5:C2': 'TP-Link',
  '50:C7:BF': 'TP-Link',
  '64:70:02': 'TP-Link',
  '90:F6:52': 'TP-Link',
  'AC:84:C6': 'TP-Link',
  'C0:25:E9': 'TP-Link',
  'E8:DE:27': 'TP-Link',
  '00:0C:43': 'Ralink',
  '00:17:9A': 'D-Link',
  '00:1E:58': 'D-Link',
  '00:26:5A': 'D-Link',
  '14:D6:4D': 'D-Link',
  '28:10:7B': 'D-Link',
  '34:08:04': 'D-Link',
  '5C:D9:98': 'D-Link',
  '78:54:2E': 'D-Link',
  '9C:D6:43': 'D-Link',
  'AC:F1:DF': 'D-Link',
  'C8:D3:A3': 'D-Link',
  '18:FE:34': 'Espressif (IoT)',
  '24:0A:C4': 'Espressif (IoT)',
  '30:AE:A4': 'Espressif (IoT)',
  '3C:71:BF': 'Espressif (IoT)',
  '5C:CF:7F': 'Espressif (IoT)',
  '84:F3:EB': 'Espressif (IoT)',
  'A4:CF:12': 'Espressif (IoT)',
  'AC:D0:74': 'Espressif (IoT)',
  'BC:DD:C2': 'Espressif (IoT)',
  'C4:4F:33': 'Espressif (IoT)',
  'CC:50:E3': 'Espressif (IoT)',
  'EC:FA:BC': 'Espressif (IoT)',
  '00:00:48': 'Seiko Epson',
  '00:26:AB': 'Seiko Epson',
  '64:EB:8C': 'Seiko Epson',
  'AC:18:26': 'Seiko Epson',
  '00:00:85': 'Canon',
  '00:1E:8F': 'Canon',
  '18:0C:AC': 'Canon',
  '48:F8:B3': 'Canon',
  '00:0B:CD': 'HP',
  '00:14:38': 'HP',
  '00:18:FE': 'HP',
  '00:1B:78': 'HP',
  '00:1E:0B': 'HP',
  '00:21:5A': 'HP',
  '00:24:81': 'HP',
  '00:25:B3': 'HP',
  '00:26:55': 'HP',
  '2C:27:D7': 'HP',
  '38:63:BB': 'HP',
  '48:0F:CF': 'HP',
  '58:20:B1': 'HP',
  '68:B5:99': 'HP',
  '78:E3:B5': 'HP',
  '80:C1:6E': 'HP',
  '98:E7:F4': 'HP',
  'A0:D3:C1': 'HP',
  'B4:B5:2F': 'HP',
  'C8:CB:B8': 'HP',
  'D4:85:64': 'HP',
  'EC:9A:74': 'HP',
  'F4:CE:46': 'HP',
  '50:14:79': 'Roku',
  '84:EA:ED': 'Roku',
  'AC:3A:7A': 'Roku',
  'B8:3E:59': 'Roku',
  'C8:3A:6B': 'Roku',
  'D0:4D:2C': 'Roku',
  'DC:3A:5E': 'Roku',
  '00:09:B0': 'Onkyo',
  '8C:45:00': 'Roku',
  '00:04:20': 'Sony',
  '00:13:A9': 'Sony',
  '00:19:63': 'Sony',
  '00:1D:BA': 'Sony',
  '00:24:BE': 'Sony',
  '28:0D:FC': 'Sony',
  '30:39:26': 'Sony',
  '40:B8:37': 'Sony',
  '54:42:49': 'Sony',
  '70:9E:29': 'Sony',
  '78:84:3C': 'Sony',
  'AC:9B:0A': 'Sony',
  'B4:52:7D': 'Sony',
  'FC:0F:E6': 'Sony',
  '00:04:4B': 'Nvidia',
  '00:80:EA': 'Nvidia',
  '48:B0:2D': 'Nvidia',
  'BC:01:29': 'Nvidia',
  '00:12:FB': 'Huawei',
  '00:18:82': 'Huawei',
  '00:1E:10': 'Huawei',
  '00:25:68': 'Huawei',
  '00:46:4B': 'Huawei',
  '00:66:4B': 'Huawei',
  '04:02:1F': 'Huawei',
  '04:25:C5': 'Huawei',
  '04:C0:6F': 'Huawei',
  '08:19:A6': 'Huawei',
  '0C:96:BF': 'Huawei',
  '10:1B:54': 'Huawei',
  '10:44:00': 'Huawei',
  '14:30:04': 'Huawei',
  '18:C5:8A': 'Huawei',
  '20:08:ED': 'Huawei',
  '24:09:95': 'Huawei',
  '28:31:52': 'Huawei',
  '28:6E:D4': 'Huawei',
  '30:D1:7E': 'Huawei',
  '34:00:A3': 'Huawei',
  '38:F8:89': 'Huawei',
  '3C:47:11': 'Huawei',
  '40:4D:8E': 'Huawei',
  '44:55:B1': 'Huawei',
  '48:00:31': 'Huawei',
  '4C:1F:CC': 'Huawei',
  '4C:8B:EF': 'Huawei',
  '50:9F:27': 'Huawei',
  '54:89:98': 'Huawei',
  '58:2A:F7': 'Huawei',
  '5C:4C:A9': 'Huawei',
  '5C:B4:3E': 'Huawei',
  '60:DE:44': 'Huawei',
  '64:16:F0': 'Huawei',
  '68:A0:F6': 'Huawei',
  '70:19:2F': 'Huawei',
  '70:54:F5': 'Huawei',
  '78:1D:BA': 'Huawei',
  '7C:60:97': 'Huawei',
  '80:B6:55': 'Huawei',
  '80:FB:06': 'Huawei',
  '84:5B:12': 'Huawei',
  '88:28:B3': 'Huawei',
  '8C:0D:76': 'Huawei',
  '8C:34:FD': 'Huawei',
  '90:17:AC': 'Huawei',
  '94:04:9C': 'Huawei',
  '98:E7:F5': 'Huawei',
  '9C:28:EF': 'Huawei',
  '9C:C1:72': 'Huawei',
  'A4:99:47': 'Huawei',
  'AC:61:EA': 'Huawei',
  'AC:CF:85': 'Huawei',
  'B4:15:13': 'Huawei',
  'BC:25:E0': 'Huawei',
  'BC:76:70': 'Huawei',
  'C0:70:09': 'Huawei',
  'C4:05:28': 'Huawei',
  'C8:14:79': 'Huawei',
  'CC:A2:23': 'Huawei',
  'D0:2D:B3': 'Huawei',
  'D4:6A:A8': 'Huawei',
  'D8:49:0B': 'Huawei',
  'DC:D2:FC': 'Huawei',
  'E0:19:1D': 'Huawei',
  'E0:24:7F': 'Huawei',
  'E4:68:A3': 'Huawei',
  'E8:08:8B': 'Huawei',
  'EC:23:3D': 'Huawei',
  'F4:55:9C': 'Huawei',
  'F4:9F:F3': 'Huawei',
  'F8:01:13': 'Huawei',
  'F8:4A:BF': 'Huawei',
  'FC:48:EF': 'Huawei',
  '18:B4:30': 'Nest',
  '64:16:66': 'Nest',
};

function getVendorFromMac(mac: string): string {
  if (!mac) return 'Unknown';
  const prefix = mac.substring(0, 8).toUpperCase();
  return MAC_VENDORS[prefix] || 'Unknown';
}

function guessDeviceType(vendor: string, hostname: string): 'router' | 'phone' | 'pc' | 'tv' | 'iot' | 'unknown' {
  const vendorLower = vendor.toLowerCase();
  const hostnameLower = hostname.toLowerCase();

  // Router detection
  if (hostnameLower.includes('router') || hostnameLower.includes('gateway') ||
      vendorLower.includes('netgear') || vendorLower.includes('tp-link') ||
      vendorLower.includes('d-link') || vendorLower.includes('asus') ||
      vendorLower.includes('linksys') || vendorLower.includes('cisco')) {
    return 'router';
  }

  // Phone detection
  if (vendorLower.includes('apple') && (hostnameLower.includes('iphone') || hostnameLower.includes('ipad'))) {
    return 'phone';
  }
  if (vendorLower.includes('samsung') && hostnameLower.includes('galaxy')) {
    return 'phone';
  }
  if (vendorLower.includes('huawei') || vendorLower.includes('xiaomi') || vendorLower.includes('oneplus')) {
    return 'phone';
  }

  // PC/Mac detection
  if (vendorLower.includes('intel') || vendorLower.includes('microsoft') ||
      vendorLower.includes('vmware') || vendorLower.includes('virtualbox') ||
      vendorLower.includes('hp') || vendorLower.includes('dell') ||
      vendorLower.includes('lenovo')) {
    return 'pc';
  }
  if (vendorLower.includes('apple') && (hostnameLower.includes('macbook') || hostnameLower.includes('imac'))) {
    return 'pc';
  }

  // TV/Media detection
  if (vendorLower.includes('roku') || vendorLower.includes('nvidia') ||
      vendorLower.includes('sony') || vendorLower.includes('lg') ||
      hostnameLower.includes('tv') || hostnameLower.includes('chromecast') ||
      hostnameLower.includes('fire-tv') || hostnameLower.includes('roku')) {
    return 'tv';
  }

  // IoT detection
  if (vendorLower.includes('espressif') || vendorLower.includes('raspberry') ||
      vendorLower.includes('nest') || vendorLower.includes('ring') ||
      vendorLower.includes('philips hue') || vendorLower.includes('sonos') ||
      hostnameLower.includes('esp') || hostnameLower.includes('arduino')) {
    return 'iot';
  }

  return 'unknown';
}

export function useNetworkScanner() {
  const isAvailable = Platform.OS === 'android' && NetworkScanner != null;

  const getWifiInfo = async (): Promise<WifiInfo> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.getWifiInfo();
  };

  const scanNetwork = async (baseIp: string, timeout: number = 3000): Promise<ScannedDevice[]> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    const devices = await NetworkScanner.scanNetwork(baseIp, timeout);
    return devices.map((device: any) => ({
      ...device,
      vendor: getVendorFromMac(device.mac),
      deviceType: guessDeviceType(getVendorFromMac(device.mac), device.hostname || ''),
    }));
  };

  const ping = async (host: string, timeout: number = 3000): Promise<PingResult> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.ping(host, timeout);
  };

  const scanPort = async (host: string, port: number, timeout: number = 1000): Promise<PortResult> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.scanPort(host, port, timeout);
  };

  const scanPorts = async (host: string, startPort: number, endPort: number, timeout: number = 1000): Promise<PortResult[]> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.scanPorts(host, startPort, endPort, timeout);
  };

  const wakeOnLan = async (mac: string, broadcastIp: string): Promise<boolean> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.wakeOnLan(mac, broadcastIp);
  };

  const dnsLookup = async (hostname: string): Promise<DnsResult> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.dnsLookup(hostname);
  };

  const traceroute = async (host: string, maxHops: number = 30, timeout: number = 3000): Promise<TracerouteHop[]> => {
    if (!isAvailable) {
      throw new Error('NetworkScanner not available on this platform');
    }
    return NetworkScanner.traceroute(host, maxHops, timeout);
  };

  const getBaseIp = (ip: string): string => {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return '192.168.1';
  };

  const getBroadcastIp = (ip: string): string => {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.255`;
    }
    return '192.168.1.255';
  };

  return {
    isAvailable,
    getWifiInfo,
    scanNetwork,
    ping,
    scanPort,
    scanPorts,
    wakeOnLan,
    dnsLookup,
    traceroute,
    getBaseIp,
    getBroadcastIp,
    getVendorFromMac,
    guessDeviceType,
  };
}
