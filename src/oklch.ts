/**
 * OKLCH→RGB build-time conversion utilities
 *
 * Uses culori for accurate color space conversion
 */

import { oklch, rgb } from 'culori';
import * as fs from 'fs';
import * as path from 'path';
import type { PrecomputedColorMap } from './types.js';
import { THEME_FILE_PATTERNS } from './constants.js';

/**
 * Convert an OKLCH or OKLAB color string to RGB tuple
 * Uses culori for accurate color space conversion
 *
 * @param colorString - CSS color string (oklch, oklab, or any supported format)
 * @returns RGB tuple [r, g, b] in 0-255 range, or null if parsing fails
 */
export function oklchToRGB(colorString: string): [number, number, number] | null {
  try {
    // Parse the color using culori
    const color = oklch(colorString);
    if (!color) {
      // Try as generic color (oklab, lab, lch, etc.)
      const genericColor = rgb(colorString);
      if (!genericColor) return null;

      return [
        Math.round(genericColor.r * 255),
        Math.round(genericColor.g * 255),
        Math.round(genericColor.b * 255)
      ];
    }

    // Convert to RGB
    const rgbColor = rgb(color);
    if (!rgbColor) return null;

    // Clamp to 0-255 range (oklch can produce out-of-gamut colors)
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));

    return [clamp(rgbColor.r), clamp(rgbColor.g), clamp(rgbColor.b)];
  } catch (error) {
    console.warn(`[skeleton-color-utilities] Failed to convert color: ${colorString}`, error);
    return null;
  }
}

/**
 * Extract OKLCH/OKLAB color values from a CSS file
 *
 * @param cssContent - Raw CSS file content
 * @returns Map of original color string to RGB tuple
 */
export function extractOKLCHColors(cssContent: string): PrecomputedColorMap {
  const colorMap: PrecomputedColorMap = {};

  // Pattern to match oklch() and oklab() with various syntax:
  // oklch(0.75 0.008 260)
  // oklch(97% 0.02 280deg)
  // oklch(0.75 0.008 260 / 0.5)
  // oklab(0.75 -0.001 -0.007)
  // Note: culori handles all these formats, we just need to extract them
  // IMPORTANT: Use (?<![a-z]) negative lookbehind to avoid matching lch inside oklch
  const colorPatterns = [
    // oklch with optional alpha, % for lightness, deg for hue
    /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:deg)?(?:\s*\/\s*[0-9.]+)?\s*\)/gi,
    // oklab with optional alpha
    /oklab\(\s*[0-9.]+%?\s+[0-9.-]+\s+[0-9.-]+(?:\s*\/\s*[0-9.]+)?\s*\)/gi,
    // lab (not preceded by ok)
    /(?<![a-z])lab\(\s*[0-9.]+%?\s+[0-9.-]+\s+[0-9.-]+(?:\s*\/\s*[0-9.]+)?\s*\)/gi,
    // lch (not preceded by ok)
    /(?<![a-z])lch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:deg)?(?:\s*\/\s*[0-9.]+)?\s*\)/gi
  ];

  for (const pattern of colorPatterns) {
    const matches = cssContent.matchAll(pattern);
    for (const match of matches) {
      const fullMatch = match[0];

      // Skip if already processed
      if (colorMap[fullMatch]) continue;

      const rgbResult = oklchToRGB(fullMatch);
      if (rgbResult) {
        colorMap[fullMatch] = rgbResult;
      }
    }
  }

  return colorMap;
}

/**
 * Scan theme CSS files and extract all OKLCH colors
 *
 * @param rootDir - Project root directory
 * @param themePaths - Paths to scan for theme files
 * @returns Pre-computed color map
 */
export function scanThemeFiles(rootDir: string, themePaths: string[]): PrecomputedColorMap {
  const colorMap: PrecomputedColorMap = {};

  for (const themePath of themePaths) {
    const fullPath = path.join(rootDir, themePath);

    if (!fs.existsSync(fullPath)) continue;

    try {
      const files = fs.readdirSync(fullPath);

      for (const file of files) {
        // Check if it matches our patterns
        if (!THEME_FILE_PATTERNS.some((ext) => file.endsWith(ext))) continue;

        const filePath = path.join(fullPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract OKLCH colors
        const extracted = extractOKLCHColors(content);

        // Merge into main map
        Object.assign(colorMap, extracted);
      }
    } catch (error) {
      console.warn(`[skeleton-color-utilities] Failed to scan ${fullPath}:`, error);
    }
  }

  return colorMap;
}

/**
 * Generate the virtual module code for pre-computed OKLCH→RGB mappings
 *
 * @param colorMap - Pre-computed color map
 * @returns JavaScript module code as string
 */
export function generateOKLCHMapModule(colorMap: PrecomputedColorMap): string {
  const entries = Object.entries(colorMap);

  return `/**
 * Pre-computed OKLCH→RGB Color Map
 * Generated at build time by @tinyland/vite-plugin-skeleton-colors
 * Generated: ${new Date().toISOString()}
 * Colors: ${entries.length}
 *
 * This module provides instant O(1) lookups for theme colors,
 * avoiding runtime Canvas-based conversion for known colors.
 */

/**
 * Pre-computed color map
 * Maps original CSS color string to RGB tuple [r, g, b]
 */
export const precomputedColorMap = ${JSON.stringify(colorMap, null, 2)};

/**
 * Initialize with pre-computed colors (no-op, kept for API compatibility)
 * The store was moved to the pixelwise repo
 */
export function initializeColorStore() {
  // No-op - colorConversionStore moved to pixelwise repo
  if (typeof window !== 'undefined') {
    console.log('[oklch-rgb-map] Pre-computed', Object.keys(precomputedColorMap).length, 'OKLCH colors available');
  }
}

/**
 * Get RGB for a color (pre-computed lookup only)
 * Returns null if color was not pre-computed
 */
export function getPrecomputedRGB(color) {
  return precomputedColorMap[color] || null;
}

export default precomputedColorMap;
`;
}
