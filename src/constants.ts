/**
 * Constants for Skeleton Color Utilities plugin
 */

import type { ColorScale, PropertyTarget, ResolvedConfig, SkeletonColorConfig } from './types.js';

/** Available color scales in Skeleton v4.8+ */
export const COLOR_SCALES: ColorScale[] = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'error',
  'surface'
];

/** CSS property targets */
export const PROPERTY_TARGETS: PropertyTarget[] = [
  'bg',
  'text',
  'border',
  'divide',
  'ring',
  'placeholder'
];

/** Skeleton v4.8 official pairing tokens */
export const SKELETON_PAIRINGS = [
  '50-950',
  '100-900',
  '200-800',
  '300-700',
  '400-600',
  '600-400',
  '700-300',
  '800-200',
  '900-100',
  '950-50'
] as const;

/** Default virtual module IDs */
export const DEFAULT_VIRTUAL_MODULE_IDS = {
  css: 'virtual:skeleton-colors'
} as const;

/** Default theme file paths to scan */
export const DEFAULT_THEME_PATHS = [
  'src/lib/styles/themes',
  'src/lib/styles/tokens',
  'src/styles'
];

/** File patterns to scan for theme files */
export const THEME_FILE_PATTERNS = ['.css', '.postcss', '.scss'];

/** Default configuration */
export const DEFAULT_CONFIG: ResolvedConfig = {
  include: ['.svelte', '.html', '.jsx', '.tsx'],
  darkMode: true,
  usePairingTokens: true,
  debug: false,
  virtualModuleIds: { ...DEFAULT_VIRTUAL_MODULE_IDS },
  themePaths: [...DEFAULT_THEME_PATHS]
};

/**
 * Resolve user config with defaults
 */
export function resolveConfig(config: SkeletonColorConfig = {}): ResolvedConfig {
  return {
    include: config.include ?? DEFAULT_CONFIG.include,
    darkMode: config.darkMode ?? DEFAULT_CONFIG.darkMode,
    usePairingTokens: config.usePairingTokens ?? DEFAULT_CONFIG.usePairingTokens,
    debug: config.debug ?? DEFAULT_CONFIG.debug,
    virtualModuleIds: {
      css: config.virtualModuleIds?.css ?? DEFAULT_VIRTUAL_MODULE_IDS.css
    },
    themePaths: config.themePaths ?? DEFAULT_THEME_PATHS
  };
}
