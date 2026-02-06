import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        const result = cn('bg-red-500', 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });

    it('should handle conditional class names', () => {
        const result = cn('bg-red-500', true && 'text-white', false && 'text-black');
        expect(result).toBe('bg-red-500 text-white');
    });

    it('should handle conflicts correctly using tailwind-merge', () => {
        // tailwind-merge should resolve conflict: p-4 vs p-2 -> p-2 should win if it's last
        const result = cn('p-4', 'p-2');
        expect(result).toBe('p-2');
    });

    it('should handle undefined and null values', () => {
        const result = cn('bg-red-500', undefined, null, 'text-white');
        expect(result).toBe('bg-red-500 text-white');
    });
});
