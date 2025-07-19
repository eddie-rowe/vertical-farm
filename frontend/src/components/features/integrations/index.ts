// External Platform Integrations - Third-party service integrations

// Home Assistant exports with HA prefix
export {
  AssignmentManagement as HAAssignmentManagement,
  AssignmentModal as HAAssignmentModal,
  AssignmentTab as HAAssignmentTab,
  DeviceCard as HADeviceCard,
  DeviceManagement as HADeviceManagement,
  DeviceManagementTab as HADeviceManagementTab,
  ConfigurationTab as HAConfigurationTab,
  Settings as HASettings,
  SetupWizard as HASetupWizard,
  OverviewTab as HAOverviewTab,
} from "./home-assistant/components";

export { useHomeAssistant } from "./home-assistant/hooks/useHomeAssistant";

// Square exports with Square prefix
export {
  AdvancedTab as SquareAdvancedTab,
  ConfigurationTab as SquareConfigurationTab,
  DataSyncTab as SquareDataSyncTab,
  OverviewTab as SquareOverviewTab,
} from "./square/components";
