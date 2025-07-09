'use client';

import { useState, useEffect } from 'react';
import { homeAssistantService, HAConfig, HAConnectionStatus, HADevice, DeviceAssignment, ImportedDevice, DeviceControlRequest, ImportDevicesRequest } from '@/services/homeAssistantService';

export function useHomeAssistant() {
  const [config, setConfig] = useState<HAConfig | null>(null);
  const [status, setStatus] = useState<HAConnectionStatus>({ connected: false });
  const [devices, setDevices] = useState<HADevice[]>([]);
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([]);
  const [importedDevices, setImportedDevices] = useState<ImportedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load both config and status in parallel
      const [configData, statusData] = await Promise.all([
        homeAssistantService.getConfig(),
        homeAssistantService.getStatus()
      ]);
      
      setConfig(configData);
      setStatus(statusData);

      // If connected, also load devices and assignments and set localStorage flag
      if (statusData.connected) {
        await loadDeviceData();
        // Set localStorage flag to indicate device integrations are connected
        localStorage.setItem('device-integrations-connected', 'true');
      }
    } catch (err) {
      console.error('Failed to load Home Assistant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeviceData = async () => {
    try {
      const [devicesData, assignmentsData, importedData] = await Promise.all([
        homeAssistantService.getDevices().catch(() => []),
        homeAssistantService.getAssignments().catch(() => []),
        homeAssistantService.getImportedDevices().catch(() => [])
      ]);
      
      setDevices(devicesData);
      setAssignments(assignmentsData);
      setImportedDevices(importedData);
    } catch (err) {
      console.error('Failed to load device data:', err);
      // Don't set error state for device data failures
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveConfig = async (newConfig: HAConfig) => {
    try {
      setIsLoading(true);
      const savedConfig = await homeAssistantService.saveConfig(newConfig);
      setConfig(savedConfig);
      
      // Refresh status after saving config
      const newStatus = await homeAssistantService.getStatus();
      setStatus(newStatus);
      
      // If newly connected, load device data and set localStorage flag
      if (newStatus.connected) {
        await loadDeviceData();
        // Set localStorage flag to indicate device integrations are connected
        localStorage.setItem('device-integrations-connected', 'true');
      }
      
      return savedConfig;
    } catch (err) {
      console.error('Failed to save config:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (url: string, token: string) => {
    try {
      return await homeAssistantService.testConnection(url, token);
    } catch (err) {
      console.error('Failed to test connection:', err);
      throw err;
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Device Management Methods
  const discoverDevices = async () => {
    try {
      const discoveredDevices = await homeAssistantService.discoverDevices();
      setDevices(discoveredDevices);
      return discoveredDevices;
    } catch (err) {
      console.error('Failed to discover devices:', err);
      throw err;
    }
  };

  const controlDevice = async (device: HADevice, action: 'turn_on' | 'turn_off' | 'toggle') => {
    try {
      const request: DeviceControlRequest = {
        entity_id: device.entity_id,
        action
      };
      await homeAssistantService.controlDevice(request);
      
      // Refresh device states after control
      await loadDeviceData();
    } catch (err) {
      console.error('Failed to control device:', err);
      throw err;
    }
  };

  const importDevice = async (device: HADevice) => {
    try {
      const request: ImportDevicesRequest = {
        entity_ids: [device.entity_id]
      };
      const result = await homeAssistantService.importDevices(request);
      
      // Refresh imported devices
      const updatedImported = await homeAssistantService.getImportedDevices();
      setImportedDevices(updatedImported);
      
      return result;
    } catch (err) {
      console.error('Failed to import device:', err);
      throw err;
    }
  };

  const assignDevice = async (entityId: string, assignment: Omit<DeviceAssignment, 'entity_id'>) => {
    try {
      const fullAssignment: DeviceAssignment = {
        entity_id: entityId,
        ...assignment
      };
      const result = await homeAssistantService.saveAssignment(fullAssignment);
      
      // Refresh assignments
      const updatedAssignments = await homeAssistantService.getAssignments();
      setAssignments(updatedAssignments);
      
      return result;
    } catch (err) {
      console.error('Failed to assign device:', err);
      throw err;
    }
  };

  const removeAssignment = async (entityId: string) => {
    try {
      await homeAssistantService.removeAssignment(entityId);
      
      // Refresh assignments
      const updatedAssignments = await homeAssistantService.getAssignments();
      setAssignments(updatedAssignments);
    } catch (err) {
      console.error('Failed to remove assignment:', err);
      throw err;
    }
  };

  const bulkImportDevices = async (devices: HADevice[]) => {
    try {
      const request: ImportDevicesRequest = {
        entity_ids: devices.map(d => d.entity_id)
      };
      const result = await homeAssistantService.importDevices(request);
      
      // Refresh imported devices
      const updatedImported = await homeAssistantService.getImportedDevices();
      setImportedDevices(updatedImported);
      
      return result;
    } catch (err) {
      console.error('Failed to bulk import devices:', err);
      throw err;
    }
  };

  const bulkControlDevices = async (devices: HADevice[], action: 'turn_on' | 'turn_off') => {
    try {
      // Control devices in parallel
      await Promise.all(
        devices.map(device => 
          homeAssistantService.controlDevice({
            entity_id: device.entity_id,
            action
          })
        )
      );
      
      // Refresh device states after bulk control
      await loadDeviceData();
    } catch (err) {
      console.error('Failed to bulk control devices:', err);
      throw err;
    }
  };

  return {
    // Data
    config,
    status,
    devices,
    assignments,
    importedDevices,
    isLoading,
    error,
    
    // Configuration methods
    saveConfig,
    testConnection,
    refreshData,
    
    // Device management methods
    discoverDevices,
    controlDevice,
    importDevice,
    assignDevice,
    removeAssignment,
    bulkImportDevices,
    bulkControlDevices,
    loadDeviceData
  };
} 