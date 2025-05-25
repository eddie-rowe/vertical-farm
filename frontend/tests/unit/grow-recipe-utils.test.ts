import { getDifficultyColor, getPythiumRiskColor, VALIDATION_LIMITS } from '@/lib/grow-recipe-utils';

describe('Grow Recipe Utilities', () => {
  describe('getDifficultyColor', () => {
    it('should return correct color for Easy difficulty', () => {
      expect(getDifficultyColor('Easy')).toBe('bg-green-100 text-green-800');
    });

    it('should return correct color for Medium difficulty', () => {
      expect(getDifficultyColor('Medium')).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return correct color for Hard difficulty', () => {
      expect(getDifficultyColor('Hard')).toBe('bg-red-100 text-red-800');
    });

    it('should return default color for null difficulty', () => {
      expect(getDifficultyColor(null)).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default color for invalid difficulty', () => {
      expect(getDifficultyColor('Invalid')).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('getPythiumRiskColor', () => {
    it('should return correct color for Low risk', () => {
      expect(getPythiumRiskColor('Low')).toBe('bg-green-100 text-green-800');
    });

    it('should return correct color for Medium risk', () => {
      expect(getPythiumRiskColor('Medium')).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return correct color for High risk', () => {
      expect(getPythiumRiskColor('High')).toBe('bg-red-100 text-red-800');
    });

    it('should return default color for null risk', () => {
      expect(getPythiumRiskColor(null)).toBe('bg-gray-100 text-gray-800');
    });

    it('should return default color for invalid risk', () => {
      expect(getPythiumRiskColor('Invalid')).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('VALIDATION_LIMITS', () => {
    it('should have correct validation limits', () => {
      expect(VALIDATION_LIMITS.MIN_GROW_DAYS).toBe(1);
      expect(VALIDATION_LIMITS.MAX_LIGHT_HOURS).toBe(24);
      expect(VALIDATION_LIMITS.MIN_LIGHT_HOURS).toBe(0);
      expect(VALIDATION_LIMITS.MAX_HUMIDITY).toBe(100);
      expect(VALIDATION_LIMITS.MIN_HUMIDITY).toBe(0);
      expect(VALIDATION_LIMITS.MAX_PH).toBe(14);
      expect(VALIDATION_LIMITS.MIN_PH).toBe(0);
    });

    it('should be immutable constants', () => {
      expect(() => {
        // @ts-ignore - testing runtime immutability
        VALIDATION_LIMITS.MIN_GROW_DAYS = 999;
      }).toThrow();
    });
  });
}); 