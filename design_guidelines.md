# Design Guidelines: School Behavior Management SaaS

## Design Approach
**Selected System:** Material Design with education-focused adaptations
**Rationale:** Material Design provides the clarity, efficiency, and accessibility required for educational software where teachers and administrators need to quickly process information and take action. Its established patterns reduce learning curve while maintaining professional credibility.

**Key Design Principles:**
- Clarity over decoration: Information should be immediately scannable
- Action-oriented: Primary actions prominently placed, secondary actions accessible but not distracting
- Trust-building: Professional, clean aesthetic that conveys data security and reliability
- Efficiency: Minimize clicks to common tasks (adding logs, viewing summaries)

---

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - for UI elements, labels, data
- Secondary: Inter (varied weights) - maintains consistency throughout

**Type Scale:**
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles/Student Names: text-lg font-medium
- Body Text/Forms: text-base font-normal
- Labels/Meta Info: text-sm font-medium
- Timestamps/Secondary: text-xs font-normal

**Hierarchy Rules:**
- Dashboard page titles use text-3xl with generous bottom margin (mb-6)
- Student names in lists use text-lg font-medium for quick scanning
- Log entries use text-sm for compact display with text-base for log content
- AI summaries use text-base with slightly increased line-height for readability

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Tight spacing: p-2, gap-2 (within compact components)
- Standard spacing: p-4, gap-4, mb-4 (most common use)
- Section spacing: p-6, mb-6 (between major sections)
- Large spacing: p-8, mb-8 (page-level padding, card spacing)

**Grid Structure:**
- Dashboard container: max-w-7xl mx-auto px-4
- Two-column layout: Sidebar (w-64 fixed) + Main content (flex-1)
- Student grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Forms: max-w-2xl for optimal readability

**Responsive Breakpoints:**
- Mobile: Single column, collapsible sidebar, stacked forms
- Tablet (md:): Two-column student grids, sidebar visible
- Desktop (lg:): Three-column grids, full sidebar, optimal spacing

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with h-16, shadow-sm
- School logo/name on left, user profile/settings on right
- Minimal design focusing on school branding and quick access

**Sidebar Navigation:**
- Fixed w-64 sidebar with primary navigation items
- Active state: Subtle background treatment with medium font-weight
- Icons from Heroicons (outline style) paired with labels
- Sections: Dashboard, Students, Reports, Settings
- Collapsible on mobile with hamburger menu

### Core UI Elements

**Student Cards (List View):**
- Card container: rounded-lg border with p-4
- Student photo: w-12 h-12 rounded-full (top-left)
- Name and class displayed prominently
- Quick stats: Total logs, recent activity timestamp
- Click-through to full profile

**Student Profile Layout:**
- Header section: Student details (name, email, class, gender) in horizontal layout with larger photo (w-24 h-24)
- Tab navigation for: Overview, Behavior Logs, Follow-ups, Meeting Notes
- AI Summary card: Prominent placement with rounded-lg, p-6, distinct visual treatment

### Forms

**Behavior Log Form:**
- Modal overlay (max-w-lg) for adding new logs
- Date picker input
- Category dropdown with clear options
- Notes textarea (min-h-32)
- Submit button (primary CTA)
- Cancel button (secondary, outline style)

**Form Inputs:**
- Standard height: h-10 for text inputs
- Consistent padding: px-4 py-2
- Border: rounded-md border
- Labels above inputs: text-sm font-medium mb-2
- Helper text below: text-xs

### Data Display

**Behavior Log Entries:**
- Timeline-style layout with vertical line connecting entries
- Each log: Card with rounded-lg, p-4, border-l-4 (category indicator)
- Date badge: text-xs with subtle background
- Category tag: Inline badge with rounded-full px-3 py-1
- Notes: text-sm with max-w-prose
- Edit/Delete actions: Icon buttons on hover

**AI Summary Display:**
- Dedicated card with p-6, rounded-lg
- "AI Generated Summary" label with icon
- Summary text: text-base with line-height relaxed
- Last updated timestamp
- Regenerate button for manual refresh

**Meeting Notes:**
- List view with date and participant info
- Expandable accordion pattern for full transcription
- Summary at top, full notes below
- Tag display showing linked student

### Overlays

**Modals:**
- Centered overlay with max-w-lg to max-w-2xl depending on content
- Header with title (text-xl font-semibold) and close button
- Content area with p-6
- Footer with action buttons aligned right
- Dark backdrop with opacity

**Toast Notifications:**
- Top-right corner positioning
- Success/error states clearly differentiated through icons
- Auto-dismiss after 4 seconds
- Slide-in animation (minimal, quick)

---

## Tables

**Student List Table (Alternative to Cards):**
- Full-width responsive table
- Headers: text-sm font-medium uppercase tracking-wide
- Rows: hover state with subtle background change
- Alternating row backgrounds for easier scanning
- Action column on right with icon buttons
- Pagination controls at bottom

---

## Animations

**Minimal, Purposeful Motion:**
- Page transitions: None (instant navigation)
- Modal open/close: Quick fade (duration-200)
- Dropdown menus: Slide-in (duration-150)
- Loading states: Subtle pulse on skeleton screens
- No scroll-triggered or decorative animations

---

## Icons

**Library:** Heroicons (outline style via CDN)
**Usage:**
- Navigation items: 20x20 icons
- Action buttons: 16x16 icons
- Status indicators: 12x12 icons
- Consistent placement: Icons left of text labels

---

## Images

**Student Photos:**
- Placement: Student cards, profile headers, log entries
- Treatment: Circular (rounded-full)
- Sizes: Small (w-8 h-8 in logs), Medium (w-12 h-12 in cards), Large (w-24 h-24 in profile header)
- Fallback: Initials on solid background when no photo

**No Hero Images:** This is a dashboard application, not a marketing site. Focus remains on data and functionality.

---

## Accessibility

- All form inputs have associated labels
- Consistent focus states across all interactive elements
- Adequate contrast ratios for text
- Keyboard navigation support for all primary actions
- Screen reader friendly semantic HTML throughout