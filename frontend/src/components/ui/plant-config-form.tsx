"use client";

import { Leaf, Droplets, Thermometer } from "lucide-react";
import * as React from "react";

import { FarmCheckbox } from "./farm-checkbox";
import { FarmInput } from "./farm-input";
import { FarmRangeSlider } from "./farm-range-slider";
import { FarmSelect, type FarmSelectOption } from "./farm-select";

export interface PlantConfig {
  name: string;
  variety: string;
  species: string;
  stage: string;
  expectedYield: number;
  phMin: number;
  phMax: number;
  temperatureMin: number;
  temperatureMax: number;
  humidityTarget: number;
  lightHoursDaily: number;
  autoWatering: boolean;
  autoNutrients: boolean;
  notes: string;
}

export interface PlantConfigFormProps {
  initialData?: Partial<PlantConfig>;
  onSubmit: (data: PlantConfig) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Agricultural constants for validation
const PLANT_SPECIES_OPTIONS: FarmSelectOption[] = [
  { value: "", label: "Select species..." },
  { value: "lettuce", label: "Lettuce (Lactuca sativa)" },
  { value: "spinach", label: "Spinach (Spinacia oleracea)" },
  { value: "kale", label: "Kale (Brassica oleracea)" },
  { value: "basil", label: "Basil (Ocimum basilicum)" },
  { value: "tomato", label: "Tomato (Solanum lycopersicum)" },
  { value: "cucumber", label: "Cucumber (Cucumis sativus)" },
  { value: "strawberry", label: "Strawberry (Fragaria × ananassa)" },
];

const GROWTH_STAGE_OPTIONS: FarmSelectOption[] = [
  { value: "", label: "Select growth stage..." },
  { value: "seed", label: "Seed" },
  { value: "germination", label: "Germination" },
  { value: "seedling", label: "Seedling" },
  { value: "vegetative", label: "Vegetative Growth" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "harvest", label: "Ready for Harvest" },
];

const PH_MARKS = [
  { value: 5.5, label: "5.5" },
  { value: 6.0, label: "6.0" },
  { value: 6.5, label: "6.5" },
  { value: 7.0, label: "7.0" },
];

export function PlantConfigForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: PlantConfigFormProps) {
  const [formData, setFormData] = React.useState<PlantConfig>({
    name: initialData.name || "",
    variety: initialData.variety || "",
    species: initialData.species || "",
    stage: initialData.stage || "",
    expectedYield: initialData.expectedYield || 0,
    phMin: initialData.phMin || 5.8,
    phMax: initialData.phMax || 6.2,
    temperatureMin: initialData.temperatureMin || 18,
    temperatureMax: initialData.temperatureMax || 24,
    humidityTarget: initialData.humidityTarget || 65,
    lightHoursDaily: initialData.lightHoursDaily || 14,
    autoWatering: initialData.autoWatering || false,
    autoNutrients: initialData.autoNutrients || false,
    notes: initialData.notes || "",
  });

  const [errors, setErrors] = React.useState<
    Partial<Record<keyof PlantConfig, string>>
  >({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PlantConfig, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Plant name is required";
    }

    if (!formData.species) {
      newErrors.species = "Species selection is required";
    }

    if (!formData.stage) {
      newErrors.stage = "Growth stage is required";
    }

    if (formData.phMin >= formData.phMax) {
      newErrors.phMin = "Min pH must be less than max pH";
      newErrors.phMax = "Max pH must be greater than min pH";
    }

    if (formData.phMin < 5.0 || formData.phMax > 8.0) {
      newErrors.phMin = "pH range should be between 5.0-8.0";
      newErrors.phMax = "pH range should be between 5.0-8.0";
    }

    if (formData.temperatureMin >= formData.temperatureMax) {
      newErrors.temperatureMin = "Min temperature must be less than max";
      newErrors.temperatureMax = "Max temperature must be greater than min";
    }

    if (formData.expectedYield < 0) {
      newErrors.expectedYield = "Expected yield cannot be negative";
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

  const updateField = <K extends keyof PlantConfig>(
    field: K,
    value: PlantConfig[K],
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
          <Leaf className="h-5 w-5 text-green-600" />
          Plant Information
        </h3>

        <div className="mobile-grid gap-4">
          <FarmInput
            label="Plant Name"
            placeholder="e.g., Lettuce Rack A1"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            errorText={errors.name}
            icon={<Leaf className="h-4 w-4" />}
            required
          />

          <FarmInput
            label="Variety"
            placeholder="e.g., Buttercrunch, Cherry"
            value={formData.variety}
            onChange={(e) => updateField("variety", e.target.value)}
            errorText={errors.variety}
            helpText="Specific cultivar or variety name"
          />

          <FarmSelect
            label="Species"
            options={PLANT_SPECIES_OPTIONS}
            value={formData.species}
            onChange={(e) => updateField("species", e.target.value)}
            errorText={errors.species}
            required
          />

          <FarmSelect
            label="Growth Stage"
            options={GROWTH_STAGE_OPTIONS}
            value={formData.stage}
            onChange={(e) => updateField("stage", e.target.value)}
            errorText={errors.stage}
            required
          />

          <FarmInput
            label="Expected Yield"
            type="number"
            placeholder="0"
            value={formData.expectedYield}
            onChange={(e) =>
              updateField("expectedYield", Number(e.target.value))
            }
            errorText={errors.expectedYield}
            helpText="Expected harvest weight in grams"
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <div className="gradient-row rounded-lg p-6">
        <h3 className="text-farm-title font-semibold mb-4 flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-blue-600" />
          Environmental Parameters
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FarmRangeSlider
              label="pH Range (Minimum)"
              min={5.0}
              max={8.0}
              step={0.1}
              value={formData.phMin}
              onValueChange={(value) => updateField("phMin", value)}
              unit=""
              markPoints={PH_MARKS}
              errorText={errors.phMin}
              helpText="Optimal pH for nutrient uptake"
            />

            <FarmRangeSlider
              label="pH Range (Maximum)"
              min={5.0}
              max={8.0}
              step={0.1}
              value={formData.phMax}
              onValueChange={(value) => updateField("phMax", value)}
              unit=""
              markPoints={PH_MARKS}
              errorText={errors.phMax}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FarmRangeSlider
              label="Temperature Range (Min)"
              min={10}
              max={35}
              step={0.5}
              value={formData.temperatureMin}
              onValueChange={(value) => updateField("temperatureMin", value)}
              unit="°C"
              errorText={errors.temperatureMin}
            />

            <FarmRangeSlider
              label="Temperature Range (Max)"
              min={10}
              max={35}
              step={0.5}
              value={formData.temperatureMax}
              onValueChange={(value) => updateField("temperatureMax", value)}
              unit="°C"
              errorText={errors.temperatureMax}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FarmRangeSlider
              label="Target Humidity"
              min={30}
              max={90}
              step={1}
              value={formData.humidityTarget}
              onValueChange={(value) => updateField("humidityTarget", value)}
              unit="%"
              helpText="Relative humidity percentage"
            />

            <FarmRangeSlider
              label="Daily Light Hours"
              min={8}
              max={20}
              step={0.5}
              value={formData.lightHoursDaily}
              onValueChange={(value) => updateField("lightHoursDaily", value)}
              unit="h"
              helpText="Hours of LED lighting per day"
            />
          </div>
        </div>
      </div>

      <div className="gradient-rack rounded-lg p-6">
        <h3 className="text-farm-title font-semibold mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Automation Settings
        </h3>

        <div className="space-y-4">
          <FarmCheckbox
            label="Automatic Watering"
            description="Enable automated irrigation based on soil moisture sensors"
            checked={formData.autoWatering}
            onCheckedChange={(checked) => updateField("autoWatering", checked)}
            inputSize="lg"
          />

          <FarmCheckbox
            label="Automatic Nutrient Dosing"
            description="Enable automated nutrient solution mixing and delivery"
            checked={formData.autoNutrients}
            onCheckedChange={(checked) => updateField("autoNutrients", checked)}
            inputSize="lg"
          />
        </div>
      </div>

      <div className="gradient-shelf rounded-lg p-6">
        <h3 className="text-farm-title font-semibold mb-4">Additional Notes</h3>

        <FarmInput
          label="Notes"
          placeholder="Any additional care instructions or observations..."
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          helpText="Optional notes about special care requirements"
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
              Saving...
            </>
          ) : (
            <>
              <Leaf className="h-4 w-4" />
              Save Plant Configuration
            </>
          )}
        </button>
      </div>
    </form>
  );
}
