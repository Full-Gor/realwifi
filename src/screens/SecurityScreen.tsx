import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { storageService, Device } from '../services/storageService';
import { useNetworkScanner, WifiInfo } from '../hooks/useNetworkScanner';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

export default function SecurityScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [wifiInfo, setWifiInfo] = useState<WifiInfo | null>(null);
  const [securityScore, setSecurityScore] = useState(0);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);

  const { isAvailable, getWifiInfo } = useNetworkScanner();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedDevices = await storageService.getDevices();
      setDevices(savedDevices);

      if (isAvailable) {
        try {
          const info = await getWifiInfo();
          setWifiInfo(info);
        } catch (e) {
          console.log('Could not get WiFi info');
        }
      }

      // Calculate security checks
      const checks = calculateSecurityChecks(savedDevices);
      setSecurityChecks(checks);

      // Calculate overall score
      const score = calculateSecurityScore(checks);
      setSecurityScore(score);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, getWifiInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateSecurityChecks = (deviceList: Device[]): SecurityCheck[] => {
    const checks: SecurityCheck[] = [];
    const onlineDevices = deviceList.filter(d => d.isOnline);
    const trustedDevices = deviceList.filter(d => d.isTrusted);
    const unknownDevices = deviceList.filter(d => d.vendor === 'Unknown' && d.isOnline);
    const untrustedOnline = onlineDevices.filter(d => !d.isTrusted);

    // Check 1: Known devices
    if (unknownDevices.length === 0) {
      checks.push({
        name: 'Device Recognition',
        status: 'pass',
        description: 'All online devices are from known vendors',
      });
    } else if (unknownDevices.length <= 2) {
      checks.push({
        name: 'Device Recognition',
        status: 'warning',
        description: `${unknownDevices.length} device(s) from unknown vendors`,
      });
    } else {
      checks.push({
        name: 'Device Recognition',
        status: 'fail',
        description: `${unknownDevices.length} devices from unknown vendors detected`,
      });
    }

    // Check 2: Trusted devices
    if (untrustedOnline.length === 0) {
      checks.push({
        name: 'Device Trust',
        status: 'pass',
        description: 'All online devices are marked as trusted',
      });
    } else if (untrustedOnline.length <= 3) {
      checks.push({
        name: 'Device Trust',
        status: 'warning',
        description: `${untrustedOnline.length} untrusted device(s) online`,
      });
    } else {
      checks.push({
        name: 'Device Trust',
        status: 'fail',
        description: `${untrustedOnline.length} untrusted devices on network`,
      });
    }

    // Check 3: Network size
    if (onlineDevices.length <= 10) {
      checks.push({
        name: 'Network Size',
        status: 'pass',
        description: 'Reasonable number of devices on network',
      });
    } else if (onlineDevices.length <= 20) {
      checks.push({
        name: 'Network Size',
        status: 'warning',
        description: `${onlineDevices.length} devices online - consider reviewing`,
      });
    } else {
      checks.push({
        name: 'Network Size',
        status: 'fail',
        description: `High device count (${onlineDevices.length}) - potential security risk`,
      });
    }

    // Check 4: IoT devices
    const iotDevices = onlineDevices.filter(d => d.deviceType === 'iot');
    if (iotDevices.length === 0) {
      checks.push({
        name: 'IoT Security',
        status: 'pass',
        description: 'No IoT devices detected',
      });
    } else if (iotDevices.length <= 5) {
      checks.push({
        name: 'IoT Security',
        status: 'warning',
        description: `${iotDevices.length} IoT device(s) - ensure firmware is updated`,
      });
    } else {
      checks.push({
        name: 'IoT Security',
        status: 'fail',
        description: `Many IoT devices (${iotDevices.length}) - segment network if possible`,
      });
    }

    // Check 5: Recent new devices
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const newDevices = deviceList.filter(d => d.firstSeen > oneDayAgo && d.isOnline);
    if (newDevices.length === 0) {
      checks.push({
        name: 'New Devices',
        status: 'pass',
        description: 'No new devices in the last 24 hours',
      });
    } else if (newDevices.length <= 2) {
      checks.push({
        name: 'New Devices',
        status: 'warning',
        description: `${newDevices.length} new device(s) joined recently`,
      });
    } else {
      checks.push({
        name: 'New Devices',
        status: 'fail',
        description: `${newDevices.length} new devices - review for unauthorized access`,
      });
    }

    return checks;
  };

  const calculateSecurityScore = (checks: SecurityCheck[]): number => {
    if (checks.length === 0) return 100;

    let score = 100;
    checks.forEach(check => {
      if (check.status === 'warning') score -= 10;
      if (check.status === 'fail') score -= 20;
    });

    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#ffcc00';
    return '#ff4444';
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#00ff88" strokeWidth="2" />
            <Path d="M9 12l2 2 4-4" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      case 'warning':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 9v4M12 17h.01"
              stroke="#ffcc00"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#ffcc00"
              strokeWidth="2"
            />
          </Svg>
        );
      case 'fail':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#ff4444" strokeWidth="2" />
            <Path
              d="M15 9l-6 6M9 9l6 6"
              stroke="#ff4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        );
    }
  };

  const onlineCount = devices.filter(d => d.isOnline).length;
  const trustedCount = devices.filter(d => d.isTrusted).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor="#00d9ff"
            colors={['#00d9ff']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Security</Text>
          {wifiInfo && <Text style={styles.subtitle}>{wifiInfo.ssid}</Text>}
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreText, { color: getScoreColor(securityScore) }]}>
              {securityScore}
            </Text>
          </View>
          <Text style={styles.scoreLabel}>Security Score</Text>
          <Text style={styles.scoreDescription}>
            {securityScore >= 80
              ? 'Your network is secure'
              : securityScore >= 60
              ? 'Some security concerns detected'
              : 'Security issues require attention'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{onlineCount}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trustedCount}</Text>
            <Text style={styles.statLabel}>Trusted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{devices.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Security Checks</Text>

        {securityChecks.map((check, index) => (
          <View key={index} style={styles.checkCard}>
            <View style={styles.checkIcon}>{getStatusIcon(check.status)}</View>
            <View style={styles.checkContent}>
              <Text style={styles.checkName}>{check.name}</Text>
              <Text style={styles.checkDescription}>{check.description}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Recommendations</Text>

        <View style={styles.recommendationCard}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="#00d9ff"
              strokeWidth="2"
            />
          </Svg>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Mark trusted devices</Text>
            <Text style={styles.recommendationText}>
              Review your devices and mark known ones as trusted to improve security monitoring.
            </Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#00d9ff" strokeWidth="2" />
            <Path d="M12 8v4l3 3" stroke="#00d9ff" strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Regular scans</Text>
            <Text style={styles.recommendationText}>
              Scan your network regularly to detect unauthorized devices quickly.
            </Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="#00d9ff"
              strokeWidth="2"
            />
          </Svg>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Strong WiFi password</Text>
            <Text style={styles.recommendationText}>
              Use WPA3 if available, or WPA2 with a strong, unique password.
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
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
  scoreCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00d9ff',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  scoreDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#00d9ff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  checkCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 14,
  },
  checkContent: {
    flex: 1,
  },
  checkName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkDescription: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  recommendationCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 14,
  },
  recommendationTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationText: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  bottomPadding: {
    height: 20,
  },
});
