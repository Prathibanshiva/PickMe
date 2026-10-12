---
name: Kinetic Ops Control
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
  on-surface-variant: '#404a3b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707a69'
  outline-variant: '#bfcab7'
  surface-tint: '#0d6e00'
  primary: '#085300'
  on-primary: '#ffffff'
  primary-container: '#0d6e00'
  on-primary-container: '#91ee79'
  inverse-primary: '#80dc69'
  secondary: '#0d6e00'
  on-secondary: '#ffffff'
  secondary-container: '#64fe48'
  on-secondary-container: '#0e7300'
  tertiary: '#404658'
  on-tertiary: '#ffffff'
  tertiary-container: '#575e71'
  on-tertiary-container: '#d1d8ee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9bf982'
  primary-fixed-dim: '#80dc69'
  on-primary-fixed: '#012200'
  on-primary-fixed-variant: '#085300'
  secondary-fixed: '#78ff5c'
  secondary-fixed-dim: '#48e32e'
  on-secondary-fixed: '#012200'
  on-secondary-fixed-variant: '#085300'
  tertiary-fixed: '#dce2f9'
  tertiary-fixed-dim: '#bfc6dc'
  on-tertiary-fixed: '#141b2b'
  on-tertiary-fixed-variant: '#404758'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-stat:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-performance command-and-control visual language tailored for high-frequency shared mobility dispatch, AI occupancy balancing, and multi-city operations across India. 

### Brand Personality & Philosophy
- **High-Velocity Kinetic Precision:** UI elements communicate instantaneous movement, real-time recalculation, and mechanical reliability. Every telemetry indicator, occupancy bar, and route health marker prioritizes zero-lag decision making.
- **Occupancy-First Clarity:** Visual weight prioritizes shared-load density (seat-fill efficiency, dynamically pooled corridors, and deadhead mitigation) over vanity metrics.
- **Pragmatic Resilience:** Crafted specifically for dispatch operators, fleet managers, and tier-1 support engineers managing chaotic physical road environments in high-density Indian metros (Bengaluru, Mumbai, Delhi-NCR, Hyderabad).

### Design Style: Modern Utility & Kinetic Precision
The aesthetic blends **Modern Operational SaaS** with high-contrast tactical data visualizations:
- Crisp white surface cards anchor against an ultra-pale cool canvas to reduce prolonged screen fatigue.
- Deep Forest Green grounds authority and core corporate states, balanced by an Electric Kinetic Green for vital forward actions, active dispatch states, and algorithmic optimization events.
- Monospaced numerical balance paired with geometric sans-serif type ensures scanning speed across dense tables, fleet heatmaps, and telemetry feeds.

## Colors

The palette balances executive control with real-time field urgency. Color is deployed systematically: green represents system health and kinetic routing, deep slate governs spatial scaffolding, while specific operational states trigger immediate optical focus.

### Primary & Action Colors
- **Primary Brand (`#0D6E00` - Deep Forest Green):** Anchors top-level navigation, primary buttons, confirmed fleet pools, verified driver badges, and high-occupancy thresholds (85%+ fill rate).
- **Secondary Action (`#1FC600` - Electric Kinetic Green):** Used for dynamic live indicators, active GPS tracking pings, primary interactive focus accents, AI route re-allocation buttons, and real-time live pulse dots.
- **Tertiary Surface & Data Slate (`#141B2B` - Deep Slate Black):** The definitive ground for primary text, top metric numerals, column headers, and dark tactical map drawer controls.

### Operational Feedback & State Semantics
- **Success / Optimal (`#0D6E00` base / `#16A34A` bright):** High vehicle occupancy, corridor clearance, route optimized, on-time arrivals.
- **Warning / Review / Surge (`#D97706` / `#F59E0B`):** Driver verification pending, vehicle idle > 15 mins, traffic bottleneck detected, capacity threshold < 40%.
- **Critical / Destructive (`#BA1A1A` / `#DC2626`):** SOS emergency triggers, route deviations > 2.5km, vehicle immobilization, breakdown escalations, payment capture failures.
- **Neutral / Offline (`#64748B`):** Off-duty vehicles, unassigned inventory, archived trip logs.

### Application Rules
- Never use the Electric Kinetic Green (`#1FC600`) as plain body text over light backgrounds; it is strictly an active indicator, icon accent, pill fill, or illuminated border.
- All monetary metrics (₹ INR) leverage `#141B2B` in bold weights with `#64748B` denomination notations to prevent visual noise.

## Typography

The type system is engineered around **Inter** to ensure maximum optical clarity across massive operational tables, status badges, and rapid-scan telemetry dashboards.

### Numerical Data Alignment
- All data tables, seat occupancy counts, speed metrics (km/h), trip fares (`₹`), and Indian mobile numbers (`+91 XXXXX XXXXX`) must enforce tabular lining figures (`font-variant-numeric: tabular-nums`). This guarantees rigid vertical column alignment across thousands of real-time rows.
- Currency symbols (`₹`) must be set with a 500 or 600 weight alongside bold numeric values to preserve scanning distinction.

### Hierarchy & Scale
- `numeric-stat` is reserved for critical dashboard overview widgets: **Active Fleets**, **Avg Vehicle Occupancy (%)**, **Live Pooling Efficiency**, and **Gross Ride Bookings**.
- `label-sm` is strictly styled in uppercase with positive letter spacing (`0.04em`) for table headers, metadata tags, vehicle registration categories (e.g., `KA-01-EQ-9481`), and corridor zone identifiers.

## Layout & Spacing

The control center implements an 8px base rhythm designed for high-density information intake without ocular clutter.

