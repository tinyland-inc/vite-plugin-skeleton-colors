/**
 * @tinyland/vite-plugin-skeleton-colors
 *
 * Vite plugin for generating CSS utilities for Skeleton v4.8+ color pairing tokens.
 * Bridges the gap between Tailwind-style utility syntax (bg-surface-100-800)
 * and Skeleton's CSS custom properties (--color-surface-100-900).
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { skeletonColorUtilities } from '@tinyland/vite-plugin-skeleton-colors';
 *
 * export default defineConfig({
 *   plugins: [
 *     skeletonColorUtilities({ debug: true }),
 *     tailwindcss(),
 *     sveltekit()
 *   ]
 * });
 * ```
 *
 * @example
 * ```css
 * // app.css
 * @import "virtual:skeleton-colors";
 * ```
 *
 * @packageDocumentation
 */

// Main plugin export
export { skeletonColorUtilities, skeletonColorUtilities as default } from './plugin.js';

// Type exports
export type {
  ColorScale,
  Shade,
  PropertyTarget,
  ParsedUtility,
  SkeletonColorConfig,
  PrecomputedColorMap,
  ResolvedConfig
} from './types.js';

// Utility exports (for advanced usage)
export { parseUtilityClass, getClosestSkeletonPairing, extractUtilityClasses } from './parser.js';
export { getCSSProperty, escapeClassName, generatePairingCSS, generateSeparateCSS, generateCSSModule } from './generator.js';

// Constants exports
export {
  COLOR_SCALES,
  PROPERTY_TARGETS,
  SKELETON_PAIRINGS,
  DEFAULT_VIRTUAL_MODULE_IDS,
  DEFAULT_THEME_PATHS,
  THEME_FILE_PATTERNS,
  DEFAULT_CONFIG,
  resolveConfig
} from './constants.js';
