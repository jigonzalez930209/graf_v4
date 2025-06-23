/**
 * Parses a color string (hex or rgb) into an RGB object.
 * @param color - The color string (e.g., '#RRGGBB', 'rgb(r, g, b)').
 * @returns An object { r, g, b } or null if parsing fails.
 */
export const parseColor = (color: string): { r: number; g: number; b: number } | null => {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      const [r, g, b] = hex.split('').map((c) => parseInt(c + c, 16))
      return { r, g, b }
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return { r, g, b }
    }
  }

  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    }
  }

  return null // Return null for unsupported formats
}

/**
 * Darkens a color by a given percentage.
 * @param color - The base color string.
 * @param percent - The percentage to darken (0-100).
 * @returns The darkened color in hex format.
 */
export const darken = (color: string, percent: number): string => {
  const rgb = parseColor(color)
  if (!rgb) return color // Return original color if parsing fails

  const factor = 1 - percent / 100
  const r = Math.round(Math.max(0, rgb.r * factor))
  const g = Math.round(Math.max(0, rgb.g * factor))
  const b = Math.round(Math.max(0, rgb.b * factor))

  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2)

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Makes a color transparent.
 * @param color - The base color string.
 * @param alpha - The alpha transparency value (0-1).
 * @returns The color in rgba format.
 */
export const transparentize = (color: string, alpha: number): string => {
  const rgb = parseColor(color)
  if (!rgb) return color // Return original color if parsing fails

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}
