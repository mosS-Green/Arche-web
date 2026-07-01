export interface ThemePalette {
  name: string;
  personal: string;
  work: string;
}

export const ACCENT_PALETTES: ThemePalette[] = [
  {
    name: 'Lemony & Mint',
    personal: 'oklch(0.78 0.16 130)', // Lemony green
    work: 'oklch(0.75 0.13 185)'     // Minty blue
  },
  {
    name: 'Sea Green & Electric Blue',
    personal: 'oklch(0.72 0.14 165)', // Seaish green
    work: 'oklch(0.70 0.16 240)'     // Electric blue
  },
  {
    name: 'Mint & Lemony',
    personal: 'oklch(0.75 0.13 185)', // Minty blue
    work: 'oklch(0.78 0.16 130)'     // Lemony green
  },
  {
    name: 'Electric Blue & Sea Green',
    personal: 'oklch(0.70 0.16 240)', // Electric blue
    work: 'oklch(0.72 0.14 165)'     // Seaish green
  }
];

export function applyRandomAccent(): ThemePalette {
  const index = Math.floor(Math.random() * ACCENT_PALETTES.length);
  const palette = ACCENT_PALETTES[index];
  
  // Apply to root element styles
  document.documentElement.style.setProperty('--color-accent-personal', palette.personal);
  document.documentElement.style.setProperty('--color-accent-work', palette.work);
  
  // Set selection background color as well
  document.documentElement.style.setProperty('--color-selection-bg', palette.personal);
  
  return palette;
}
