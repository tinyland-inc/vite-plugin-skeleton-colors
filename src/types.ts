/**
 * Type definitions for Skeleton Color Utilities plugin
 */

/** Available color scales in Skeleton v4.8+ */
export type ColorScale = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'surface';

/** Standard shade values */
export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/** CSS property targets */
export type PropertyTarget = 'bg' | 'text' | 'border' | 'divide' | 'ring' | 'placeholder';

/** Parsed utility class structure */
export interface ParsedUtility {
  className: string;
  property: PropertyTarget;
  scale: ColorScale;
  lightShade: number;
  darkShade: number;
  hasOpacity: boolean;
  opacity?: number;
}

/** Plugin configuration options */
export interface SkeletonColorConfig {
  /** File extensions to scan for utility classes (default: ['.svelte', '.html', '.jsx', '.tsx']) */
  include?: string[];
  /** Generate dark mode variants using .dark selector (default: true) */
  darkMode?: boolean;
  /** Use Skeleton's light-dark() pairing tokens when possible (default: true) */
  usePairingTokens?: boolean;
  /** Log extracted classes in dev mode (default: false) */
  debug?: boolean;
  /** Custom virtual module IDs (advanced) */
  virtualModuleIds?: {
    /** CSS module ID (default: 'virtual:skeleton-colors') */
    css?: string;
  };
  /** Paths to scan for theme files (default: ['src/lib/styles/themes', 'src/lib/styles/tokens', 'src/styles']) */
  themePaths?: string[];
}

/** Type for pre-computed color map */
export type PrecomputedColorMap = Record<string, [number, number, number]>;

/** Internal resolved configuration */
export interface ResolvedConfig extends Required<Omit<SkeletonColorConfig, 'virtualModuleIds' | 'themePaths'>> {
  virtualModuleIds: {
    css: string;
  };
  themePaths: string[];
}
