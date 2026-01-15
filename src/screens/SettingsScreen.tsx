import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { storageService, Settings } from '../services/storageService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    scanInterval: 30000,
    scanTimeout: 5000,
    notifyNewDevices: true,
    notifyOffline: false,
  });

  const loadSettings = useCallback(async () => {
    const saved = await storageService.getSettings();
    setSettings(saved);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storageService.saveSettings({ [key]: value });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all saved devices, history, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAll();
            loadSettings();
            Alert.alert('Done', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const TimeoutOption = ({ value, label }: { value: number; label: string }) => (
    <TouchableOpacity
      style={[styles.optionButton, settings.scanTimeout === value && styles.optionButtonActive]}
      onPress={() => updateSetting('scanTimeout', value)}
    >
      <Text
        style={[
          styles.optionButtonText,
          settings.scanTimeout === value && styles.optionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const iconColor = '#00d9ff';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <SectionHeader title="Notifications" />

        <View style={styles.card}>
          <SettingRow
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke={iconColor}
                  strokeWidth="2"
                />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={iconColor} strokeWidth="2" />
              </Svg>
            }
            title="New Device Alerts"
            subtitle="Get notified when a new device joins"
          >
            <Switch
              value={settings.notifyNewDevices}
              onValueChange={value => updateSetting('notifyNewDevices', value)}
              trackColor={{ false: '#1a1a2e', true: '#00d9ff' }}
              thumbColor="#fff"
            />
          </SettingRow>

          <View style={styles.divider} />

          <SettingRow
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18.36 6.64a9 9 0 1 1-12.73 0"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path d="M12 2v10" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
              </Svg>
            }
            title="Offline Alerts"
            subtitle="Notify when trusted devices go offline"
          >
            <Switch
              value={settings.notifyOffline}
              onValueChange={value => updateSetting('notifyOffline', value)}
              trackColor={{ false: '#1a1a2e', true: '#00d9ff' }}
              thumbColor="#fff"
            />
          </SettingRow>
        </View>

        <SectionHeader title="Scan Settings" />

        <View style={styles.card}>
          <SettingRow
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" />
                <Path d="M12 8v4l3 3" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
              </Svg>
            }
            title="Scan Timeout"
            subtitle="How long to wait for device responses"
          />
          <View style={styles.optionsRow}>
            <TimeoutOption value={3000} label="3s" />
            <TimeoutOption value={5000} label="5s" />
            <TimeoutOption value={10000} label="10s" />
            <TimeoutOption value={15000} label="15s" />
          </View>
        </View>

        <SectionHeader title="Appearance" />

        <View style={styles.card}>
          <SettingRow
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  stroke={iconColor}
                  strokeWidth="2"
                />
              </Svg>
            }
            title="Theme"
            subtitle="App appearance"
          />
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, settings.theme === 'light' && styles.optionButtonActive]}
              onPress={() => updateSetting('theme', 'light')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  settings.theme === 'light' && styles.optionButtonTextActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, settings.theme === 'dark' && styles.optionButtonActive]}
              onPress={() => updateSetting('theme', 'dark')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  settings.theme === 'dark' && styles.optionButtonTextActive,
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, settings.theme === 'system' && styles.optionButtonActive]}
              onPress={() => updateSetting('theme', 'system')}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  settings.theme === 'system' && styles.optionButtonTextActive,
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader title="Data" />

        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
            <View style={styles.settingIcon}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="#ff4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.dangerTitle}>Clear All Data</Text>
              <Text style={styles.settingSubtitle}>Remove all devices, history, and settings</Text>
            </View>
          </TouchableOpacity>
        </View>

        <SectionHeader title="About" />

        <View style={styles.card}>
          <SettingRow
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" />
                <Path d="M12 16v-4M12 8h.01" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
              </Svg>
            }
            title="Version"
            subtitle="1.0.0"
          />

          <View style={styles.divider} />

          <SettingRow
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            title="Built with"
            subtitle="React Native + Expo SDK 54"
          />
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
  sectionHeader: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 36,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 8,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
  },
  settingSubtitle: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a2e',
    marginLeft: 60,
  },
  optionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#00d9ff',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  optionButtonTextActive: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dangerTitle: {
    color: '#ff4444',
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
});
