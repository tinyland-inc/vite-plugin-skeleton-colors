




export type ColorScale = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'surface';


export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;


export type PropertyTarget = 'bg' | 'text' | 'border' | 'divide' | 'ring' | 'placeholder';


export interface ParsedUtility {
  className: string;
  property: PropertyTarget;
  scale: ColorScale;
  lightShade: number;
  darkShade: number;
  hasOpacity: boolean;
  opacity?: number;
}


export interface SkeletonColorConfig {
  
  include?: string[];
  
  darkMode?: boolean;
  
  usePairingTokens?: boolean;
  
  debug?: boolean;
  
  virtualModuleIds?: {
    
    css?: string;
  };
  
  themePaths?: string[];
}


export type PrecomputedColorMap = Record<string, [number, number, number]>;


export interface ResolvedConfig extends Required<Omit<SkeletonColorConfig, 'virtualModuleIds' | 'themePaths'>> {
  virtualModuleIds: {
    css: string;
  };
  themePaths: string[];
}
