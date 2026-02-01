/**
 * Tests for CSS generation
 */

import { describe, it, expect } from 'vitest';
import {
  getCSSProperty,
  escapeClassName,
  generatePairingCSS,
  generateSeparateCSS,
  generateCSSModule
} from '../src/generator.js';
import type { ParsedUtility } from '../src/types.js';

describe('getCSSProperty', () => {
  it('maps property targets correctly', () => {
    expect(getCSSProperty('bg')).toBe('background-color');
    expect(getCSSProperty('text')).toBe('color');
    expect(getCSSProperty('border')).toBe('border-color');
    expect(getCSSProperty('divide')).toBe('border-color');
    expect(getCSSProperty('ring')).toBe('--tw-ring-color');
    expect(getCSSProperty('placeholder')).toBe('color');
  });
});

describe('escapeClassName', () => {
  it('escapes special characters', () => {
    expect(escapeClassName('bg-surface-100-900/50')).toBe('bg-surface-100-900\\/50');
    expect(escapeClassName('border:surface-100')).toBe('border\\:surface-100');
  });

  it('leaves normal classes unchanged', () => {
    expect(escapeClassName('bg-surface-100-900')).toBe('bg-surface-100-900');
  });
});

describe('generatePairingCSS', () => {
  it('generates basic pairing CSS', () => {
    const parsed: ParsedUtility = {
      className: 'bg-surface-100-900',
      property: 'bg',
      scale: 'surface',
      lightShade: 100,
      darkShade: 900,
      hasOpacity: false
    };

    const css = generatePairingCSS(parsed);

    expect(css).toContain('.bg-surface-100-900');
    expect(css).toContain('var(--color-surface-100)');
    expect(css).toContain('.dark .bg-surface-100-900');
    expect(css).toContain('var(--color-surface-900)');
  });

  it('generates CSS with opacity', () => {
    const parsed: ParsedUtility = {
      className: 'bg-surface-100-900/50',
      property: 'bg',
      scale: 'surface',
      lightShade: 100,
      darkShade: 900,
      hasOpacity: true,
      opacity: 0.5
    };

    const css = generatePairingCSS(parsed);

    expect(css).toContain('color-mix(in oklch');
    expect(css).toContain('50%');
    expect(css).toContain('transparent');
  });

  it('generates placeholder-specific CSS', () => {
    const parsed: ParsedUtility = {
      className: 'placeholder-surface-400-600',
      property: 'placeholder',
      scale: 'surface',
      lightShade: 400,
      darkShade: 600,
      hasOpacity: false
    };

    const css = generatePairingCSS(parsed);

    expect(css).toContain('::placeholder');
  });

  it('generates divide-specific CSS', () => {
    const parsed: ParsedUtility = {
      className: 'divide-surface-200-800',
      property: 'divide',
      scale: 'surface',
      lightShade: 200,
      darkShade: 800,
      hasOpacity: false
    };

    const css = generatePairingCSS(parsed);

    expect(css).toContain('> :not([hidden]) ~ :not([hidden])');
  });
});

describe('generateSeparateCSS', () => {
  it('generates light mode only when darkMode is false', () => {
    const parsed: ParsedUtility = {
      className: 'bg-surface-100-900',
      property: 'bg',
      scale: 'surface',
      lightShade: 100,
      darkShade: 900,
      hasOpacity: false
    };

    const css = generateSeparateCSS(parsed, false);

    expect(css).toContain('.bg-surface-100-900');
    expect(css).not.toContain('.dark');
  });

  it('generates dark mode when enabled', () => {
    const parsed: ParsedUtility = {
      className: 'bg-surface-100-900',
      property: 'bg',
      scale: 'surface',
      lightShade: 100,
      darkShade: 900,
      hasOpacity: false
    };

    const css = generateSeparateCSS(parsed, true);

    expect(css).toContain('.dark .bg-surface-100-900');
  });
});

describe('generateCSSModule', () => {
  it('generates module with header', () => {
    const classes = new Map<string, ParsedUtility>();
    const css = generateCSSModule(classes, true, true);

    expect(css).toContain('Skeleton Color Utilities - Auto-generated');
    expect(css).toContain('Classes: 0');
  });

  it('generates sorted output', () => {
    const classes = new Map<string, ParsedUtility>();
    classes.set('text-primary-700-300', {
      className: 'text-primary-700-300',
      property: 'text',
      scale: 'primary',
      lightShade: 700,
      darkShade: 300,
      hasOpacity: false
    });
    classes.set('bg-surface-100-900', {
      className: 'bg-surface-100-900',
      property: 'bg',
      scale: 'surface',
      lightShade: 100,
      darkShade: 900,
      hasOpacity: false
    });

    const css = generateCSSModule(classes, true, true);

    // bg-surface should come before text-primary alphabetically
    const bgIndex = css.indexOf('.bg-surface-100-900');
    const textIndex = css.indexOf('.text-primary-700-300');
    expect(bgIndex).toBeLessThan(textIndex);
  });
});
