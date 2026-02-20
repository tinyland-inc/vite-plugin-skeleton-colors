/**
 * Main Vite plugin implementation
 */

import type { Plugin } from 'vite';
import type { SkeletonColorConfig, ParsedUtility, ResolvedConfig } from './types.js';
import { resolveConfig } from './constants.js';
import { extractUtilityClasses } from './parser.js';
import { generateCSSModule } from './generator.js';

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

  // Resolved virtual module IDs (with \0 prefix)
  const resolvedIds = {
    css: '\0' + opts.virtualModuleIds.css + '.css'
  };

  return {
    name: 'skeleton-color-utilities',
    enforce: 'pre',

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

      }
    },

    /**
     * Hot Module Replacement support
     */
    handleHotUpdate({ file, server }) {
      // Only handle component files we're scanning
      if (!opts.include.some(ext => file.endsWith(ext))) {
        return;
      }

      // Invalidate virtual module to regenerate CSS
      const cssMod = server.moduleGraph.getModuleById(resolvedIds.css);
      if (cssMod) {
        server.moduleGraph.invalidateModule(cssMod);
      }
    }
  };
}

export default skeletonColorUtilities;
