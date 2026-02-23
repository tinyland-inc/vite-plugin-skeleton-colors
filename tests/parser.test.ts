



import { describe, it, expect } from 'vitest';
import {
  parseUtilityClass,
  getClosestSkeletonPairing,
  extractUtilityClasses
} from '../src/parser.js';

describe('parseUtilityClass', () => {
  it('parses basic bg utility', () => {
    const result = parseUtilityClass('bg-surface-100-800');
    expect(result).toEqual({
      className: 'bg-surface-100-800',
      property: 'bg',
      scale: 'surface',
      lightShade: 100,
      darkShade: 800,
      hasOpacity: false,
      opacity: undefined
    });
  });

  it('parses text utility', () => {
    const result = parseUtilityClass('text-primary-900-100');
    expect(result).toEqual({
      className: 'text-primary-900-100',
      property: 'text',
      scale: 'primary',
      lightShade: 900,
      darkShade: 100,
      hasOpacity: false,
      opacity: undefined
    });
  });

  it('parses utility with opacity', () => {
    const result = parseUtilityClass('border-error-300-700/50');
    expect(result).toEqual({
      className: 'border-error-300-700/50',
      property: 'border',
      scale: 'error',
      lightShade: 300,
      darkShade: 700,
      hasOpacity: true,
      opacity: 0.5
    });
  });

  it('parses all property types', () => {
    const properties = ['bg', 'text', 'border', 'divide', 'ring', 'placeholder'];
    for (const prop of properties) {
      const result = parseUtilityClass(`${prop}-surface-100-900`);
      expect(result?.property).toBe(prop);
    }
  });

  it('parses all color scales', () => {
    const scales = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'surface'];
    for (const scale of scales) {
      const result = parseUtilityClass(`bg-${scale}-100-900`);
      expect(result?.scale).toBe(scale);
    }
  });

  it('returns null for invalid patterns', () => {
    expect(parseUtilityClass('bg-red-500')).toBeNull();
    expect(parseUtilityClass('text-surface-100')).toBeNull();
    expect(parseUtilityClass('invalid-surface-100-900')).toBeNull();
    expect(parseUtilityClass('bg-unknown-100-900')).toBeNull();
    expect(parseUtilityClass('')).toBeNull();
  });

  it('handles edge case shade values', () => {
    expect(parseUtilityClass('bg-surface-50-950')?.lightShade).toBe(50);
    expect(parseUtilityClass('bg-surface-950-50')?.darkShade).toBe(50);
  });
});

describe('getClosestSkeletonPairing', () => {
  it('returns exact match for official pairings', () => {
    expect(getClosestSkeletonPairing(100, 900)).toBe('100-900');
    expect(getClosestSkeletonPairing(50, 950)).toBe('50-950');
    expect(getClosestSkeletonPairing(600, 400)).toBe('600-400');
  });

  it('finds closest pairing for non-standard combinations', () => {
    expect(getClosestSkeletonPairing(100, 800)).toBe('100-900');
    expect(getClosestSkeletonPairing(150, 850)).toBe('100-900');
  });
});

describe('extractUtilityClasses', () => {
  it('extracts classes from standard class attribute', () => {
    const code = '<div class="bg-surface-100-900 text-primary-700-300"></div>';
    const result = extractUtilityClasses(code);

    expect(result.size).toBe(2);
    expect(result.has('bg-surface-100-900')).toBe(true);
    expect(result.has('text-primary-700-300')).toBe(true);
  });

  it('extracts classes from Svelte class directive', () => {
    const code = '<div class:bg-surface-100-900={active}></div>';
    const result = extractUtilityClasses(code);

    expect(result.size).toBe(1);
    expect(result.has('bg-surface-100-900')).toBe(true);
  });

  it('extracts classes from template literals', () => {
    const code = '<div class={`bg-surface-100-900 ${active ? "text-primary-700-300" : ""}`}></div>';
    const result = extractUtilityClasses(code);

    expect(result.has('bg-surface-100-900')).toBe(true);
    expect(result.has('text-primary-700-300')).toBe(true);
  });

  it('handles mixed content without duplicates', () => {
    const code = `
      <div class="bg-surface-100-900"></div>
      <div class="bg-surface-100-900 text-primary-700-300"></div>
    `;
    const result = extractUtilityClasses(code);

    expect(result.size).toBe(2);
  });

  it('ignores non-pairing classes', () => {
    const code = '<div class="bg-red-500 p-4 m-2 bg-surface-100-900"></div>';
    const result = extractUtilityClasses(code);

    expect(result.size).toBe(1);
    expect(result.has('bg-surface-100-900')).toBe(true);
    expect(result.has('bg-red-500')).toBe(false);
  });
});
