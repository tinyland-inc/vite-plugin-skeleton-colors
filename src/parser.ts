/**
 * Utility class parsing for Skeleton color patterns
 */

import type { ParsedUtility, ColorScale, PropertyTarget } from './types.js';
import { COLOR_SCALES, PROPERTY_TARGETS, SKELETON_PAIRINGS } from './constants.js';

/**
 * Parse a utility class name into its components
 *
 * Supports formats:
 * - bg-surface-100-800
 * - text-primary-900-100
 * - border-error-300-700/50 (with opacity)
 *
 * @param className - The utility class name to parse
 * @returns Parsed utility or null if not a valid pattern
 */
export function parseUtilityClass(className: string): ParsedUtility | null {
  // Pattern: (property)-(scale)-(lightShade)-(darkShade)(/opacity)?
  const pattern = /^(bg|text|border|divide|ring|placeholder)-([a-z]+)-(\d+)-(\d+)(?:\/(\d+))?$/;
  const match = className.match(pattern);

  if (!match) return null;

  const [, property, scale, lightShade, darkShade, opacity] = match;

  // Validate scale
  if (!COLOR_SCALES.includes(scale as ColorScale)) return null;

  // Validate property
  if (!PROPERTY_TARGETS.includes(property as PropertyTarget)) return null;

  return {
    className,
    property: property as PropertyTarget,
    scale: scale as ColorScale,
    lightShade: parseInt(lightShade, 10),
    darkShade: parseInt(darkShade, 10),
    hasOpacity: !!opacity,
    opacity: opacity ? parseInt(opacity, 10) / 100 : undefined
  };
}

/**
 * Find the closest Skeleton pairing token for arbitrary shade combinations
 *
 * Maps non-standard combinations like 100-800 to official pairings like 100-900
 *
 * @param lightShade - Light mode shade value
 * @param darkShade - Dark mode shade value
 * @returns Closest matching Skeleton pairing string
 */
export function getClosestSkeletonPairing(lightShade: number, darkShade: number): string {
  const pairingKey = `${lightShade}-${darkShade}`;

  // Check if it's an exact match
  if (SKELETON_PAIRINGS.includes(pairingKey as (typeof SKELETON_PAIRINGS)[number])) {
    return pairingKey;
  }

  // Find closest match based on light shade
  const targetLight = lightShade;
  let closest: string = SKELETON_PAIRINGS[0];
  let minDiff = Math.abs(parseInt(closest.split('-')[0], 10) - targetLight);

  for (const pairing of SKELETON_PAIRINGS) {
    const pairingLight = parseInt(pairing.split('-')[0], 10);
    const diff = Math.abs(pairingLight - targetLight);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pairing;
    }
  }

  return closest;
}

/**
 * Extract utility classes from source code
 *
 * @param code - Source code to scan
 * @returns Map of class names to parsed utilities
 */
export function extractUtilityClasses(code: string): Map<string, ParsedUtility> {
  const extracted = new Map<string, ParsedUtility>();

  // Multiple patterns to extract classes from various syntaxes
  const patterns = [
    // Standard class attribute: class="..."
    /class=["'`]([^"'`]+)["'`]/g,
    // Svelte class directive: class:name={condition}
    /class:([a-zA-Z0-9_-]+(?:-\d+-\d+(?:\/\d+)?)?)(?:=|\s|>)/g,
    // Template literals with expressions: class={`...`}
    /class=\{`([^`]+)`\}/g,
    // Array/object syntax in frameworks
    /classList\.(?:add|toggle)\(["']([^"']+)["']\)/g,
    // Svelte class:list directive
    /class:list=\{?\[([^\]]+)\]\}?/g
  ];

  for (const pattern of patterns) {
    const matches = code.matchAll(pattern);
    for (const match of matches) {
      const classString = match[1];
      if (!classString) continue;

      // Split by whitespace, commas, quotes, brackets
      const classes = classString.split(/[\s,'"[\]{}]+/).filter(Boolean);

      for (const cls of classes) {
        // Skip if already extracted
        if (extracted.has(cls)) continue;

        const parsed = parseUtilityClass(cls);
        if (parsed) {
          extracted.set(cls, parsed);
        }
      }
    }
  }

  return extracted;
}