### Layout Philosophy: Fluid Multi-Pane Workspaces
- **Primary Grid:** 12-column fluid grid system across desktop viewports with a 20px (`1.25rem`) gutter and 24px (`1.5rem`) lateral padding.
- **Console Shell Model:** 
  - **Left Rail (Global Nav):** Collapsible vertical navigation anchored at 260px expanded / 72px iconified.
  - **Main Canvas:** Dynamic workspace adapting between full data tables and split-screen operational views (50% table/telemetry list, 50% interactive vector map).
  - **Right Flyout Inspector:** 420px contextual drawer for drill-down driver verification, occupancy breakdown, and trip route replay.

### Responsive Breakpoints & Adaptations
- **Desktop (>1440px):** Simultaneous triple-pane view (Nav + Active Data Grid + Real-time Telemetry Map).
- **Compact Desktop / Laptop (1024px – 1439px):** Split-view with toggleable inspection drawer overlay.
- **Tablet & Mobile Admin (<1023px):** Bottom-sheet drawer pattern for vehicle tracking. Complex data tables degrade to card-based list items highlighting primary vehicle plate, driver photo, route corridor, and occupancy pills.

## Elevation & Depth

This design system avoids heavy shadows, instead using crisp structural outlines paired with micro-diffused ambient lifts to prioritize visual accuracy under intense control room lighting.

### Tonal Hierarchy
- **Canvas Base:** `#F9F9FF` (Cool crisp operations tint).
- **Surface Level 1 (Cards, KPI blocks, Tables):** `#FFFFFF` paired with an exact 1px structural outline of `#E2E8F0`.
- **Surface Level 2 (Floating Toolbar, Quick Filters, Overlays):** `#FFFFFF` with `box-shadow: 0 4px 16px -2px rgba(20, 27, 43, 0.06), 0 2px 6px -1px rgba(20, 27, 43, 0.04)`.
- **Surface Level 3 (Modal, Escalation Trays, Indian Metro Heatmap Tooltips):** `#FFFFFF` with `box-shadow: 0 12px 32px -4px rgba(20, 27, 43, 0.12), 0 4px 12px -2px rgba(20, 27, 43, 0.06)` and a 1px border of `#CBD5E1`.

### Active Kinetic Accents
Real-time items (such as a live SOS alert or a rerouted pooled shuttle) do not rely on elevation alone; they utilize a glowing status ring: `box-shadow: 0 0 0 3px rgba(31, 198, 0, 0.25)` or `box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25)`.

## Shapes

The shape hierarchy establishes clear contrast between high-density container surfaces and ergonomic interactive controls:

### Geometry Tokens
- **Cards & Data Containers:** Rounded with 12px (`0.75rem`) to 16px (`1.0rem`) radius to maintain clean division against the pale background.
- **Interactive Controls (Inputs, Buttons, Segment Switches):** Styled with an 8px (`0.5rem`) radius, providing a crisp, responsive feel.
- **Status Pills & Telemetry Badges:** Fully rounded capsule/pill shapes (`9999px`) to instantly differentiate status flags and occupancy slots from regular input fields and data boxes.

## Components

### Buttons
- **Primary Action (Brand):** `#0D6E00` background, pure white text, 8px border radius, font-weight 600. On hover: shifts to `#0A5700`. Active state utilizes a subtle 0.98 scale transform.
- **Kinetic Accent Action:** High-priority dispatch trigger (e.g., "Re-balance Corridors"). Background `#1FC600`, text `#141B2B`, 8px radius. Hover: `#1AB000`.
- **Destructive Action:** `#DC2626` background, white text, for driver deactivation or trip cancellation.
- **Ghost/Tertiary:** Transparent background, `#141B2B` text, 1px border `#E2E8F0`, hover background `#F1F5F9`.

### Chips & Status Pills
- **Occupancy Indicator Chip:** Segmented visual pill displaying current/max seats (e.g., `● 5/7 Seats`). Background `#E8F8E5`, text `#0D6E00`, with filled micro-dots indicating physical occupied seats.
- **Status Pills:** Pill geometry with 11px uppercase label and 6px status dot.
  - *Active Route / Live:* Green dot with subtle CSS pulse animation, background `#DCFCE7`, text `#166534`.
  - *In Review / Verification:* Yellow dot, background `#FEF3C7`, text `#92400E`.
  - *Critical SOS / Off Route:* Red dot, background `#FEE2E2`, text `#991B1B`.

### Data Tables
- **Header:** Sticky headers, background `#F8FAFC`, uppercase `#64748B` typography (`label-sm`), 1px bottom border `#CBD5E1`.
- **Row Styling:** Row height fixed at 52px for high data scan-rate. Alternating hover state `#F8FAFC`. Selected row highlighted with 2px solid `#1FC600` left border indicator.
- **Cell Alignment:** Text aligned left; occupancy bars, Indian currency values (`₹`), and dates aligned right.

### Input Fields & Search Bars
- **Global Corridor / Vehicle Search:** Height 40px, 8px radius, border 1px solid `#CBD5E1`, background `#FFFFFF`. Active focus ring: `border-color: #0D6E00` with `outline: 2px solid rgba(13, 110, 0, 0.2)`. Prefix contains region selector (`BLR`, `MUM`, `DEL`, `HYD`).

### Occupancy Visualizer (Specialized Component)
- Custom horizontal multi-seat bar component embedded directly inside fleet rows. Represents seat allocations:
  - *Green segment:* Boarded passenger.
  - *Blue/Teal segment:* Booked for upcoming pickup along the dynamic route.
  - *Light Slate:* Empty available seat for real-time algorithmic pooling.