<!-- c8e450bb-7913-41b7-b145-3459e7288a3e 55d5cac6-d098-4e8b-bc13-b0285d5a0145 -->
# Review: Should BeeLoader Be Two-Stage or Single-Stage?

## Current Two-Stage Approach

**Stage 1 (0-500ms)**: Bee emoji + "Loading..." text
**Stage 2 (500ms+)**: Skeleton loader
**Then**: Actual content

## Analysis

### Pros of Two-Stage:

- Quick initial feedback (bee appears immediately)
- After 500ms, skeleton provides context about what's loading
- Better perceived performance for longer loads

### Cons of Two-Stage:

- **Complexity**: Timer logic, state management, useEffect
- **Inconsistent UX**: Users see different loading states depending on load time
- **Wasted effort**: If data loads <500ms, skeleton is never shown (but still created)
- **Double transitions**: Bee → Skeleton → Content can feel jarring
- **Current issue**: You're seeing skeleton BEFORE BeeLoader (from Suspense), then bee, then skeleton again

### Single-Stage Options:

**Option A: Just Skeleton (immediate)**

- ✅ More informative - shows page structure immediately
- ✅ Simpler code - no timers or state
- ✅ Consistent - same loading state every time
- ❌ Loses bee branding
- ❌ Might feel slower initially

**Option B: Just Bee Emoji (no skeleton)**

- ✅ Consistent branding
- ✅ Simpler code
- ✅ Fast initial feedback
- ❌ Less informative for longer loads
- ❌ Wastes all the skeleton components already created

**Option C: Make skeleton optional**

- ✅ Flexible
- ❌ Still complex
- ❌ Inconsistent UX

## Recommendation

**Simplify to single-stage with skeleton immediately** because:

1. Skeletons are already created for each page
2. Provides better context about what's loading
3. Simpler code (no timers/state)
4. Consistent UX
5. Solves the double-loading issue (Suspense skeleton → BeeLoader skeleton)

We can keep the bee emoji for simple loading states (Suspense, auth) where we don't have a skeleton.

## Proposed Changes

1. **Simplify BeeLoader**: Remove two-stage logic, show skeleton immediately when `isLoading` is true
2. **Create BeeLoading**: Simple bee emoji component for cases without skeletons (Suspense, auth)
3. **Update App.tsx**: Use BeeLoading for Suspense fallback and auth loading
4. **Update ListDetail.tsx**: Use BeeLoading (or BeeLoader if we add skeleton)

## Question for You

Do you want to:

- **A)** Keep bee branding everywhere (bee emoji only, no skeletons)
- **B)** Use skeletons for better context (simplify BeeLoader to show skeleton immediately)
- **C)** Keep two-stage but fix the double-loading issue

Which approach do you prefer?

### To-dos

- [ ] Create BeeLoading component extracting the bee emoji + Loading text from BeeLoader Stage 1
- [ ] Update BeeLoader to use BeeLoading component internally for Stage 1
- [ ] Replace PageSkeleton in AppRouter Suspense fallback with BeeLoading
- [ ] Replace spinner in AppContent with BeeLoading component
- [ ] Replace spinner in ListDetail.tsx with BeeLoading component