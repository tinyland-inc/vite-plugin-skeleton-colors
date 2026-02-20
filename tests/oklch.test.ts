/**
 * Tests for OKLCH color conversion
 */

import { describe, it, expect } from 'vitest';
import {
  oklchToRGB,
  extractOKLCHColors,
  generateOKLCHMapModule
} from '../src/oklch.js';

describe('oklchToRGB', () => {
  it('converts OKLCH to RGB', () => {
    // Pure white in oklch
    const result = oklchToRGB('oklch(1 0 0)');
    expect(result).toBeDefined();
    expect(result![0]).toBeGreaterThan(250); // R should be close to 255
    expect(result![1]).toBeGreaterThan(250); // G should be close to 255
    expect(result![2]).toBeGreaterThan(250); // B should be close to 255
  });

  it('converts OKLCH with percentage lightness', () => {
    const result = oklchToRGB('oklch(100% 0 0)');
    expect(result).toBeDefined();
  });

  it('returns null for invalid color strings', () => {
    expect(oklchToRGB('invalid')).toBeNull();
    expect(oklchToRGB('')).toBeNull();
  });

  it('clamps out-of-gamut colors', () => {
    const result = oklchToRGB('oklch(1 0.5 180)');
    expect(result).toBeDefined();
    if (result) {
      expect(result[0]).toBeGreaterThanOrEqual(0);
      expect(result[0]).toBeLessThanOrEqual(255);
      expect(result[1]).toBeGreaterThanOrEqual(0);
      expect(result[1]).toBeLessThanOrEqual(255);
      expect(result[2]).toBeGreaterThanOrEqual(0);
      expect(result[2]).toBeLessThanOrEqual(255);
    }
  });
});

describe('extractOKLCHColors', () => {
  it('extracts oklch colors from CSS', () => {
    const css = `
      :root {
        --color-primary-500: oklch(0.6 0.15 240);
        --color-surface-100: oklch(0.95 0.01 260);
      }
    `;

    const result = extractOKLCHColors(css);
    expect(Object.keys(result).length).toBe(2);
  });

  it('extracts oklab colors from CSS', () => {
    const css = `
      :root {
        --color-test: oklab(0.5 0.1 -0.1);
      }
    `;

    const result = extractOKLCHColors(css);
    expect(Object.keys(result).length).toBe(1);
  });

  it('extracts lab and lch colors', () => {
    const css = `
      :root {
        --lab-color: lab(50% 25 -25);
        --lch-color: lch(50% 25 180);
      }
    `;

    const result = extractOKLCHColors(css);
    expect(Object.keys(result).length).toBe(2);
  });

  it('handles colors with alpha', () => {
    const css = `
      :root {
        --color-alpha: oklch(0.6 0.15 240 / 0.5);
      }
    `;

    const result = extractOKLCHColors(css);
    expect(Object.keys(result).length).toBe(1);
  });

  it('deduplicates identical colors', () => {
    const css = `
      :root {
        --color-a: oklch(0.6 0.15 240);
        --color-b: oklch(0.6 0.15 240);
      }
    `;

    const result = extractOKLCHColors(css);
    expect(Object.keys(result).length).toBe(1);
  });

  it('returns empty map for CSS without OKLCH colors', () => {
    const css = `
      :root {
        --color-red: #ff0000;
        --color-green: rgb(0, 255, 0);
      }
    `;

    const result = extractOKLCHColors(css);
    expect(Object.keys(result).length).toBe(0);
  });
});

describe('generateOKLCHMapModule', () => {
  it('generates valid JavaScript module', () => {
    const colorMap = {
      'oklch(0.6 0.15 240)': [100, 150, 200] as [number, number, number]
    };

    const module = generateOKLCHMapModule(colorMap);

    expect(module).toContain('export const precomputedColorMap');
    expect(module).toContain('export function initializeColorStore');
    expect(module).toContain('export function getPrecomputedRGB');
    expect(module).toContain('export default precomputedColorMap');
  });

  it('includes color count in comment', () => {
    const colorMap = {
      'a': [0, 0, 0] as [number, number, number],
      'b': [255, 255, 255] as [number, number, number]
    };

    const module = generateOKLCHMapModule(colorMap);

    expect(module).toContain('Colors: 2');
  });

  it('generates valid JSON for color map', () => {
    const colorMap = {
      'oklch(0.6 0.15 240)': [100, 150, 200] as [number, number, number]
    };

    const module = generateOKLCHMapModule(colorMap);

    // Extract the JSON part and verify it parses
    const match = module.match(/export const precomputedColorMap = ({[\s\S]*?});/);
    expect(match).toBeTruthy();
    if (match) {
      expect(() => JSON.parse(match[1])).not.toThrow();
    }
  });
});
