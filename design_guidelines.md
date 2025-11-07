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

## Color Scheme

**Primary Background:**
- Main background: Off-white/very light grey (`#F8F8F8` or similar)
- Card backgrounds: White (`#FFFFFF`)
- Subtle borders/separators: Light grey (`#E5E5E5` or similar)

**Accent Yellow (Primary Interactive Color):**
- Used for: Active navigation items, student avatars, primary buttons, timeline markers, user profile highlights
- Color: Warm, slightly muted yellow (e.g., `#F5C842` or similar)
- Text on yellow: Dark grey/black for avatars, white for active navigation items
- Application:
  - Active sidebar navigation: Yellow background with white text
  - Student avatar background: Yellow circle with dark grey initials
  - Primary action buttons: Yellow background ("+ New Log", "Uncover Insights")
  - Timeline vertical markers: Yellow line on left side of entries
  - User profile icon: Yellow circular background

**Accent Green (Positive Indicators):**
- Used for: Positive behavior badges, achievement badges, status indicators
- Color: Fresh, slightly desaturated green (e.g., `#4CAF50` or similar)
- Application:
  - "Positive Behavior" badges in timeline
  - Student achievement badges ("Improving", "Math Whiz")
  - Success states and positive feedback

**Text Colors:**
- Primary headings: Dark grey/black (`#333333` or similar)
- Secondary text: Medium grey (`#666666` or similar)
- Muted text: Light grey (`#999999` or similar)
  - Examples: Grade/class info, "Logged by" text, timestamps
- Active navigation text: White (on yellow background)
- Inactive tab text: Medium grey

**Borders and Separators:**
- Card borders: Subtle light grey lines
- Tab separators: Light grey
- Timeline connectors: Yellow vertical line

**Icon Colors:**
- Default icons: Dark grey
- Highlighted icons: Yellow (when active/selected)
- Positive indicators: Green

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
- Central search input: "Search students, logs, or reports..." with magnifying glass icon
- Right side controls: Theme toggle (crescent moon icon) and user profile (person icon with yellow circular background when active)
- Minimal design focusing on functionality and quick access

**Sidebar Navigation:**
- Fixed w-64 sidebar with primary navigation items
- Active state: Yellow background (`#F5C842` or similar) with white text
- Inactive state: Transparent background with dark grey text
- Icons from Heroicons (outline style) paired with labels
- Sections: Dashboard, Students, Reports, Tasks, Settings
- Logo at top: "Beehave" with bee icon
- Version indicator at bottom: "Beehave v1.0"
- Collapsible on mobile with hamburger menu

### Core UI Elements

**Student Cards (List View):**
- Card container: rounded-lg border with p-4
- Student photo: w-12 h-12 rounded-full (top-left)
- Name and class displayed prominently
- Quick stats: Total logs, recent activity timestamp
- Click-through to full profile

**Student Profile Layout:**

**Back Navigation:**
- Arrow icon pointing left + "Back to Students" text
- Positioned at top of main content area
- Clickable breadcrumb navigation

**Student Information Card:**
- Large avatar: Yellow circular background (w-24 h-24) with dark grey initials
- Student name: Prominently displayed in large, bold font (text-3xl or similar)
- Grade/Class info: Displayed below name (e.g., "7th Grade - Math") in medium grey text
- Badges: Green, rounded rectangular badges for achievements/status (e.g., "Improving", "Math Whiz")
  - Badge style: Rounded corners, green background, white or dark text
- Resources section: "Resources +" with clickable links
  - Each resource link includes external link icon
  - Examples: "Product Specs", "Study Guide"

**Profile Tabs:**
- Two-tab system: "Behavior" (active) and "Academic" (inactive)
- Active tab: White background, dark text
- Inactive tab: Light grey background, medium grey text
- Tab container: Subtle border separator between tabs

**Behavior Timeline Section:**
- Header: "Behavior Timeline" on left, yellow "+ New Log" button on right
- Timeline entries: Chronological list with vertical yellow line marker on left side
- Each timeline entry contains:
  - Date: Displayed prominently (e.g., "Nov 7, 2025")
  - Badge: Green "Positive Behavior" badge (or other category badges)
  - Description: Full text description of the behavior/event
  - Metadata: "Logged by [Name]" in muted grey text
- Vertical yellow line connects all entries visually
- Spacing: Adequate padding between entries for readability

**AI Insights Card:**
- Positioned on right side of main content area
- Title: "Want help understanding this student through their data?" with sparkle icon
- Description: "Get AI-powered insights about this student's behavior patterns and academic performance."
- CTA Button: Yellow "Uncover Insights" button with sparkle icon
- Card style: Rounded corners, white background, subtle border

**Fixed Help Icon:**
- Small black circle with white question mark
- Fixed position at bottom right corner of screen
- Always accessible for user assistance

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

**Behavior Log Entries (Timeline Style):**
- Timeline-style layout with vertical yellow line on left side connecting all entries
- Each log entry structure:
  - Date: Prominently displayed (e.g., "Nov 7, 2025")
  - Category badge: Green "Positive Behavior" badge (or other category colors)
    - Rounded rectangular shape
    - Category-specific color coding
  - Description: Full text description in medium grey
  - Metadata: "Logged by [Name]" in muted grey text (text-xs)
- Spacing: Generous padding between entries for visual separation
- Visual hierarchy: Date → Badge → Description → Metadata
- No card borders around individual entries (clean, minimal design)

**AI Insights/Powered Features:**
- Card layout: White background, rounded corners, subtle border
- Title: Engaging question format (e.g., "Want help understanding this student through their data?")
- Icon: Sparkle icon to indicate AI-powered features
- Description: Clear explanation of AI capabilities
- CTA Button: Yellow "Uncover Insights" button with sparkle icon
- Placement: Right side of content area for visibility
- Visual treatment: Distinct from other cards, emphasizes AI capabilities

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

**Student Avatars:**
- Placement: Student cards, profile headers
- Treatment: Circular (rounded-full)
- Sizes: 
  - Small (w-8 h-8 in logs)
  - Medium (w-12 h-12 in cards)
  - Large (w-24 h-24 in profile header)
- Fallback: Yellow circular background with dark grey initials when no photo
- Initials: First letter of first name + first letter of last name (e.g., "EJ" for Emma Johnson)
- Color: Yellow background (`#F5C842` or similar) with dark grey text (`#333333`)

**No Hero Images:** This is a dashboard application, not a marketing site. Focus remains on data and functionality.

---

## Accessibility

- All form inputs have associated labels
- Consistent focus states across all interactive elements
- Adequate contrast ratios for text
- Keyboard navigation support for all primary actions
- Screen reader friendly semantic HTML throughout