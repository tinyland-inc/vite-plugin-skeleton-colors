/**
 * Main Vite plugin implementation
 */

import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import type { SkeletonColorConfig, ParsedUtility, PrecomputedColorMap, ResolvedConfig } from './types.js';
import { resolveConfig } from './constants.js';
import { extractUtilityClasses } from './parser.js';
import { generateCSSModule } from './generator.js';
import { scanThemeFiles, generateOKLCHMapModule } from './oklch.js';

/**
 * Vite plugin that generates CSS utilities for Skeleton color pairing tokens
 *
 * @param config - Plugin configuration options
 * @returns Vite plugin
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
 */
export function skeletonColorUtilities(config: SkeletonColorConfig = {}): Plugin {
  const opts: ResolvedConfig = resolveConfig(config);
  const extractedClasses = new Map<string, ParsedUtility>();
  let rootDir = process.cwd();
  let precomputedColors: PrecomputedColorMap = {};

  // Resolved virtual module IDs (with \0 prefix)
  const resolvedIds = {
    css: '\0' + opts.virtualModuleIds.css + '.css',
    oklchMap: '\0' + opts.virtualModuleIds.oklchMap,
    pulsing: '\0' + opts.virtualModuleIds.pulsing
  };

  return {
    name: 'skeleton-color-utilities',
    enforce: 'pre',

    configResolved(resolvedConfig) {
      rootDir = resolvedConfig.root;

      // Scan theme files for OKLCH colors at build start
      try {
        precomputedColors = scanThemeFiles(rootDir, opts.themePaths);
        if (opts.debug) {
          console.log(`[skeleton-color-utilities] Pre-computed ${Object.keys(precomputedColors).length} OKLCH→RGB conversions`);
        }
      } catch (error) {
        console.warn('[skeleton-color-utilities] Failed to scan theme files:', error);
      }
    },

    /**
     * Scan source files for utility class patterns
     */
    transform(code, id) {
      // Only scan included file types
      if (!opts.include.some(ext => id.endsWith(ext))) {
        return null;
      }

      // Skip node_modules except for our own patterns
      if (id.includes('node_modules') && !id.includes('@tinyland')) {
        return null;
      }

      // Extract utility classes from this file
      const newClasses = extractUtilityClasses(code);

      // Merge into global map
      for (const [className, parsed] of newClasses) {
        if (!extractedClasses.has(className)) {
          extractedClasses.set(className, parsed);
        }
      }

      // Don't transform the file, just extract classes
      return null;
    },

    /**
     * Resolve the virtual module ID
     */
    resolveId(id) {
      if (id === opts.virtualModuleIds.css) {
        return resolvedIds.css;
      } else if (id === opts.virtualModuleIds.pulsing) {
        return resolvedIds.pulsing;
      } else if (id === opts.virtualModuleIds.oklchMap) {
        return resolvedIds.oklchMap;
      }
      return undefined;
    },

    /**
     * Generate CSS for the virtual module
     */
    load(id) {
      if (opts.debug) {
        console.log('[skeleton-color-utilities] load() called with id:', id);
      }

      if (id === resolvedIds.css) {
        return generateCSSModule(extractedClasses, opts.usePairingTokens, opts.darkMode);
      } else if (id === resolvedIds.pulsing) {
        // Generate JavaScript module for pixelwise pulsing
        if (opts.debug) {
          console.log('[skeleton-color-utilities] Generating pixelwise-pulsing module...');
        }
        try {
          const code = generatePulsingModuleCode(opts.pulsingModulePath, rootDir);
          if (opts.debug) {
            console.log('[skeleton-color-utilities] Generated pixelwise-pulsing module, length:', code.length);
          }
          return code;
        } catch (err) {
          console.error('[skeleton-color-utilities] Failed to generate pixelwise-pulsing:', err);
          throw err;
        }
      } else if (id === resolvedIds.oklchMap) {
        // Generate JavaScript module for pre-computed OKLCH→RGB mappings
        if (opts.debug) {
          console.log(`[skeleton-color-utilities] Generating oklch-rgb-map module with ${Object.keys(precomputedColors).length} colors...`);
        }
        try {
          const code = generateOKLCHMapModule(precomputedColors);
          if (opts.debug) {
            console.log('[skeleton-color-utilities] Generated oklch-rgb-map module, length:', code.length);
          }
          return code;
        } catch (err) {
          console.error('[skeleton-color-utilities] Failed to generate oklch-rgb-map:', err);
          throw err;
        }
      }
      return null;
    },

    /**
     * Log statistics at build end
     */
    buildEnd() {
      if (opts.debug) {
        console.log('\n🎨 Skeleton Color Utilities:');
        console.log(`   Generated ${extractedClasses.size} utility classes`);

        if (extractedClasses.size > 0) {
          // Group by property type
          const byProperty = new Map<string, string[]>();
          for (const [className, parsed] of extractedClasses) {
            const list = byProperty.get(parsed.property) || [];
            list.push(className);
            byProperty.set(parsed.property, list);
          }

          for (const [property, classes] of byProperty) {
            console.log(`   ${property}: ${classes.length} classes`);
          }
        }

        // Log pre-computed OKLCH colors
        const precomputedCount = Object.keys(precomputedColors).length;
        if (precomputedCount > 0) {
          console.log(`\n🌈 Pre-computed OKLCH→RGB Colors: ${precomputedCount}`);
        }
      }
    },

    /**
     * Hot Module Replacement support
     */
    handleHotUpdate({ file, server }) {
      // Check if it's a theme/style file that might contain OKLCH colors
      const isThemeFile = file.includes('/styles/') && file.endsWith('.css');

      // Rescan theme files if a theme file changed
      if (isThemeFile) {
        try {
          precomputedColors = scanThemeFiles(rootDir, opts.themePaths);
          console.log(`[skeleton-color-utilities] Rescanned theme files, found ${Object.keys(precomputedColors).length} OKLCH colors`);

          // Invalidate the oklch-rgb-map module
          const oklchMapMod = server.moduleGraph.getModuleById(resolvedIds.oklchMap);
          if (oklchMapMod) {
            server.moduleGraph.invalidateModule(oklchMapMod);
          }
        } catch (error) {
          console.warn('[skeleton-color-utilities] Failed to rescan theme files:', error);
        }
      }

      // Only handle component files we're scanning
      if (!opts.include.some(ext => file.endsWith(ext))) {
        return;
      }

      // Invalidate virtual modules to regenerate CSS and JS
      const cssMod = server.moduleGraph.getModuleById(resolvedIds.css);
      if (cssMod) {
        server.moduleGraph.invalidateModule(cssMod);
      }

      const pixelwiseMod = server.moduleGraph.getModuleById(resolvedIds.pulsing);
      if (pixelwiseMod) {
        server.moduleGraph.invalidateModule(pixelwiseMod);
      }
    }
  };
}

/**
 * Generate JavaScript module code for pixelwise pulsing engine
 * Reads from template file and returns as string
 */
function generatePulsingModuleCode(customPath: string | null, rootDir: string): string {
  // Try custom path first
  if (customPath) {
    const resolvedPath = path.isAbsolute(customPath)
      ? customPath
      : path.resolve(rootDir, customPath);

    if (fs.existsSync(resolvedPath)) {
      return fs.readFileSync(resolvedPath, 'utf-8');
    }
    console.warn(`[skeleton-color-utilities] Custom pulsing module path not found: ${resolvedPath}`);
  }

  // Try default path relative to project root
  const defaultPath = path.resolve(rootDir, 'src/vite-plugin-types/pixelwise-pulsing.js');
  if (fs.existsSync(defaultPath)) {
    return fs.readFileSync(defaultPath, 'utf-8');
  }

  // Return stub if not found
  return `
// Pixelwise pulsing module not configured
// To enable, provide a pulsingModulePath in plugin options or create:
// src/vite-plugin-types/pixelwise-pulsing.js
export class PulsingEngine {
  constructor(config) {
    console.warn('[pixelwise-pulsing] Module not configured. Pulsing animations disabled.');
  }
}
`;
}

export default skeletonColorUtilities;
