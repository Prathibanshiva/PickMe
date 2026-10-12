---
name: Kinetic Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#3d4b37'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#6d7b65'
  outline-variant: '#bccbb2'
  surface-tint: '#0d6e00'
  primary: '#0d6e00'
  on-primary: '#ffffff'
  primary-container: '#1fc600'
  on-primary-container: '#064b00'
  inverse-primary: '#48e32e'
  secondary: '#046e00'
  on-secondary: '#ffffff'
  secondary-container: '#0ef900'
  on-secondary-container: '#046d00'
  tertiary: '#5c5f60'
  on-tertiary: '#ffffff'
  tertiary-container: '#a9abac'
  on-tertiary-container: '#3d4041'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#78ff5c'
  primary-fixed-dim: '#48e32e'
  on-primary-fixed: '#012200'
  on-primary-fixed-variant: '#085300'
  secondary-fixed: '#77ff60'
  secondary-fixed-dim: '#0de600'
  on-secondary-fixed: '#012200'
  on-secondary-fixed-variant: '#035300'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  fare-display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 20px
  stack-gap: 16px
  section-gap: 32px
  gutter: 12px
---

## Brand & Style

The design system is built for a high-velocity, premium ride-sharing experience. It balances the urgency of transit with a sophisticated, AI-driven aesthetic. The style is **Modern Minimalism** with **Tactile** accents, focusing on extreme clarity, speed of cognition, and a polished finish that separates it from budget competitors. 

The visual narrative prioritizes high-contrast "moments of action" against a spacious, serene background. Whitespace is used as a functional tool to reduce cognitive load during time-sensitive tasks like booking or tracking a ride. The result is an interface that feels reliable, technologically advanced, and effortless.

## Colors

This design system utilizes a high-chroma green palette to signify "go," "action," and "availability." 

- **Primary Brand Color (#1FC600):** Used for primary CTAs, active vehicle markers on maps, and critical success states.
- **Secondary Accent (#0EFF00):** Reserved for micro-interactions, high-light pips, and AI-driven suggestions to create a "glowing" tech-forward feel.
- **Surface Strategy:** Backgrounds remain pure white (#FFFFFF) for maximum legibility. A secondary neutral (#F9FAFB) is used for container backgrounds to create subtle separation without adding visual weight.
- **Indicators:** High-demand and surge pricing use vibrant gradients. These are the only multi-color elements in the UI, ensuring they immediately grab the user's attention.

## Typography

The system uses **Inter** exclusively to maintain a clean, systematic look. 

- **Hierarchy:** Use heavy weights (Bold/ExtraBold) for fares, headings, and vehicle types to ensure information is scannable at a glance.
- **Fares:** Pricing elements use `fare-display` to stand out as the primary data point in the booking flow.
- **Labels:** Small caps with increased letter spacing are used for secondary metadata (e.g., "ETA", "DISTANCE") to create a refined, technical aesthetic.
- **Contrast:** Always use high-contrast pairings (Black on White) for core trip details.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile-first interactions. 

- **Margins:** A standard 20px margin is applied to the screen edges to provide breathing room.
- **Touch Targets:** All interactive elements must maintain a minimum height of 48px.
- **Vertical Rhythm:** A strict 4px baseline grid is used. Elements are typically separated by 16px (stacking) or 32px (logical sections).
- **Sheet Architecture:** Information is organized into "Bottom Sheets" for mobile, allowing users to interact with the map while managing ride details.

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Subtle Ambient Occlusion**.

- **Level 0:** Pure white background (#FFFFFF).
- **Level 1:** Soft containers using #F9FAFB or a 1px border (#E5E7EB) to define boundaries.
- **Level 2 (Active Cards):** High-interaction cards (like the selected ride type) use a very soft, diffused shadow (0px 10px 30px rgba(0,0,0,0.04)) and a 2px primary color border.
- **Dividers:** Use 1px thin lines in #F3F4F6 for internal list separation.

## Shapes

The shape language is defined by **Large, Friendly Radii**. 

- **Standard Containers:** Use a 16px radius for cards and input fields.
- **Primary CTAs:** Use 16px or fully pill-shaped (rounded-full) corners depending on the button width.
- **Ride Selection Cards:** Use 24px radius for a distinct, premium "pod" look.
- **Visual Continuity:** Icons should follow the same rounded terminal logic to match the UI elements.

## Components

- **Buttons:** Primary buttons are high-contrast (Black background with White text or Primary Green with Black text). Use a slight "bounce" scale animation on tap (0.98x).
- **Ride Cards:** Large 24px rounded containers. The selected state should have a 2px stroke of #1FC600 and a subtle background tint.
- **Inputs:** Clean, 16px rounded rectangles with #F9FAFB background. Focused state adds a 1px #1FC600 border.
- **Chips:** Used for quick-select filters (e.g., "Personal", "Business"). Use 12px padding and pill-shaped corners.
- **Progress Bars:** For ETA and trip progress, use the Primary Green against a light gray track.
- **Status Badges:** Gradient-filled capsules for "Surge" or "High Demand" using white text for maximum legibility.
- **Map Markers:** Custom pin design using the Primary Green with a white core for the vehicle position, and a Secondary Accent halo for AI-predicted pickup spots.