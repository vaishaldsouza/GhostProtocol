---
name: RedPulse AI Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5b403d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#906f6c'
  outline-variant: '#e4beb9'
  surface-tint: '#bb171c'
  primary: '#b7131a'
  on-primary: '#ffffff'
  primary-container: '#db322f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4ac'
  secondary: '#5f5e5f'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe0'
  on-secondary-container: '#636263'
  tertiary: '#655958'
  on-tertiary: '#ffffff'
  tertiary-container: '#7e7270'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000d'
  secondary-fixed: '#e5e2e3'
  secondary-fixed-dim: '#c8c6c7'
  on-secondary-fixed: '#1b1b1c'
  on-secondary-fixed-variant: '#474647'
  tertiary-fixed: '#efdfdd'
  tertiary-fixed-dim: '#d3c3c1'
  on-tertiary-fixed: '#221a19'
  on-tertiary-fixed-variant: '#4f4443'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  h2:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for a high-stakes AI healthcare environment, balancing medical urgency with technical sophistication. The brand personality is authoritative yet empathetic, positioning the product as a cutting-edge clinical partner.

The visual direction merges **Modern SaaS** aesthetics with **Apple-inspired glassmorphism**. The interface relies on expansive white space, precision-engineered typography, and "living" surfaces that use subtle blurred gradients to imply depth and intelligence. This creates a calm, high-trust environment where complex data feels manageable and urgent alerts remain unmistakably clear.

## Colors

The palette is centered around **Medical Red (#E53935)**, used strategically for primary actions, critical data points, and pulse indicators. 

### Light Mode
The background is pure `#FFFFFF`. Soft, low-opacity red radial gradients (5-8% opacity) are used in the background to create a sense of organic "pulse" and depth. Surfaces use a mix of pure white and extremely light grays (`#F8F9FA`) to define container hierarchy.

### Dark Mode
The background shifts to a deep charcoal-black (`#0F0F10`). Surfaces utilize a semi-transparent glass effect over subtle dark-red glows. 

### Functional Colors
- **Success:** #10B981 (Green)
- **Warning:** #F59E0B (Amber)
- **Neutral/Body:** #1A1A1B (High contrast for legibility)

## Typography

This design system uses a dual-typeface strategy to distinguish between editorial/brand elements and functional data.

- **Headings (Poppins):** Set with tight tracking and a geometric structure to feel modern and professional.
- **Body & Data (Inter):** Leverages a tall x-height and neutral character for maximum legibility in high-density clinical reports.

**Usage Rules:**
- Use **H1** and **H2** for dashboard overviews and page titles.
- **Body-MD** is the default for all clinical notes and AI descriptions.
- **Label-SM** should be used for metadata and status badges to ensure clear distinction from narrative text.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with high-density protection. We prioritize "breathability" to reduce cognitive load on medical staff.

- **Grid:** 12-column system for desktop, 4-column for mobile.
- **Rhythm:** An 8px incremental scale (Soft Grid) drives all padding and margins.
- **Container Strategy:** Content is housed in "Large" or "X-Large" rounded containers.
- **Safe Zones:** Always maintain a minimum of 48px padding between major structural sections on desktop to preserve the premium feel.

## Elevation & Depth

This design system avoids heavy, muddy shadows. Instead, it uses **Ambient Light Elevation** and **Glassmorphism**:

1.  **Level 0 (Flat):** The main canvas background.
2.  **Level 1 (Subtle):** Cards and surfaces. Defined by a 1px solid border (`rgba(0,0,0,0.05)`) and a very soft, large-radius shadow (Blur: 30px, Y: 10px, Opacity: 4%).
3.  **Level 2 (Glass):** Modals, dropdowns, and navigation bars. These use `backdrop-filter: blur(20px)` and a semi-transparent background color.
4.  **Pulse Elevation:** Active AI-processing states use a soft red outer glow (`box-shadow: 0 0 20px rgba(229, 57, 51, 0.15)`).

## Shapes

The shape language is friendly and sophisticated. All primary containers use a large radius to soften the "clinical" feel and make the software feel more approachable.

- **Standard Buttons & Inputs:** 12px (Soft).
- **Cards & Primary Containers:** 20px (Rounded-XL).
- **Badges & Tags:** Full pill (32px+).
- **Selection States:** Use a 2px inner stroke on rounded containers to indicate focus.

## Components

### Buttons
- **Primary:** Solid #E53935, white text, 20px height padding. No gradient, but a subtle scale-down on click (0.98x).
- **Secondary:** Transparent with a 1px border of `#1A1A1B` (or white in dark mode).
- **Ghost:** Minimal padding, used for utility actions.

### Cards
Cards are the primary building block. They must include a `20px` border-radius and a `1px` subtle border. In AI-insight cards, a top-border accent of 4px in Primary Red can be used to denote importance.

### Input Fields
Inputs should be height-optimized (48px) with a soft-gray background (`#F1F3F5`). On focus, the border transitions to Primary Red with a subtle 4px red outer glow.

### AI Pulse Badge
A custom component for "RedPulse AI": a small circular status indicator that uses a CSS keyframe animation to gently scale from 1.0 to 1.1, signaling active AI background processing.

### Data Visualization
Charts should use "Rounded" line joins. Use Primary Red for the main data trend, and Neutral Grays for benchmarks. All tooltips must be glassmorphic.