# Multica Console — Design System Reference

> Extracted from Multica.ai marketing site and app patterns, 2026-05-30

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background Primary | `#0f0f1a` | Main page background |
| Background Secondary | `#1a1a2e` | Cards, panels, forms |
| Background Sidebar | `#12122a` | Navigation sidebar |
| Text Primary | `#ffffff` | Headlines, main text |
| Text Secondary | `#aaa` / `#aaaaaa` | Descriptive text, labels |
| Text Muted | `#888` / `#888888` | Secondary labels, timestamps |
| Accent Green | `#4dc8a2` | Primary buttons, active states, status dots (running) |
| Accent Green Dark | `#3a8a72` | Hover states for green |
| Border | `#2a2a4a` | Card borders, input borders, dividers |
| Input Background | `#16213e` | Form inputs, text areas |
| Error Red | `#e05555` | Error text, blocked status |
| Warning Amber | `#c89b4d` | In-review status, warnings |
| Disabled Gray | `#555555` | Disabled states, empty dots |

## Typography

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 1.75rem (28px) | 600 | Page titles |
| H2 | 1.5rem (24px) | 600 | Section headers |
| H3 | 1.1rem (17.6px) | 600 | Panel titles, card headers |
| Body | 1rem (16px) | 400 | Primary content |
| Small | 0.875rem (14px) | 400 | Labels, descriptions |
| Caption | 0.8rem (12.8px) | 400 | Timestamps, metadata |
| Micro | 0.75rem (12px) | 400 | Badges, tags |

Font family: System UI stack — `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 0.25rem (4px) | Icon gaps |
| sm | 0.5rem (8px) | Inline spacing, badge padding |
| md | 0.75rem (12px) | List item gaps, button padding |
| lg | 1rem (16px) | Card padding, section gaps |
| xl | 1.5rem (24px) | Section margins |
| 2xl | 2rem (32px) | Page padding, large gaps |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Status badges |
| md | 6px | Buttons, nav links, small elements |
| lg | 8px | Inputs, small cards |
| xl | 10px | Dashboard cards |
| 2xl | 12px | Form containers, panels |

## Shadows

- None (flat design, dark theme with borders instead of shadows)

## Component Patterns

### Buttons
- Primary: Green background (`#4dc8a2`), dark text (`#0f0f1a`)
- Default: Dark background (`#1a1a2e`), light text (`#aaa`)
- Border: 1px solid `#2a2a4a`
- Hover: Slightly lighter/darker shade
- Disabled: Grayed out with reduced opacity
- Height: 36-40px, padding: 0.5rem 0.75rem

### Cards
- Background: `#1a1a2e`
- Border: 1px solid `#2a2a4a`
- Border radius: 10px
- Padding: 1.25rem
- No shadow

### Navigation
- Sidebar width: 220px
- Sidebar background: `#12122a`
- Nav link padding: 0.5rem 0.75rem
- Nav link radius: 6px
- Active nav: Green text or background highlight

### Tables
- Border-collapse: collapse
- Row border: 1px solid `#2a2a4a`
- Header: Muted text (`#888`), smaller font
- Cell padding: 0.5rem

### Status Indicators
- Green dot: `#4dc8a2` — running / connected / success
- Amber dot: `#c89b4d` — in review / pending
- Red dot: `#e05555` — blocked / error / disconnected
- Gray dot: `#888` / `#555` — available / disabled / empty

### Forms
- Input background: `#16213e`
- Input border: 1px solid `#2a2a4a`
- Input border radius: 8px
- Input padding: 0.75rem
- Label color: `#aaa`

## Design Principles
1. Dark-first — designed for dark mode
2. Dense but readable — engineering dashboards, not marketing pages
3. Border separation over shadows — flat, clean
4. Green accent sparingly — 10-15% of visible color
5. Status as color — immediate visual understanding
6. Whitespace for hierarchy — more space = more important
