/**
 * Utility functions for grow recipe management
 */

export const VALIDATION_LIMITS = Object.freeze({
  MIN_GROW_DAYS: 1,
  MAX_GROW_DAYS: 365,
  MIN_LIGHT_HOURS: 0,
  MAX_LIGHT_HOURS: 24,
  MIN_HUMIDITY: 0,
  MAX_HUMIDITY: 100,
  MIN_PH: 0,
  MAX_PH: 14,
  MIN_TEMPERATURE: -10,
  MAX_TEMPERATURE: 50,
});

/**
 * Get the appropriate color classes for difficulty level
 */
export function getDifficultyColor(difficulty: string | null): string {
  switch (difficulty) {
    case "Easy":
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get the appropriate color classes for pythium risk level
 */
export function getPythiumRiskColor(risk: string | null): string {
  switch (risk) {
    case "Low":
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "High":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Format grow days for display
 */
export function formatGrowDays(days: number | null): string {
  if (!days) return "N/A";
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Format light hours for display
 */
export function formatLightHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "N/A";
  return `${hours}h`;
}

/**
 * Format humidity for display
 */
export function formatHumidity(humidity: number | null): string {
  if (humidity === null || humidity === undefined) return "N/A";
  return `${humidity}%`;
}

/**
 * Format pH for display
 */
export function formatPH(ph: number | null): string {
  if (ph === null || ph === undefined) return "N/A";
  return ph.toFixed(1);
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number | null): string {
  if (temp === null || temp === undefined) return "N/A";
  return `${temp}°C`;
}

/**
 * Validate grow recipe data
 */
export function validateGrowRecipe(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.species_name || data.species_name.trim() === "") {
    errors.push("Species name is required");
  }

  if (
    data.grow_days &&
    (data.grow_days < VALIDATION_LIMITS.MIN_GROW_DAYS ||
      data.grow_days > VALIDATION_LIMITS.MAX_GROW_DAYS)
  ) {
    errors.push(
      `Grow days must be between ${VALIDATION_LIMITS.MIN_GROW_DAYS} and ${VALIDATION_LIMITS.MAX_GROW_DAYS}`,
    );
  }

  if (
    data.light_hours &&
    (data.light_hours < VALIDATION_LIMITS.MIN_LIGHT_HOURS ||
      data.light_hours > VALIDATION_LIMITS.MAX_LIGHT_HOURS)
  ) {
    errors.push(
      `Light hours must be between ${VALIDATION_LIMITS.MIN_LIGHT_HOURS} and ${VALIDATION_LIMITS.MAX_LIGHT_HOURS}`,
    );
  }

  if (
    data.humidity &&
    (data.humidity < VALIDATION_LIMITS.MIN_HUMIDITY ||
      data.humidity > VALIDATION_LIMITS.MAX_HUMIDITY)
  ) {
    errors.push(
      `Humidity must be between ${VALIDATION_LIMITS.MIN_HUMIDITY}% and ${VALIDATION_LIMITS.MAX_HUMIDITY}%`,
    );
  }

  if (
    data.ph &&
    (data.ph < VALIDATION_LIMITS.MIN_PH || data.ph > VALIDATION_LIMITS.MAX_PH)
  ) {
    errors.push(
      `pH must be between ${VALIDATION_LIMITS.MIN_PH} and ${VALIDATION_LIMITS.MAX_PH}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
