



import type { ParsedUtility, ColorScale, PropertyTarget } from './types.js';
import { COLOR_SCALES, PROPERTY_TARGETS, SKELETON_PAIRINGS } from './constants.js';












export function parseUtilityClass(className: string): ParsedUtility | null {
  
  const pattern = /^(bg|text|border|divide|ring|placeholder)-([a-z]+)-(\d+)-(\d+)(?:\/(\d+))?$/;
  const match = className.match(pattern);

  if (!match) return null;

  const [, property, scale, lightShade, darkShade, opacity] = match;

  
  if (!COLOR_SCALES.includes(scale as ColorScale)) return null;

  
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










export function getClosestSkeletonPairing(lightShade: number, darkShade: number): string {
  const pairingKey = `${lightShade}-${darkShade}`;

  
  if (SKELETON_PAIRINGS.includes(pairingKey as (typeof SKELETON_PAIRINGS)[number])) {
    return pairingKey;
  }

  
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







export function extractUtilityClasses(code: string): Map<string, ParsedUtility> {
  const extracted = new Map<string, ParsedUtility>();

  
  const patterns = [
    
    /class=["'`]([^"'`]+)["'`]/g,
    
    /class:([a-zA-Z0-9_-]+(?:-\d+-\d+(?:\/\d+)?)?)(?:=|\s|>)/g,
    
    /class=\{`([^`]+)`\}/g,
    
    /classList\.(?:add|toggle)\(["']([^"']+)["']\)/g,
    
    /class:list=\{?\[([^\]]+)\]\}?/g
  ];

  for (const pattern of patterns) {
    const matches = code.matchAll(pattern);
    for (const match of matches) {
      const classString = match[1];
      if (!classString) continue;

      
      const classes = classString.split(/[\s,'"[\]{}]+/).filter(Boolean);

      for (const cls of classes) {
        
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
