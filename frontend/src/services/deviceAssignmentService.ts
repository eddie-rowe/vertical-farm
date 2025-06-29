import { HADevice, DeviceAssignment, DeviceFilter, DeviceAssignmentRequest, AssignmentTarget } from '@/types/device-assignment';
import { supabase } from '@/supabaseClient';
import { getCurrentUser } from '@/services/supabaseService';

class DeviceAssignmentService {
  private haService: any = null;

  private async getHAService() {
    if (!this.haService) {
      const { default: homeAssistantService } = await import('@/services/homeAssistantService');
      this.haService = homeAssistantService;
    }
    return this.haService;
  }

  /**
   * Get all available Home Assistant devices with enhanced filtering
   */
  async getAvailableDevices(filters?: DeviceFilter): Promise<HADevice[]> {
    try {
      const haService = await this.getHAService();
      const allDevices = await haService.getDevices();

      let filteredDevices = allDevices;

             // Apply filters
       if (filters) {
         if (filters.domain) {
           filteredDevices = filteredDevices.filter((device: HADevice) => 
             device.domain === filters.domain
           );
         }

         if (filters.area) {
           filteredDevices = filteredDevices.filter((device: HADevice) => 
             device.area === filters.area
           );
         }

         if (filters.status) {
           filteredDevices = filteredDevices.filter((device: HADevice) => {
             const isOnline = device.state !== 'unavailable' && device.state !== 'unknown';
             switch (filters.status) {
               case 'online':
                 return isOnline;
               case 'offline':
                 return !isOnline;
               case 'unavailable':
                 return device.state === 'unavailable';
               default:
                 return true;
             }
           });
         }

         if (filters.assigned !== undefined) {
           const assignedDevices = await this.getAssignedDeviceEntityIds();
           filteredDevices = filteredDevices.filter((device: HADevice) => {
             const isAssigned = assignedDevices.includes(device.entity_id);
             return filters.assigned ? isAssigned : !isAssigned;
           });
         }
       }

      return filteredDevices;
    } catch (error) {
      console.error('Error fetching available devices:', error);
      throw error;
    }
  }

  /**
   * Search devices with enhanced search capabilities
   */
  async searchDevices(searchTerm: string, filters?: DeviceFilter): Promise<HADevice[]> {
    try {
      const devices = await this.getAvailableDevices(filters);
      
      if (!searchTerm.trim()) {
        return devices;
      }

      const searchLower = searchTerm.toLowerCase();
      return devices.filter(device => 
        device.friendly_name?.toLowerCase().includes(searchLower) ||
        device.entity_id.toLowerCase().includes(searchLower) ||
        device.domain.toLowerCase().includes(searchLower) ||
        device.area?.toLowerCase().includes(searchLower) ||
        device.device_class?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching devices:', error);
      throw error;
    }
  }

  /**
   * Get devices assigned to a specific target (farm/row/rack/shelf)
   */
  async getAssignedDevices(target: AssignmentTarget): Promise<DeviceAssignment[]> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('device_assignments')
        .select('*')
        .eq('user_id', user.id);

      // Add target-specific filter
      switch (target.type) {
        case 'farm':
          query = query.eq('farm_id', target.id);
          break;
        case 'row':
          query = query.eq('row_id', target.id);
          break;
        case 'rack':
          query = query.eq('rack_id', target.id);
          break;
        case 'shelf':
          query = query.eq('shelf_id', target.id);
          break;
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching assigned devices:', error);
      throw error;
    }
  }

  /**
   * Get entity IDs of all assigned devices for the current user
   */
  private async getAssignedDeviceEntityIds(): Promise<string[]> {
    try {
      const user = await getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('device_assignments')
        .select('entity_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(item => item.entity_id) || [];
    } catch (error) {
      console.error('Error fetching assigned device entity IDs:', error);
      return [];
    }
  }

  /**
   * Assign a device to a target location
   */
  async assignDevice(deviceData: DeviceAssignmentRequest, target: AssignmentTarget): Promise<DeviceAssignment> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Get integration ID (find Home Assistant integration if exists)
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'home_assistant')
        .maybeSingle();

      if (integrationError) {
        console.warn('Error fetching integration:', integrationError);
      }

      const assignmentData: any = {
        entity_id: deviceData.entity_id,
        friendly_name: deviceData.friendly_name,
        entity_type: deviceData.entity_type,
        user_id: user.id,
        assigned_by: user.id,
        integration_id: integration?.id
      };

      // Set the appropriate target field
      switch (target.type) {
        case 'farm':
          assignmentData.farm_id = target.id;
          break;
        case 'row':
          assignmentData.row_id = target.id;
          // Also get farm_id from the row
          const { data: rowData } = await supabase
            .from('rows')
            .select('farm_id')
            .eq('id', target.id)
            .single();
          if (rowData) assignmentData.farm_id = rowData.farm_id;
          break;
        case 'rack':
          assignmentData.rack_id = target.id;
          // Get farm_id through row
          const { data: rackData } = await supabase
            .from('racks')
            .select('row_id, rows(farm_id)')
            .eq('id', target.id)
            .single();
          if (rackData) {
            assignmentData.row_id = rackData.row_id;
            assignmentData.farm_id = (rackData as any).rows?.farm_id;
          }
          break;
        case 'shelf':
          assignmentData.shelf_id = target.id;
          // Get farm_id through rack -> row
          const { data: shelfData } = await supabase
            .from('shelves')
            .select('rack_id, racks(row_id, rows(farm_id))')
            .eq('id', target.id)
            .single();
          if (shelfData) {
            assignmentData.rack_id = shelfData.rack_id;
            const racks = (shelfData as any).racks;
            if (racks) {
              assignmentData.row_id = racks.row_id;
              assignmentData.farm_id = racks.rows?.farm_id;
            }
          }
          break;
      }

      const { data, error } = await supabase
        .from('device_assignments')
        .insert([assignmentData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('This device is already assigned to this location');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error assigning device:', error);
      throw error;
    }
  }

  /**
   * Remove device assignment
   */
  async unassignDevice(assignmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('device_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unassigning device:', error);
      throw error;
    }
  }

  /**
   * Get device types for filtering
   */
  getDeviceTypes(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'light', label: 'Lights', icon: '💡' },
      { value: 'switch', label: 'Switches', icon: '🔌' },
      { value: 'fan', label: 'Fans', icon: '🌪️' },
      { value: 'sensor', label: 'Sensors', icon: '📊' },
      { value: 'valve', label: 'Valves', icon: '💧' },
      { value: 'pump', label: 'Pumps', icon: '⚡' },
      { value: 'camera', label: 'Cameras', icon: '📷' },
      { value: 'climate', label: 'Climate', icon: '🌡️' }
    ];
  }

  /**
   * Get contextual device suggestions based on target type
   */
  getContextualDeviceTypes(targetType: AssignmentTarget['type']): string[] {
    switch (targetType) {
      case 'shelf':
        return ['light', 'sensor', 'camera'];
      case 'rack':
        return ['light', 'fan', 'sensor', 'valve'];
      case 'row':
        return ['fan', 'pump', 'valve', 'climate'];
      case 'farm':
        return ['sensor', 'camera', 'climate', 'pump'];
      default:
        return ['light', 'switch', 'fan', 'sensor'];
    }
  }
}

export default new DeviceAssignmentService(); 