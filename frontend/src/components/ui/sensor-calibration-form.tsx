"use client";

import * as React from "react";
import { FarmInput } from "./farm-input";
import { FarmSelect, type FarmSelectOption } from "./farm-select";
import { FarmRangeSlider } from "./farm-range-slider";
import { FarmCheckbox } from "./farm-checkbox";
import { Activity, AlertTriangle, Settings, Zap } from "lucide-react";

export interface SensorCalibration {
  sensorId: string;
  name: string;
  type: string;
  location: string;
  minThreshold: number;
  maxThreshold: number;
  warningThreshold: number;
  calibrationOffset: number;
  measurementUnit: string;
  samplingInterval: number;
  enableAlerts: boolean;
  enableLogging: boolean;
  autoCalibration: boolean;
  notes: string;
}

export interface SensorCalibrationFormProps {
  initialData?: Partial<SensorCalibration>;
  onSubmit: (data: SensorCalibration) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Sensor type configurations
const SENSOR_TYPE_OPTIONS: FarmSelectOption[] = [
  { value: "", label: "Select sensor type..." },
  { value: "temperature", label: "Temperature Sensor" },
  { value: "humidity", label: "Humidity Sensor" },
  { value: "ph", label: "pH Sensor" },
  { value: "ec", label: "Electrical Conductivity (EC)" },
  { value: "light", label: "Light Intensity (PPFD)" },
  { value: "co2", label: "CO₂ Concentration" },
  { value: "pressure", label: "Air Pressure" },
  { value: "moisture", label: "Soil Moisture" },
  { value: "flow", label: "Water Flow Rate" },
];

const LOCATION_OPTIONS: FarmSelectOption[] = [
  { value: "", label: "Select location..." },
  { value: "greenhouse-1", label: "Greenhouse 1" },
  { value: "greenhouse-2", label: "Greenhouse 2" },
  { value: "rack-a", label: "Rack A" },
  { value: "rack-b", label: "Rack B" },
  { value: "rack-c", label: "Rack C" },
  { value: "nutrient-tank", label: "Nutrient Tank" },
  { value: "water-reservoir", label: "Water Reservoir" },
  { value: "hvac-intake", label: "HVAC Intake" },
  { value: "hvac-exhaust", label: "HVAC Exhaust" },
];

// Sensor-specific configurations
const SENSOR_CONFIGS = {
  temperature: {
    unit: "°C",
    min: -10,
    max: 50,
    defaultMin: 18,
    defaultMax: 26,
    defaultWarning: 28,
    step: 0.1,
  },
  humidity: {
    unit: "%",
    min: 0,
    max: 100,
    defaultMin: 50,
    defaultMax: 80,
    defaultWarning: 85,
    step: 1,
  },
  ph: {
    unit: "",
    min: 0,
    max: 14,
    defaultMin: 5.5,
    defaultMax: 6.5,
    defaultWarning: 7.0,
    step: 0.1,
  },
  ec: {
    unit: "mS/cm",
    min: 0,
    max: 5,
    defaultMin: 1.2,
    defaultMax: 2.0,
    defaultWarning: 2.5,
    step: 0.1,
  },
  light: {
    unit: "μmol/m²/s",
    min: 0,
    max: 2000,
    defaultMin: 200,
    defaultMax: 600,
    defaultWarning: 800,
    step: 10,
  },
  co2: {
    unit: "ppm",
    min: 300,
    max: 2000,
    defaultMin: 800,
    defaultMax: 1200,
    defaultWarning: 1500,
    step: 10,
  },
  pressure: {
    unit: "kPa",
    min: 80,
    max: 120,
    defaultMin: 95,
    defaultMax: 105,
    defaultWarning: 110,
    step: 0.1,
  },
  moisture: {
    unit: "%",
    min: 0,
    max: 100,
    defaultMin: 60,
    defaultMax: 80,
    defaultWarning: 85,
    step: 1,
  },
  flow: {
    unit: "L/min",
    min: 0,
    max: 50,
    defaultMin: 2,
    defaultMax: 10,
    defaultWarning: 15,
    step: 0.1,
  },
};

export function SensorCalibrationForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: SensorCalibrationFormProps) {
  const [formData, setFormData] = React.useState<SensorCalibration>({
    sensorId: initialData.sensorId || "",
    name: initialData.name || "",
    type: initialData.type || "",
    location: initialData.location || "",
    minThreshold: initialData.minThreshold || 0,
    maxThreshold: initialData.maxThreshold || 100,
    warningThreshold: initialData.warningThreshold || 80,
    calibrationOffset: initialData.calibrationOffset || 0,
    measurementUnit: initialData.measurementUnit || "",
    samplingInterval: initialData.samplingInterval || 60,
    enableAlerts: initialData.enableAlerts ?? true,
    enableLogging: initialData.enableLogging ?? true,
    autoCalibration: initialData.autoCalibration ?? false,
    notes: initialData.notes || "",
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof SensorCalibration, string>>
  >({});

  // Update thresholds and unit when sensor type changes
  React.useEffect(() => {
    if (
      formData.type &&
      SENSOR_CONFIGS[formData.type as keyof typeof SENSOR_CONFIGS]
    ) {
      const config =
        SENSOR_CONFIGS[formData.type as keyof typeof SENSOR_CONFIGS];
      setFormData((prev) => ({
        ...prev,
        measurementUnit: config.unit,
        minThreshold: config.defaultMin,
        maxThreshold: config.defaultMax,
        warningThreshold: config.defaultWarning,
      }));
    }
  }, [formData.type]);

  const sensorConfig = formData.type
    ? SENSOR_CONFIGS[formData.type as keyof typeof SENSOR_CONFIGS]
    : null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SensorCalibration, string>> = {};

    if (!formData.sensorId.trim()) {
      newErrors.sensorId = "Sensor ID is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Sensor name is required";
    }

    if (!formData.type) {
      newErrors.type = "Sensor type is required";
    }

    if (!formData.location) {
      newErrors.location = "Location is required";
    }

    if (formData.minThreshold >= formData.maxThreshold) {
      newErrors.minThreshold = "Min threshold must be less than max";
      newErrors.maxThreshold = "Max threshold must be greater than min";
    }

    if (formData.warningThreshold < formData.maxThreshold) {
      newErrors.warningThreshold =
        "Warning threshold should be above max threshold";
    }

    if (formData.samplingInterval < 10) {
      newErrors.samplingInterval =
        "Sampling interval must be at least 10 seconds";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof SensorCalibration>(
    field: K,
    value: SensorCalibration[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className || ""}`}>
      <div className="gradient-farm rounded-lg p-6">
        <h3 className="text-farm-title font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Sensor Information
        </h3>

        <div className="mobile-grid gap-4">
          <FarmInput
            label="Sensor ID"
            placeholder="e.g., TEMP-001, PH-A1"
            value={formData.sensorId}
            onChange={(e) => updateField("sensorId", e.target.value)}
            errorText={errors.sensorId}
            icon={<Activity className="h-4 w-4" />}
            required
            helpText="Unique identifier for this sensor"
          />

          <FarmInput
            label="Sensor Name"
            placeholder="e.g., Greenhouse 1 Temperature"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            errorText={errors.name}
            required
          />

          <FarmSelect
            label="Sensor Type"
            options={SENSOR_TYPE_OPTIONS}
            value={formData.type}
            onChange={(e) => updateField("type", e.target.value)}
            errorText={errors.type}
            required
          />

          <FarmSelect
            label="Location"
            options={LOCATION_OPTIONS}
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
            errorText={errors.location}
            required
          />

          <FarmInput
            label="Measurement Unit"
            value={formData.measurementUnit}
            onChange={(e) => updateField("measurementUnit", e.target.value)}
            helpText="Auto-filled based on sensor type"
            disabled={!!sensorConfig}
          />
        </div>
      </div>

      {sensorConfig && (
        <div className="gradient-row rounded-lg p-6">
          <h3 className="text-farm-title font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            Threshold Configuration
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FarmRangeSlider
                label="Minimum Threshold"
                min={sensorConfig.min}
                max={sensorConfig.max}
                step={sensorConfig.step}
                value={formData.minThreshold}
                onValueChange={(value) => updateField("minThreshold", value)}
                unit={sensorConfig.unit}
                errorText={errors.minThreshold}
                helpText="Lower boundary for normal operation"
              />

              <FarmRangeSlider
                label="Maximum Threshold"
                min={sensorConfig.min}
                max={sensorConfig.max}
                step={sensorConfig.step}
                value={formData.maxThreshold}
                onValueChange={(value) => updateField("maxThreshold", value)}
                unit={sensorConfig.unit}
                errorText={errors.maxThreshold}
                helpText="Upper boundary for normal operation"
              />
            </div>

            <FarmRangeSlider
              label="Warning Threshold"
              min={sensorConfig.min}
              max={sensorConfig.max}
              step={sensorConfig.step}
              value={formData.warningThreshold}
              onValueChange={(value) => updateField("warningThreshold", value)}
              unit={sensorConfig.unit}
              errorText={errors.warningThreshold}
              helpText="Trigger warning before reaching critical levels"
            />

            <FarmRangeSlider
              label="Calibration Offset"
              min={-10}
              max={10}
              step={0.01}
              value={formData.calibrationOffset}
              onValueChange={(value) => updateField("calibrationOffset", value)}
              unit={sensorConfig.unit}
              helpText="Adjustment value to correct sensor readings"
            />
          </div>
        </div>
      )}

      <div className="gradient-rack rounded-lg p-6">
        <h3 className="text-farm-title font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Monitoring Configuration
        </h3>

        <div className="space-y-6">
          <FarmRangeSlider
            label="Sampling Interval"
            min={10}
            max={3600}
            step={10}
            value={formData.samplingInterval}
            onValueChange={(value) => updateField("samplingInterval", value)}
            unit="s"
            errorText={errors.samplingInterval}
            helpText="How often the sensor takes measurements (seconds)"
            markPoints={[
              { value: 60, label: "1m" },
              { value: 300, label: "5m" },
              { value: 900, label: "15m" },
              { value: 3600, label: "1h" },
            ]}
          />

          <div className="space-y-4">
            <FarmCheckbox
              label="Enable Alerts"
              description="Send notifications when thresholds are exceeded"
              checked={formData.enableAlerts}
              onCheckedChange={(checked) =>
                updateField("enableAlerts", checked)
              }
              inputSize="lg"
            />

            <FarmCheckbox
              label="Enable Data Logging"
              description="Store sensor readings in the database for analysis"
              checked={formData.enableLogging}
              onCheckedChange={(checked) =>
                updateField("enableLogging", checked)
              }
              inputSize="lg"
            />

            <FarmCheckbox
              label="Auto-Calibration"
              description="Automatically adjust calibration based on reference sensors"
              checked={formData.autoCalibration}
              onCheckedChange={(checked) =>
                updateField("autoCalibration", checked)
              }
              inputSize="lg"
            />
          </div>
        </div>
      </div>

      <div className="gradient-shelf rounded-lg p-6">
        <h3 className="text-farm-title font-semibold mb-4">Additional Notes</h3>

        <FarmInput
          label="Notes"
          placeholder="Installation notes, maintenance schedule, or special considerations..."
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          helpText="Optional notes about sensor setup or maintenance"
        />
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="farm-control-btn px-6 py-2 border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="farm-control-btn px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Calibrating...
            </>
          ) : (
            <>
              <Activity className="h-4 w-4" />
              Save Sensor Configuration
            </>
          )}
        </button>
      </div>
    </form>
  );
}
