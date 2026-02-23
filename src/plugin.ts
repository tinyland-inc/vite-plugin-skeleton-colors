



import type { Plugin } from 'vite';
import type { SkeletonColorConfig, ParsedUtility, ResolvedConfig } from './types.js';
import { resolveConfig } from './constants.js';
import { extractUtilityClasses } from './parser.js';
import { generateCSSModule } from './generator.js';



























export function skeletonColorUtilities(config: SkeletonColorConfig = {}): Plugin {
  const opts: ResolvedConfig = resolveConfig(config);
  const extractedClasses = new Map<string, ParsedUtility>();

  
  const resolvedIds = {
    css: '\0' + opts.virtualModuleIds.css + '.css'
  };

  return {
    name: 'skeleton-color-utilities',
    enforce: 'pre',

    


    transform(code, id) {
      
      if (!opts.include.some(ext => id.endsWith(ext))) {
        return null;
      }

      
      if (id.includes('node_modules') && !id.includes('@tinyland')) {
        return null;
      }

      
      const newClasses = extractUtilityClasses(code);

      
      for (const [className, parsed] of newClasses) {
        if (!extractedClasses.has(className)) {
          extractedClasses.set(className, parsed);
        }
      }

      
      return null;
    },

    


    resolveId(id) {
      if (id === opts.virtualModuleIds.css) {
        return resolvedIds.css;
      }
      return undefined;
    },

    


    load(id) {
      if (opts.debug) {
        console.log('[skeleton-color-utilities] load() called with id:', id);
      }

      if (id === resolvedIds.css) {
        return generateCSSModule(extractedClasses, opts.usePairingTokens, opts.darkMode);
      }
      return null;
    },

    


    buildEnd() {
      if (opts.debug) {
        console.log('\n🎨 Skeleton Color Utilities:');
        console.log(`   Generated ${extractedClasses.size} utility classes`);

        if (extractedClasses.size > 0) {
          
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

    


    handleHotUpdate({ file, server }) {
      
      if (!opts.include.some(ext => file.endsWith(ext))) {
        return;
      }

      
      const cssMod = server.moduleGraph.getModuleById(resolvedIds.css);
      if (cssMod) {
        server.moduleGraph.invalidateModule(cssMod);
      }
    }
  };
}

export default skeletonColorUtilities;
