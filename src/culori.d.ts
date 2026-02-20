/**
 * Type declarations for culori color library
 */

declare module 'culori' {
  export interface Color {
    mode: string;
    r?: number;
    g?: number;
    b?: number;
    l?: number;
    c?: number;
    h?: number;
    alpha?: number;
  }

  export interface RGBColor extends Color {
    mode: 'rgb';
    r: number;
    g: number;
    b: number;
  }

  export interface OKLCHColor extends Color {
    mode: 'oklch';
    l: number;
    c: number;
    h: number;
  }

  /**
   * Parse a color string to OKLCH format
   */
  export function oklch(color: string | Color | undefined | null): OKLCHColor | undefined;

  /**
   * Convert a color to RGB format
   */
  export function rgb(color: string | Color | undefined | null): RGBColor | undefined;

  /**
   * Format a color as a hex string
   */
  export function formatHex(color: string | Color): string;
}
