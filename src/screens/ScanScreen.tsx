import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNetworkScanner, WifiInfo, ScannedDevice } from '../hooks/useNetworkScanner';
import { storageService, Device } from '../services/storageService';

export default function ScanScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [wifiInfo, setWifiInfo] = useState<WifiInfo | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const {
    isAvailable,
    getWifiInfo,
    scanNetwork,
    getBaseIp,
    getVendorFromMac,
    guessDeviceType,
  } = useNetworkScanner();

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'NetScan needs location permission to scan WiFi network',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const loadSavedDevices = useCallback(async () => {
    const saved = await storageService.getDevices();
    setDevices(saved);
  }, []);

  useEffect(() => {
    loadSavedDevices();
    fetchWifiInfo();
  }, [loadSavedDevices]);

  const fetchWifiInfo = async () => {
    if (!isAvailable) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is needed to scan the network.');
      return;
    }

    try {
      const info = await getWifiInfo();
      setWifiInfo(info);
    } catch (error) {
      console.error('Error fetching WiFi info:', error);
    }
  };

  const startScan = async () => {
    if (!isAvailable || !wifiInfo) {
      Alert.alert('Error', 'WiFi scanner not available or not connected to WiFi');
      return;
    }

    setIsScanning(true);

    try {
      const baseIp = getBaseIp(wifiInfo.ip);
      const scannedDevices = await scanNetwork(baseIp, 3000);

      // Process and save devices
      const onlineMacs: string[] = [];

      for (const scanned of scannedDevices) {
        if (scanned.mac) {
          onlineMacs.push(scanned.mac);
          await storageService.addOrUpdateDevice({
            mac: scanned.mac,
            ip: scanned.ip,
            hostname: scanned.hostname,
            vendor: getVendorFromMac(scanned.mac),
            deviceType: guessDeviceType(getVendorFromMac(scanned.mac), scanned.hostname),
          });
        }
      }

      // Mark offline devices
      await storageService.markDevicesOffline(onlineMacs);

      // Add scan history
      await storageService.addScanHistory({
        timestamp: Date.now(),
        deviceCount: scannedDevices.length,
        networkName: wifiInfo.ssid,
      });

      // Reload devices
      await loadSavedDevices();
      setLastScanTime(new Date());
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Failed to scan network. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getDeviceIcon = (type: Device['deviceType']) => {
    const color = '#00d9ff';
    const size = 28;

    switch (type) {
      case 'router':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M2 9l10-7 10 7v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"
              stroke={color}
              strokeWidth="2"
            />
            <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" />
          </Svg>
        );
      case 'phone':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
              stroke={color}
              strokeWidth="2"
            />
            <Path d="M12 18h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      case 'pc':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
              stroke={color}
              strokeWidth="2"
            />
            <Path d="M8 21h8M12 17v4" stroke={color} strokeWidth="2" />
          </Svg>
        );
      case 'tv':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
              stroke={color}
              strokeWidth="2"
            />
            <Path d="M17 2l-5 5-5-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      case 'iot':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
            <Path
              d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        );
      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
            <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceIcon}>{getDeviceIcon(item.deviceType)}</View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.customName || item.hostname || item.vendor || 'Unknown Device'}
        </Text>
        <Text style={styles.deviceIp}>{item.ip}</Text>
        <Text style={styles.deviceMac}>{item.mac}</Text>
      </View>
      <View style={styles.deviceStatus}>
        <View style={[styles.statusDot, item.isOnline ? styles.online : styles.offline]} />
        <Text style={styles.statusText}>{item.isOnline ? 'Online' : 'Offline'}</Text>
      </View>
    </View>
  );

  const onlineDevices = devices.filter(d => d.isOnline);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NetScan</Text>
        {wifiInfo && <Text style={styles.subtitle}>Connected to {wifiInfo.ssid}</Text>}
      </View>

      {wifiInfo && (
        <View style={styles.wifiCard}>
          <View style={styles.wifiRow}>
            <Text style={styles.wifiLabel}>IP Address</Text>
            <Text style={styles.wifiValue}>{wifiInfo.ip}</Text>
          </View>
          <View style={styles.wifiRow}>
            <Text style={styles.wifiLabel}>Signal Strength</Text>
            <Text style={styles.wifiValue}>{wifiInfo.rssi} dBm</Text>
          </View>
          <View style={styles.wifiRow}>
            <Text style={styles.wifiLabel}>Link Speed</Text>
            <Text style={styles.wifiValue}>{wifiInfo.linkSpeed} Mbps</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
        onPress={startScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color="#1a1a2e" />
        ) : (
          <Text style={styles.scanButtonText}>Scan Network</Text>
        )}
      </TouchableOpacity>

      {lastScanTime && (
        <Text style={styles.lastScan}>
          Last scan: {lastScanTime.toLocaleTimeString()} - {onlineDevices.length} devices online
        </Text>
      )}

      <FlatList
        data={devices.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))}
        renderItem={renderDevice}
        keyExtractor={item => item.mac}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isScanning}
            onRefresh={startScan}
            tintColor="#00d9ff"
            colors={['#00d9ff']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>Tap "Scan Network" to discover devices</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#00d9ff',
    marginTop: 4,
  },
  wifiCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  wifiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  wifiLabel: {
    color: '#666',
    fontSize: 14,
  },
  wifiValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: '#00d9ff',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastScan: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deviceCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceIp: {
    color: '#00d9ff',
    fontSize: 14,
    marginTop: 2,
  },
  deviceMac: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  deviceStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  online: {
    backgroundColor: '#00ff88',
  },
  offline: {
    backgroundColor: '#ff4444',
  },
  statusText: {
    color: '#666',
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});
