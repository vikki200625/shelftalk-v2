---
name: ShellTalk
colors:
  surface: '#fff8f5'
  surface-dim: '#e0d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ee'
  surface-container: '#f4ece8'
  surface-container-high: '#eee7e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#414944'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efeb'
  outline: '#717974'
  outline-variant: '#c0c9c2'
  surface-tint: '#396754'
  primary: '#013626'
  on-primary: '#ffffff'
  primary-container: '#1e4d3b'
  on-primary-container: '#8cbda6'
  inverse-primary: '#a0d1b9'
  secondary: '#755b00'
  on-secondary: '#ffffff'
  secondary-container: '#fed255'
  on-secondary-container: '#735a00'
  tertiary: '#00361f'
  on-tertiary: '#ffffff'
  tertiary-container: '#084f30'
  on-tertiary-container: '#80c098'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bbeed5'
  primary-fixed-dim: '#a0d1b9'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#204f3d'
  secondary-fixed: '#ffe08e'
  secondary-fixed-dim: '#ecc246'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#aff1c7'
  tertiary-fixed-dim: '#94d5ac'
  on-tertiary-fixed: '#002111'
  on-tertiary-fixed-variant: '#0c5132'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-section:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-section-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-card:
    fontFamily: Newsreader
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  caption:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  xxl: 64px
  huge: 96px
---

## Brand & Style
The design system is built on a **Modern Independent Bookshop** aesthetic, balancing the timelessness of a high-end literary journal with the functionality of a contemporary community platform. It evokes a "warm, cozy, and premium" emotional response, utilizing a palette inspired by heavy-stock cream paper, forest-green shelving, and aged brass fixtures.

The style is **Minimalist-Tactile**, prioritizing high-quality typography and generous whitespace while using subtle shadows and layered surfaces to suggest physical depth. Interaction should feel intentional and calm, mimicking the tactile experience of browsing a curated library during the golden hour.

## Colors
The palette is rooted in organic, earthy tones. The background uses a warm cream (`#FBF7EF`) to reduce eye strain during long reading sessions, while surfaces use a brighter cream-white (`#FFFDF7`) to create subtle contrast.

- **Primary Forest Green**: Used for core actions, branding, and navigation. It represents stability and growth.
- **Accent Brass**: Reserved for highlighting value, such as star ratings, specialized badges, and premium features.
- **Ink Tones**: We avoid pure black. Headings use a warm near-black (`#1C1917`) for high legibility, while body text uses a softened warm gray (`#57534E`) to maintain the "ink-on-paper" feel.
- **Success Sage**: A specialized muted green used exclusively for "Completed" states and positive status indicators.

## Typography
The system uses a pairing of a literary serif and a functional sans-serif.

**Newsreader** is the voice of the brand. It is used for all editorial content, headings, and book titles. It should feel authoritative yet warm. Use lower optical sizes for smaller headings to maintain legibility.

**Work Sans** handles the "work" of the UI. It is used for navigation, metadata, buttons, and long-form body text where clarity is paramount. Its slightly wider character set feels approachable and modern against the classic serif.

## Layout & Spacing
The spacing rhythm follows an 8px base grid. This design system favors generous padding to create a "breathable" literary atmosphere. 

- **Grid**: Use a 12-column fluid grid for desktop with 24px gutters. On mobile, transition to a 4-column grid with 20px margins.
- **Search Centerpiece**: The primary search feature on the landing page should occupy a central vertical axis with significant top and bottom padding (`huge`) to emphasize its importance as the "entryway" to the shop.
- **Staggered Entrance**: When lists or grids load, apply a 50ms incremental delay to each item to create a cascading, "shelving" effect.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Warm-Tinted Shadows**. 

1. **Base Layer**: The paper-colored background (`#FBF7EF`).
2. **Surface Layer**: Cards and containers (`#FFFDF7`) sit slightly above the base with a very subtle, tight shadow: `0 1px 3px rgba(28, 25, 23, 0.08)`.
3. **Interactive Hover**: When cards are hovered, they lift significantly. The shadow expands and takes on a forest-green tint to suggest light reflecting off the "shelving": `0 16px 32px rgba(30, 77, 59, 0.14)`.
4. **Sticky Navigation**: The navbar uses a backdrop blur (12px) with a semi-transparent version of the background color and a `1px` bottom border in `#E7E0D0`.

## Shapes
The shape language is "Soft-Organic." We avoid harsh geometric corners to maintain the cozy aesthetic.

- **Cards**: Use a `16px` radius to feel substantial and friendly.
- **Buttons**: Use a `10px` radius, striking a balance between the roundness of the cards and the structure of the text.
- **Inputs & Search**: The main search bar uses a full **Pill** radius (`999px`) to distinguish it as a high-frequency utility.
- **Book Covers**: CSS-drawn book covers should have a `2px` right-side radius to mimic the spine and a `1px` inner-left border to simulate a "fold" line.

## Components

### Buttons
- **Primary**: Background `#1E4D3B`, Text `#FFFDF7`. On hover, shift to `#143A2C`.
- **Secondary/Brass**: Background `transparent`, Border `1px solid #C9A227`, Text `#C9A227`.
- **CTA Band**: Use a linear gradient from `#12291F` to `#1E4D3B`.

### Cards
- **Book Card**: Surface `#FFFDF7`, Radius `16px`. Contains a CSS-drawn book cover icon using the Primary or Secondary colors. Title in `headline-card`, Author in `ink_muted`.
- **Community Post**: Subtle sand border (`#E7E0D0`) at the bottom instead of full box containment to feel like a newspaper column.

### Inputs
- **Search Bar**: Background `#FFFDF7`, Border `1px solid #E7E0D0`, full-pill radius. Placeholder text in `#A8A29E`. On focus, border changes to `#1E4D3B`.
- **Checkboxes/Radios**: Use the Primary Forest Green for selected states.

### Chips & Tags
- **Success Sage**: For "Finished" or "Read" status. Background is a 10% opacity of `#3F7D5A`, text is full opacity.
- **Brass Highlights**: For "Featured" or "Highly Rated".

### Navigation
- **Sticky Navbar**: Background `#FBF7EF` at 80% opacity with `backdrop-filter: blur(12px)`. A thin 1px bottom border in `#E7E0D0`. Navigation links in `Work Sans` Bold, 14px.