import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNetworkScanner, PingResult, PortResult, DnsResult } from '../hooks/useNetworkScanner';

type ToolType = 'ping' | 'port' | 'dns' | 'wol' | null;

export default function ToolsScreen() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ping state
  const [pingHost, setPingHost] = useState('');
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  // Port scanner state
  const [portHost, setPortHost] = useState('');
  const [startPort, setStartPort] = useState('1');
  const [endPort, setEndPort] = useState('1024');
  const [portResults, setPortResults] = useState<PortResult[]>([]);

  // DNS state
  const [dnsHostname, setDnsHostname] = useState('');
  const [dnsResult, setDnsResult] = useState<DnsResult | null>(null);

  // WOL state
  const [wolMac, setWolMac] = useState('');
  const [wolBroadcast, setWolBroadcast] = useState('255.255.255.255');

  const { isAvailable, ping, scanPorts, dnsLookup, wakeOnLan } = useNetworkScanner();

  const handlePing = async () => {
    if (!pingHost) {
      Alert.alert('Error', 'Please enter a host to ping');
      return;
    }
    setIsLoading(true);
    setPingResult(null);
    try {
      const result = await ping(pingHost, 5000);
      setPingResult(result);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortScan = async () => {
    if (!portHost) {
      Alert.alert('Error', 'Please enter a host to scan');
      return;
    }
    const start = parseInt(startPort, 10) || 1;
    const end = parseInt(endPort, 10) || 1024;

    if (start > end || start < 1 || end > 65535) {
      Alert.alert('Error', 'Invalid port range');
      return;
    }

    setIsLoading(true);
    setPortResults([]);
    try {
      const results = await scanPorts(portHost, start, end, 1000);
      setPortResults(results);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDnsLookup = async () => {
    if (!dnsHostname) {
      Alert.alert('Error', 'Please enter a hostname');
      return;
    }
    setIsLoading(true);
    setDnsResult(null);
    try {
      const result = await dnsLookup(dnsHostname);
      setDnsResult(result);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWakeOnLan = async () => {
    if (!wolMac) {
      Alert.alert('Error', 'Please enter a MAC address');
      return;
    }

    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macPattern.test(wolMac)) {
      Alert.alert('Error', 'Invalid MAC address format (use XX:XX:XX:XX:XX:XX)');
      return;
    }

    setIsLoading(true);
    try {
      await wakeOnLan(wolMac, wolBroadcast);
      Alert.alert('Success', 'Wake-on-LAN packet sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const ToolButton = ({
    type,
    title,
    icon,
  }: {
    type: ToolType;
    title: string;
    icon: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.toolButton, activeTool === type && styles.toolButtonActive]}
      onPress={() => setActiveTool(activeTool === type ? null : type)}
    >
      {icon}
      <Text style={[styles.toolButtonText, activeTool === type && styles.toolButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderPingTool = () => (
    <View style={styles.toolPanel}>
      <Text style={styles.toolPanelTitle}>Ping</Text>
      <TextInput
        style={styles.input}
        placeholder="Host or IP address"
        placeholderTextColor="#666"
        value={pingHost}
        onChangeText={setPingHost}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={handlePing}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1a1a2e" />
        ) : (
          <Text style={styles.actionButtonText}>Ping</Text>
        )}
      </TouchableOpacity>
      {pingResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Status</Text>
            <Text style={[styles.resultValue, pingResult.success ? styles.success : styles.error]}>
              {pingResult.success ? 'Reachable' : 'Unreachable'}
            </Text>
          </View>
          {pingResult.success && (
            <>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Latency</Text>
                <Text style={styles.resultValue}>{pingResult.latency} ms</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>IP</Text>
                <Text style={styles.resultValue}>{pingResult.ip}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );

  const renderPortScanner = () => (
    <View style={styles.toolPanel}>
      <Text style={styles.toolPanelTitle}>Port Scanner</Text>
      <TextInput
        style={styles.input}
        placeholder="Host or IP address"
        placeholderTextColor="#666"
        value={portHost}
        onChangeText={setPortHost}
        autoCapitalize="none"
      />
      <View style={styles.portRangeRow}>
        <TextInput
          style={[styles.input, styles.portInput]}
          placeholder="Start"
          placeholderTextColor="#666"
          value={startPort}
          onChangeText={setStartPort}
          keyboardType="number-pad"
        />
        <Text style={styles.portRangeSeparator}>-</Text>
        <TextInput
          style={[styles.input, styles.portInput]}
          placeholder="End"
          placeholderTextColor="#666"
          value={endPort}
          onChangeText={setEndPort}
          keyboardType="number-pad"
        />
      </View>
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={handlePortScan}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1a1a2e" />
        ) : (
          <Text style={styles.actionButtonText}>Scan Ports</Text>
        )}
      </TouchableOpacity>
      {portResults.length > 0 && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Open Ports ({portResults.length})</Text>
          {portResults.map(port => (
            <View key={port.port} style={styles.portResultRow}>
              <Text style={styles.portNumber}>{port.port}</Text>
              <Text style={styles.portStatus}>Open</Text>
            </View>
          ))}
        </View>
      )}
      {!isLoading && portResults.length === 0 && portHost && (
        <Text style={styles.noResults}>No open ports found</Text>
      )}
    </View>
  );

  const renderDnsTool = () => (
    <View style={styles.toolPanel}>
      <Text style={styles.toolPanelTitle}>DNS Lookup</Text>
      <TextInput
        style={styles.input}
        placeholder="Hostname (e.g., google.com)"
        placeholderTextColor="#666"
        value={dnsHostname}
        onChangeText={setDnsHostname}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={handleDnsLookup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1a1a2e" />
        ) : (
          <Text style={styles.actionButtonText}>Lookup</Text>
        )}
      </TouchableOpacity>
      {dnsResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Hostname</Text>
            <Text style={styles.resultValue}>{dnsResult.hostname}</Text>
          </View>
          <Text style={styles.resultTitle}>IP Addresses</Text>
          {dnsResult.addresses.map((ip, index) => (
            <View key={index} style={styles.resultRow}>
              <Text style={styles.resultValue}>{ip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderWolTool = () => (
    <View style={styles.toolPanel}>
      <Text style={styles.toolPanelTitle}>Wake on LAN</Text>
      <TextInput
        style={styles.input}
        placeholder="MAC Address (XX:XX:XX:XX:XX:XX)"
        placeholderTextColor="#666"
        value={wolMac}
        onChangeText={setWolMac}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Broadcast IP (default: 255.255.255.255)"
        placeholderTextColor="#666"
        value={wolBroadcast}
        onChangeText={setWolBroadcast}
      />
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
        onPress={handleWakeOnLan}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#1a1a2e" />
        ) : (
          <Text style={styles.actionButtonText}>Send WOL Packet</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const iconColor = '#00d9ff';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Tools</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toolGrid}>
          <ToolButton
            type="ping"
            title="Ping"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" />
                <Path
                  d="M12 8v4l3 3"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            }
          />
          <ToolButton
            type="port"
            title="Port Scan"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 4h16v16H4V4z"
                  stroke={iconColor}
                  strokeWidth="2"
                />
                <Path
                  d="M4 10h16M10 4v16"
                  stroke={iconColor}
                  strokeWidth="2"
                />
              </Svg>
            }
          />
          <ToolButton
            type="dns"
            title="DNS Lookup"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" />
                <Path
                  d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                  stroke={iconColor}
                  strokeWidth="2"
                />
              </Svg>
            }
          />
          <ToolButton
            type="wol"
            title="Wake on LAN"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18.36 6.64a9 9 0 1 1-12.73 0"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M12 2v10"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            }
          />
        </View>

        {activeTool === 'ping' && renderPingTool()}
        {activeTool === 'port' && renderPortScanner()}
        {activeTool === 'dns' && renderDnsTool()}
        {activeTool === 'wol' && renderWolTool()}
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  toolButton: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolButtonActive: {
    borderColor: '#00d9ff',
  },
  toolButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  toolButtonTextActive: {
    color: '#00d9ff',
  },
  toolPanel: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  toolPanelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  portRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portInput: {
    flex: 1,
  },
  portRangeSeparator: {
    color: '#fff',
    fontSize: 20,
    marginHorizontal: 12,
  },
  actionButton: {
    backgroundColor: '#00d9ff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resultLabel: {
    color: '#666',
    fontSize: 14,
  },
  resultValue: {
    color: '#fff',
    fontSize: 14,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  success: {
    color: '#00ff88',
  },
  error: {
    color: '#ff4444',
  },
  portResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  portNumber: {
    color: '#00d9ff',
    fontSize: 14,
    fontWeight: '600',
  },
  portStatus: {
    color: '#00ff88',
    fontSize: 14,
  },
  noResults: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
