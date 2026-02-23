






























export { skeletonColorUtilities, skeletonColorUtilities as default } from './plugin.js';


export type {
  ColorScale,
  Shade,
  PropertyTarget,
  ParsedUtility,
  SkeletonColorConfig,
  PrecomputedColorMap,
  ResolvedConfig
} from './types.js';


export { parseUtilityClass, getClosestSkeletonPairing, extractUtilityClasses } from './parser.js';
export { getCSSProperty, escapeClassName, generatePairingCSS, generateSeparateCSS, generateCSSModule } from './generator.js';


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
