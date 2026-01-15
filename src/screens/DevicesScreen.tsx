import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { storageService, Device } from '../services/storageService';

type FilterType = 'all' | 'online' | 'favorites' | 'trusted';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editName, setEditName] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadDevices = useCallback(async () => {
    const saved = await storageService.getDevices();
    setDevices(saved);
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleToggleFavorite = async (mac: string) => {
    await storageService.toggleFavorite(mac);
    loadDevices();
  };

  const handleToggleTrusted = async (mac: string) => {
    await storageService.toggleTrusted(mac);
    loadDevices();
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setEditName(device.customName || device.hostname || '');
    setShowModal(true);
  };

  const handleSaveName = async () => {
    if (selectedDevice) {
      await storageService.updateDeviceName(selectedDevice.mac, editName);
      setShowModal(false);
      setSelectedDevice(null);
      loadDevices();
    }
  };

  const handleDeleteDevice = (mac: string) => {
    Alert.alert(
      'Delete Device',
      'Are you sure you want to remove this device from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteDevice(mac);
            loadDevices();
          },
        },
      ]
    );
  };

  const filteredDevices = devices.filter(device => {
    // Apply filter
    if (filter === 'online' && !device.isOnline) return false;
    if (filter === 'favorites' && !device.isFavorite) return false;
    if (filter === 'trusted' && !device.isTrusted) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        device.hostname?.toLowerCase().includes(query) ||
        device.customName?.toLowerCase().includes(query) ||
        device.ip.includes(query) ||
        device.mac.toLowerCase().includes(query) ||
        device.vendor?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === type && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterButtonText, filter === type && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity style={styles.deviceCard} onPress={() => handleEditDevice(item)}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceTitleRow}>
          <View style={[styles.statusDot, item.isOnline ? styles.online : styles.offline]} />
          <Text style={styles.deviceName}>
            {item.customName || item.hostname || item.vendor || 'Unknown Device'}
          </Text>
        </View>
        <View style={styles.deviceActions}>
          <TouchableOpacity onPress={() => handleToggleFavorite(item.mac)} style={styles.actionButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill={item.isFavorite ? '#ffcc00' : 'none'}>
              <Path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke={item.isFavorite ? '#ffcc00' : '#666'}
                strokeWidth="2"
              />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleToggleTrusted(item.mac)} style={styles.actionButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill={item.isTrusted ? '#00ff88' : 'none'}>
              <Path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke={item.isTrusted ? '#00ff88' : '#666'}
                strokeWidth="2"
              />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteDevice(item.mac)} style={styles.actionButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="#ff4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>IP</Text>
          <Text style={styles.detailValue}>{item.ip}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>MAC</Text>
          <Text style={styles.detailValue}>{item.mac}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vendor</Text>
          <Text style={styles.detailValue}>{item.vendor || 'Unknown'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>First Seen</Text>
          <Text style={styles.detailValue}>
            {new Date(item.firstSeen).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Seen</Text>
          <Text style={styles.detailValue}>
            {new Date(item.lastSeen).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Devices</Text>
        <Text style={styles.subtitle}>{devices.length} devices tracked</Text>
      </View>

      <View style={styles.searchContainer}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
          <Circle cx="11" cy="11" r="8" stroke="#666" strokeWidth="2" />
          <Path d="M21 21l-4.35-4.35" stroke="#666" strokeWidth="2" strokeLinecap="round" />
        </Svg>
        <TextInput
          style={styles.searchInput}
          placeholder="Search devices..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton type="all" label="All" />
        <FilterButton type="online" label="Online" />
        <FilterButton type="favorites" label="Favorites" />
        <FilterButton type="trusted" label="Trusted" />
      </View>

      <FlatList
        data={filteredDevices}
        renderItem={renderDevice}
        keyExtractor={item => item.mac}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No devices found</Text>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Device</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Device name"
              placeholderTextColor="#666"
              value={editName}
              onChangeText={setEditName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveName}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#16213e',
  },
  filterButtonActive: {
    backgroundColor: '#00d9ff',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#1a1a2e',
    fontWeight: '600',
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
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  online: {
    backgroundColor: '#00ff88',
  },
  offline: {
    backgroundColor: '#ff4444',
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  deviceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    color: '#666',
    fontSize: 13,
  },
  detailValue: {
    color: '#fff',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1a1a2e',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00d9ff',
  },
  saveButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '600',
  },
});
