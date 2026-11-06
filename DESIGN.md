# JustNaik Places Manager Design

The visual and interaction design for the client. `SPEC.md` covers behaviour and `DESIGN.md` covers look and feel. Where the two conflict, the [Spec changes](#spec-changes) section lists the updates `SPEC.md` needs.

## Principles

1. **Solid, not floating.** The app is a fixed frame: the rail, the column and the toolbar. The map sits inside it as an inset window. Only the popup, the menus, the dialogs and the toasts float, and only they get shadows.
2. **The map is part of the design.** Vector tiles are drawn with our own style and colours, never raster tiles with CSS filters.
3. **Built for touch.** Every tap target is at least 44px, and the same layout adapts down to a phone.
4. **The layout never moves.** Space for errors, mode changes and loading states is reserved in advance, so content doesn't jump.
5. **One accent colour.** Red marks only the selected place, the primary action and destructive confirmation.
6. **Instrument details.** Coordinates use a monospace font with aligned digits, plus a live cursor readout, a scale bar and keyboard hints.

## Tokens

Define these once as CSS variables in `client/src/index.css` and map Kumo's theme tokens onto them. Don't override Kumo with `!important`.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--chrome` | `#f3efe7` | App frame background: column, toolbar, bottom sheet |
| `--field` | `#fffdf9` | Cards, popups, menus, dialogs, toasts |
| `--land` | `#ece6d9` | Map land; map background before tiles load |
| `--ink` | `#1f1c18` | Main text, rail, mobile tab bar, pins |
| `--ink-2` | `#6b645a` | Secondary text: labels, coordinates, meta |
| `--ink-3` | `#9a9285` | Placeholders and decorative icons only. Not for text people need to read (fails AA). |
| `--rule` | `#dcd4c6` | Borders, dividers |
| `--rule-2` | `#e8e2d6` | Subtle fills, the ring around the map frame |
| `--hover` | `#ebe5da` | Hover backgrounds |
| `--accent` | `#b23a26` | Selected place, primary button, destructive action, focus ring |
| `--accent-ink` | `#8f2c1b` | Accent hover and pressed states, accent border |
| `--accent-wash` | `#f2e2da` | Selected row, icon button background |

Text must pass WCAG AA (4.5:1) on `--chrome` and `--field`, which means using `--ink` or `--ink-2`.

### Type

- **Fonts:** IBM Plex Sans for the UI and IBM Plex Mono for numbers, coordinates and small caps labels. Load both from Google Fonts with weights 400, 500 and 600.

| Role | Style |
| --- | --- |
| Page title | Sans 22/28, weight 600, tracking −0.01em |
| Section or popup title | Sans 16/22, weight 600 |
| Body | Sans 15/22, weight 400 |
| Small and meta | Sans 13/18 or 12.5/18 |
| Caps label | Mono 11.5/16, uppercase, tracking 0.08em, `--ink-2` |
| Coordinates | Mono with `font-variant-numeric: tabular-nums` |
| Inputs | 16px, so iOS doesn't zoom on focus |

### Size and spacing

- **Spacing:** on a 4px grid. Common values are 4, 8, 10, 12, 16 and 20.
- **Tap targets:** at least 44px (`--tap`) for buttons, inputs, rail items, icon buttons and popup actions.
- **List rows:** 60px (`--row`).
- **Radius:** 6px for controls, 10px for cards, rows, popups and menus, 14px for the map frame (16px on mobile).
- **Shadows:**
  - Floating surfaces use `0 8px 24px rgb(40 30 20 / .18)`.
  - Nothing else has a shadow, except the map frame's ring and inner shadow.

### Coordinates and dates

- **Coordinates:**
  - format is `3.1573° N  101.7122° E` (two spaces between the halves);
  - 4 decimal places in the list, 5 in the popup, 6 in the cursor readout and the form inputs;
  - inputs hold plain decimal numbers.
- **Relative time:** `Just now`, `5m ago`, `3h ago`, `Yesterday`, `2 days ago` (up to 6 days), then a date such as `12 Mar`. Show the year when it isn't the current year.

## Layout

### Desktop (≥ 761px)

```text
┌──────┬────────────────────┬──────────────────────────────────────┐
│ rail │ column             │ toolbar                              │
│ 68px │ 400px              │ ┌──────────────────────────────────┐ │
│      │                    │ │ map frame (inset window)         │ │
│      │                    │ └──────────────────────────────────┘ │
└──────┴────────────────────┴──────────────────────────────────────┘
```

- **Rail:**
  - `--ink` background and full height;
  - from the top: the mark, Map, Upload, a spacer, Log out, and the avatar (a 36px square with an initial, the email in its tooltip);
  - the active item has a lighter background;
  - this replaces the spec's sidebar.
- **Column:** on `--chrome` with no border. Its contents depend on the page.
- **Pane:** a 68px toolbar on top, then the map frame. The pane has 14px padding on the right and bottom and 4px on the left.
- **Map frame:**
  - 1px border in `#c9bfae` with radius 14px;
  - an outer ring (`0 0 0 4px var(--rule-2)`) and an inner shadow (`inset 0 1px 3px rgb(40 30 20 / .14)`);
  - `overflow: hidden`;
  - this is the inset window that makes the map feel immersive.

### Tablet (761–1023px)

The same as desktop, but the column is 340px wide and the cursor readout is hidden.

### Mobile (≤ 760px)

```text
┌──────────────────────────────┐
│ map frame (8px inset)        │  ← floating map buttons at top
│                              │
├──────────────────────────────┤
│ ══ bottom sheet              │  ← column contents
├──────────────────────────────┤
│  Map    Upload    Log out    │  ← tab bar, 64px
└──────────────────────────────┘
```

- **Tab bar:** replaces the rail, with the same `--ink` background. Each tab shows an icon with its label underneath. Respect `env(safe-area-inset-bottom)`.
- **Map frame:** 8px inset from the screen edges, radius 16px. The toolbar becomes floating buttons over the top of the map (Fit all, zoom). The page title and readout are hidden.
- **Bottom sheet:**
  - holds what the column holds on desktop;
  - drag the handle between three heights: collapsed (handle and header, about 120px), half (46vh) and full (82vh);
  - tapping the handle cycles through them;
  - selecting a place collapses it to half, and editing opens it to full;
  - the map resizes to fit.
- **Adding a place:**
  - a fixed crosshair sits in the centre of the map;
  - the user pans the map under it and taps **Add here**, a primary button floating at the bottom-centre of the map frame;
  - this sets lat/lng to the map centre and opens the sheet to full height on the form;
  - the composer's mode hint reads `or pan and tap Add here`, or `pan and tap Add here to move` in edit mode;
  - tapping the map doesn't place pins on mobile, because that clashes with panning.
- **Other pages:**
  - Upload uses the same layout, with the column contents in the sheet.
  - Login and register have no tab bar (see their section).

## Pages

### Map (`/map`)

Column, from top to bottom:

1. **Header** (68px): "Places" with a count badge, and an **Import** button that goes to `/upload`.
2. **Composer:** the add/edit form card, a fixed 282px tall. See [Composer](#composer).
3. **Search:** 52px tall, with a filter input and a `/` key hint. It matches names and icon category names.
4. **Category filters:** a row of chips that scrolls sideways: `All 7`, `Shopping 2`, `Landmark 2`, … Only categories in use appear, each with its count. One can be selected at a time, and it combines with the search.
5. **List:** scrolls, newest first. See [List row](#list-row).

Map pane:

- **Toolbar:** the area name (static "Kuala Lumpur" is fine), the zoom level (`z12`), the cursor readout, **Fit all**, and a −/+ zoom control.
- **Map:**
  - pins and clusters;
  - a scale bar (metric, bottom left) and attribution (bottom right);
  - a crosshair cursor while hovering;
  - a ZIP dropped anywhere on the frame uploads, with an overlay saying "Drop to import".

Initial view: fit to all pins, or KL at zoom 11 when there are none (as in the spec).

### Upload (`/upload`)

- **Column:**
  - the header "Import";
  - a large drop zone (at least 160px) with a **Choose file** button;
  - the file format help (the sample block and the rules from the spec), collapsible;
  - the result of the last upload.
- **Map frame:** shows the user's places.
  - **On success:**
    - the imported pins drop in, one after another (30ms apart, up to 1s in total);
    - the map fits to them;
    - the column result shows "Added 7 places from locations.zip" with a short list of what was added.
  - **On error:** the column result is an error card in `--accent` with the reason, plus the line-numbered details in mono (`Line 3: latitude 300 is out of range (−90 to 90)`), up to 5 lines.
- **Spec requirements still apply:** the success and error toasts last 3 seconds, and the success toast has a **View on map** button.

### Login and register (`/login`, `/register`)

- **No rail.** The column holds:
  - the mark and "JustNaik Places Manager";
  - the form: email, password with a show/hide toggle, and the submit button;
  - the link to switch between login and register.
- **Map frame:**
  - shows KL with 5–7 decorative pins, non-interactive;
  - pans slowly (about 60s per loop);
  - stays still when reduced motion is on.
- **Mobile:** the frame takes the top 35vh and the form sits below it.
- **Autocomplete attributes:** `email` and `current-password`, or `new-password` on register.

## Components

### Composer

- **Structure:**
  - a card (`--field`, 1px `--rule` border, radius 10px), fixed height so modes and errors never move the list;
  - a 3-column grid: `44px 1fr 1fr`.
- **Rows:**
  1. **Mode label:** `NEW PLACE` with the hint `or click the map`, or `EDITING · <name>` (name in accent) with `click the map to move`.
  2. **Icon button and name:** the 44px icon button sits beside the Name input.
  3. **Coordinates:** Latitude spans columns 1–2 and Longitude takes column 3.
  4. **Error line:** 18px reserved; `--accent`, 13px. Errors come from the shared zod schemas, and the invalid input gets an accent border.
  5. **Actions:** the full-width primary button **Add place** (`+` icon), or **Save** (check icon) with **Cancel** in edit mode.
- **Clicking the map (desktop):**
  - fills lat/lng to 6 decimal places;
  - shows a preview pin;
  - focuses Name.
- **Enter** submits.

### Icon picker

- **The 44px icon button:**
  - shows the current icon on `--accent-wash`;
  - shows a small `AUTO` badge while the icon is a suggestion.
- **Opening it** shows a menu with a 4×3 grid of 44px buttons. The category name appears on hover, and `Esc` closes it.
- **Suggestions** update as the name is typed, until the user picks an icon themselves.
- **Defaults:** a new place starts as `pin`, and edit mode loads the saved icon.

### List row

- **Layout:** 60px tall, radius 10px, grid `40px 1fr auto`.
- **Contents:**
  - a 40px icon tile (radius 9px, `--rule-2` background, regular-weight icon);
  - the name (500, one line, ellipsis) with the coordinates below (mono 12.5px, `--ink-2`);
  - the relative time on the right.
- **States:**
  - Hover: `--hover` background, and the matching pin grows and shows its label.
  - Selected: `--accent-wash` background, and the tile turns `--accent` with a filled white icon.
  - Newly added: flashes once (900ms).
- **Click or Enter:** selects the place, flies the map to it and opens its popup.

### Pins

- **Shape:** a teardrop 34×44, anchored at the tip, filled `--ink` with a 1.5px white outline and a drop shadow. The place's filled Phosphor icon sits inside, white, at 17px.
- **States:**
  - Hover: scale 1.08 and a name label (an `--ink` tag to the right).
  - Selected: `--accent` fill, scale 1.15, the label, and drawn above other pins.
  - Preview: translucent white fill with a dashed `--accent` outline and the composer's current icon in accent.
  - New: drops in 12px from above over 170ms.
- **Clusters:**
  - use `leaflet.markercluster`;
  - a 40px `--ink` circle with a white border showing the count in mono, or the shared icon when every place in it has the same icon;
  - clicking one zooms to its pins.

### Popup

- **Surface:** `--field`, 1px `--rule` border, radius 10px, 280px wide. No close button; clicking the map closes it.
- **Top:** a 40px accent icon tile, the name (16/600), coordinates (mono, 5 dp), and meta (`Shopping · added yesterday`).
- **Actions:** a row of three 44px buttons divided by rules: **Edit**, **Copy** (copies `lat, lng` and shows "Copied" for 1.2s), and **Delete** in accent.
- **Delete** opens a confirmation dialog (required by the spec):
  - title "Delete place?";
  - body "**<name>** will be removed from your map.";
  - buttons **Cancel**, and **Delete** filled in accent.
- **Dialog styling:** same surface as the popup, radius 10px, with a `rgb(31 28 24 / .35)` backdrop.

### Buttons

| Variant | Style |
| --- | --- |
| Primary | `--accent` fill, `--accent-ink` border, white text, `inset 0 -2px 0 rgb(0 0 0 / .16)` bottom edge |
| Secondary | `--field` fill, `--rule` border |
| Quiet | Transparent, `--ink-2` text, `--hover` background on hover |

- **Height:** 44px, radius 6px, weight 500, with an optional 18px icon.
- **Pressed:** moves down 1px; primary swaps to an inset top shadow.
- **Loading:** a spinner replaces the icon, the label stays, and the button is disabled at the same width.

### Toasts

- **Surface:** same as the popup, with a 3px left bar: `--accent` for errors, `--ink` for success. A title, an optional line of detail, and an optional action button.
- **Position:**
  - desktop: bottom-centre of the map frame, 16px from its bottom edge;
  - mobile: top of the map frame, below the floating buttons, full width minus 16px.
- **Duration:** 3s for upload results, as the spec requires. Announced through an `aria-live` region (Kumo's Toast handles this).

### Loading and empty states

- **Loading the list:** 6 placeholder rows matching the real 60px rows, with a gentle pulse.
- **Loading the map:** the frame shows `--land` until the tiles arrive. No spinner over the map.
- **Locations failed to load:** an error card in the column with **Retry**. The map stays visible.
- **No places:**
  - the list says "No places yet";
  - a centred card in the map frame says "Click anywhere to drop your first place, or import a file", or "Pan to a spot and tap Add here" on mobile;
  - the card links to `/upload`.
- **No search or filter matches:** `No places match "<query>".`

## Map style

- **Rendering:** Leaflet and react-leaflet (required by the brief) with `@maplibre/maplibre-gl-leaflet`. It draws OpenFreeMap vector tiles (`https://tiles.openfreemap.org/planet`, OpenMapTiles schema) with our own style. Leaflet's own image tiles can only be recoloured with CSS filters; the vector tiles let us colour the map with our tokens.
- **Code location:** `client/src/features/locations/map-style.ts`.
- **Loading:** load `maplibre-gl` (about 800 KB) lazily, so it doesn't delay the first screen. On the login and register pages, the form renders first and the map loads after it.
- **No fallback basemap.**
- **Attribution:** `OpenFreeMap © OpenMapTiles © OpenStreetMap`.
- **Glyphs:** `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`.
- **Labels:** text is `coalesce(name:latin, name)`.
- **Road widths:** exponential interpolation (base 1.5) from z8 to z17. Draw layers in the order of the table.

| Layer (source layer, filter) | Paint |
| --- | --- |
| Background | `#ece6d9` |
| `landcover`, class wood/grass/forest | fill `#dfe1c8`, opacity 0.7 |
| `park` | fill `#dfe1c8` |
| `water` | fill `#c3d1d1` |
| `waterway` | line `#c3d1d1`, width 1.2 |
| `building`, z14+ | fill `#e2dacb`, outline `#d3c9b6` |
| `transportation`, class rail/transit | line `#c4baa9`, width 1, dash `[3, 2]` |
| `transportation`, class minor/service/tertiary, z12+ | line `#fbf8f1`, width 0.3 → 7, round caps and joins |
| `transportation`, class primary/secondary/trunk (casing) | line `#cfc4af`, width 1 → 13 |
| `transportation`, class primary/secondary/trunk | line `#ffffff`, width 0.6 → 11, round caps and joins |
| `transportation`, class motorway (casing) | line `#c7b393`, width 1.4 → 15 |
| `transportation`, class motorway | line `#f0dfc6`, width 0.9 → 13, round caps and joins |
| `boundary`, admin_level ≤ 4 | line `#b3a894`, width 1, dash `[4, 2]` |
| `transportation_name`, z14+ | Noto Sans Regular 11 along the line, `#8a8174`, halo `#fbf8f1` 1.5 |
| `place`, class neighbourhood/quarter/suburb, z12+ | Noto Sans Regular 11, uppercase, letter-spacing 0.12, max width 8, `#8a8174`, halo `#ece6d9` 1.5 |
| `place`, class town/village | Noto Sans Regular 12.5, `#5b544b`, halo `#ece6d9` 1.5 |
| `place`, class city | Noto Sans Bold 15, `#2c2722`, halo `#ece6d9` 2 |

## Icons

- **UI icons:** Phosphor (`@phosphor-icons/react`), regular weight. Pins and selected tiles use the fill weight.
- **Place icons:**

| Key | Phosphor | Label | Suggested when the name matches (case-insensitive) |
| --- | --- | --- | --- |
| `pin` | MapPin | Place | default |
| `home` | House | Home | home, house, rumah |
| `work` | Briefcase | Work | office, work, pejabat |
| `food` | ForkKnife | Food | restaurant, food, mamak, nasi, kedai, hawker, eat |
| `cafe` | Coffee | Café | cafe, café, coffee, kopi |
| `shop` | ShoppingBag | Shopping | mall, klcc, pavilion, plaza, market, pasar, shop, store |
| `park` | Tree | Park | park, taman, garden, botani |
| `nature` | Mountains | Nature | cave, bukit, hill, gunung, falls, lake, tasik, beach, pantai |
| `animals` | PawPrint | Animals | zoo, aquari, bird park, farm |
| `temple` | FlowerLotus | Temple | temple, kuil, tokong, wat, church, gereja |
| `mosque` | Mosque | Mosque | masjid, mosque |
| `landmark` | Buildings | Landmark | menara, tower, square, dataran, merdeka, museum, monument, istana, palace, station |

- **Matching:**
  - rules are checked in this order: animals, mosque, temple, shop, cafe, food, park, nature, landmark, home, work, and the first match wins;
  - a keyword must match at the start of a word, so `aquari` matches "Aquaria KLCC";
  - `wat` and `eat` must match a whole word, so "Water Park" and "Great Eastern" don't match them;
  - no match gives `pin`.
- **Shared code:** the rules live in `packages/shared` as `suggestIcon(name)`, used by both the composer and the upload handler.

## Motion

| What | Duration | Easing |
| --- | --- | --- |
| Hover and colour changes | 120ms | ease |
| Button press | 60ms | ease |
| Pin drop | 170ms | `cubic-bezier(.2,.7,.3,1)` |
| Fly to a place | 600ms | Leaflet `flyTo` |
| Row flash | 900ms | ease-out |
| Sheet snap | 200ms | ease-out |

- **No bounce or springs.**
- **Reduced motion:**
  - no drops or flashes;
  - the login map doesn't pan;
  - `setView` replaces `flyTo`.

## Keyboard and accessibility

- **Shortcuts:**
  - `/` focuses search.
  - `Enter` saves the composer.
  - `↑`/`↓` move through the list, and `Enter` selects.
  - `Esc` closes the icon menu, then cancels editing, then clears the preview pin, then deselects.
- **Focus ring:** 2px `--accent` outline with a 2px offset, on every interactive element.
- **Labels:** icon-only buttons have `aria-label`. List rows are focusable buttons. The cursor readout is `aria-hidden`.
- **Contrast:** text uses `--ink` or `--ink-2`; see [Colour](#colour).

## Naming

- **Product name:** "JustNaik Places Manager", used in the `<title>`, the login and register column, and the README.
- **Rail:** shows only the mark: a 26px rounded square outline in `--chrome`, split into quarters by thin `--ink-2` lines, with an `--accent` dot in the top-right quarter.
- **Favicon:** the same mark.

## Spec changes

`SPEC.md` needs these updates when this design is built:

- **Name:** JustNaik Places Manager.
- **Navigation:**
  - on desktop, the sidebar is a 68px icon rail;
  - on mobile, it's a bottom tab bar, not a sidebar that collapses.
- **Map tiles:** OpenFreeMap vector tiles through `maplibre-gl-leaflet`. Add an ADR for it, covering the bundle size and the dependency on a free tile service with no fallback.
- **Place icons:**
  - New column: `locations.icon` as `varchar(20)`, not null, default `'pin'`.
  - Shared zod schema: an enum of the 12 keys.
  - API: `POST` and `PATCH` accept an optional `icon`, and `location` responses include it.
  - Upload: the server assigns `suggestIcon(name)` to each row. The TXT format doesn't change.
- **Mobile add flow:** use the centre crosshair with **Add here**; tapping the map doesn't place pins on mobile.
- **New features:**
  - category filter chips;
  - pin clustering;
  - dropping a ZIP onto the map frame;
  - Copy coordinates in the popup.
