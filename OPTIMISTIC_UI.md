# Optimistic UI Pattern Guide

## Overview

This document defines the standardized pattern for implementing optimistic UI updates in BeehaviorAI using TanStack Query (React Query). Optimistic updates provide immediate visual feedback to users while API calls complete in the background, creating a perception of instant responsiveness.

## When to Use Optimistic Updates

### ✅ Use Optimistic Updates For:
- User-facing CRUD operations (Create, Read, Update, Delete)
- Operations where immediate feedback significantly improves UX
- Operations with high success rate (>95%)
- Frequent user actions (adding resources, creating logs, etc.)
- Interactive features where latency is noticeable

### ❌ Skip Optimistic Updates For:
- One-time setup flows or onboarding (marginal UX benefit)
- Low-frequency administrative operations
- Operations with high failure risk
- Operations requiring complex server-side validation
- Simple read operations (queries handle this automatically)

## Standard Pattern

Every mutation in BeehaviorAI follows this five-handler pattern:

```typescript
const mutationName = useMutation({
  // 1️⃣ MUTATION FUNCTION - The actual API call
  mutationFn: async (data: DataType) => {
    const res = await apiRequest("METHOD", `/api/endpoint`, data);
    return await res.json();
  },

  // 2️⃣ OPTIMISTIC UPDATE - Execute BEFORE API call
  onMutate: async (newData) => {
    // a. Cancel outgoing queries to prevent race conditions
    await queryClient.cancelQueries({
      queryKey: ["/api/organizations", orgId, "resource-type"]
    });

    // b. Snapshot current data for rollback
    const previousData = queryClient.getQueryData<DataType[]>([
      "/api/organizations",
      orgId,
      "resource-type",
    ]);

    // c. Create optimistic data
    // For CREATE: Use temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: DataType = {
      id: tempId,
      organizationId: orgId!,
      ...newData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // d. Update query cache optimistically
    if (previousData) {
      queryClient.setQueryData<DataType[]>(
        ["/api/organizations", orgId, "resource-type"],
        [...previousData, optimisticItem] // For CREATE
      );
    } else {
      // Handle case where cache is empty
      queryClient.setQueryData<DataType[]>(
        ["/api/organizations", orgId, "resource-type"],
        [optimisticItem]
      );
    }

    // e. Close dialogs immediately (for better UX)
    setIsDialogOpen(false);

    // f. Return context for error rollback
    return { previousData, tempId };
  },

  // 3️⃣ SUCCESS HANDLER - Replace temp ID with real data
  onSuccess: (serverData: DataType, _variables, context) => {
    const currentData = queryClient.getQueryData<DataType[]>([
      "/api/organizations",
      orgId,
      "resource-type",
    ]);

    if (currentData && context?.tempId) {
      // Replace optimistic item with real server data
      queryClient.setQueryData<DataType[]>(
        ["/api/organizations", orgId, "resource-type"],
        currentData.map((item) =>
          item.id === context.tempId ? serverData : item
        )
      );
    }

    toast({
      title: "Success",
      description: "Operation completed successfully.",
    });
  },

  // 4️⃣ ERROR HANDLER - Rollback on failure
  onError: (error: Error, _variables, context) => {
    if (context?.previousData) {
      // Restore previous state
      queryClient.setQueryData<DataType[]>(
        ["/api/organizations", orgId, "resource-type"],
        context.previousData
      );
    }

    // Reopen dialog on error for user retry
    setIsDialogOpen(true);

    toast({
      title: "Error",
      description: error.message || "Operation failed. Please try again.",
      variant: "destructive",
    });
  },

  // 5️⃣ CLEANUP - Always refetch to ensure consistency
  onSettled: () => {
    // Invalidate queries to refetch and ensure data consistency
    queryClient.invalidateQueries({
      queryKey: ["/api/organizations", orgId, "resource-type"]
    });
  },
});
```

## Pattern Variations by Operation Type

### CREATE Operations

Use temporary IDs and add to existing array:

```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: [...] });
  const previousData = queryClient.getQueryData<DataType[]>([...]);

  const tempId = `temp-${Date.now()}`;
  const optimisticItem: DataType = {
    id: tempId,
    organizationId: orgId!,
    ...newData,
    createdAt: new Date(),
  };

  if (previousData) {
    queryClient.setQueryData<DataType[]>(
      [...],
      [...previousData, optimisticItem] // Append to array
    );
  } else {
    queryClient.setQueryData<DataType[]>([...], [optimisticItem]);
  }

  setIsDialogOpen(false);
  return { previousData, tempId };
},

onSuccess: (serverData, _variables, context) => {
  const currentData = queryClient.getQueryData<DataType[]>([...]);

  if (currentData && context?.tempId) {
    queryClient.setQueryData<DataType[]>(
      [...],
      currentData.map((item) =>
        item.id === context.tempId ? serverData : item
      )
    );
  }

  toast({ title: "Created successfully" });
},
```

**Examples in codebase:**
- `createBehaviorLog` (StudentProfile.tsx:96-193)
- `createFollowUp` (StudentProfile.tsx:309-403)
- `createStudent` (AddStudentDialog.tsx:77-175)
- `createCategory` (Settings.tsx:138-203)

### UPDATE Operations

Map over array and replace matching item:

```typescript
onMutate: async ({ id, updates }) => {
  await queryClient.cancelQueries({ queryKey: [...] });
  const previousData = queryClient.getQueryData<DataType[]>([...]);

  if (previousData) {
    queryClient.setQueryData<DataType[]>(
      [...],
      previousData.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }

  setIsDialogOpen(false);
  return { previousData };
},

onError: (error, _variables, context) => {
  if (context?.previousData) {
    queryClient.setQueryData<DataType[]>([...], context.previousData);
  }
  setIsDialogOpen(true);
  toast({ title: "Error", variant: "destructive" });
},
```

**Examples in codebase:**
- `updateBehaviorLog` (StudentProfile.tsx:196-264)
- `updateFollowUp` (StudentProfile.tsx:406-474)
- `updateStudent` (AddStudentDialog.tsx:177-328)
- `updateCategory` (Settings.tsx:206-249)

### DELETE Operations

Filter out the deleted item:

```typescript
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: [...] });
  const previousData = queryClient.getQueryData<DataType[]>([...]);

  if (previousData) {
    queryClient.setQueryData<DataType[]>(
      [...],
      previousData.filter((item) => item.id !== id)
    );
  }

  return { previousData };
},

onError: (error, _variables, context) => {
  if (context?.previousData) {
    queryClient.setQueryData<DataType[]>([...], context.previousData);
  }
  toast({ title: "Error", variant: "destructive" });
},
```

**Examples in codebase:**
- `deleteBehaviorLog` (StudentProfile.tsx:267-306)
- `deleteFollowUp` (StudentProfile.tsx:477-516)
- `deleteResource` (StudentProfile.tsx:616-663)
- `deleteCategory` (Settings.tsx:252-295)

## Multi-Query Updates

When a mutation affects multiple queries (e.g., updating a student affects both the student list and individual student query):

```typescript
onMutate: async (updates) => {
  // Cancel BOTH queries
  await queryClient.cancelQueries({
    queryKey: ["/api/organizations", orgId, "students"]
  });
  await queryClient.cancelQueries({
    queryKey: ["/api/organizations", orgId, "students", studentId]
  });

  // Snapshot BOTH
  const previousStudents = queryClient.getQueryData([...]);
  const previousStudent = queryClient.getQueryData([...]);

  // Update BOTH caches
  if (previousStudents) {
    queryClient.setQueryData([...],
      previousStudents.map(s => s.id === studentId ? {...s, ...updates} : s)
    );
  }

  if (previousStudent) {
    queryClient.setQueryData([...], {...previousStudent, ...updates});
  }

  return { previousStudents, previousStudent };
},

onSuccess: (serverData) => {
  // Update BOTH with real data
  const currentStudents = queryClient.getQueryData([...]);
  if (currentStudents) {
    queryClient.setQueryData([...],
      currentStudents.map(s => s.id === studentId ? serverData : s)
    );
  }
  queryClient.setQueryData([...], serverData);
},

onError: (error, _variables, context) => {
  // Rollback BOTH
  if (context?.previousStudents) {
    queryClient.setQueryData([...], context.previousStudents);
  }
  if (context?.previousStudent) {
    queryClient.setQueryData([...], context.previousStudent);
  }
},

onSettled: () => {
  // Invalidate BOTH
  queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students"] });
  queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "students", studentId] });
},
```

**Examples in codebase:**
- `updateStudent` (AddStudentDialog.tsx:177-328)

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Forgetting to Cancel Queries
```typescript
// WRONG - Race condition possible
onMutate: async (data) => {
  const previous = queryClient.getQueryData([...]);
  queryClient.setQueryData([...], [...previous, data]);
  return { previous };
}
```

```typescript
// CORRECT - Prevents race conditions
onMutate: async (data) => {
  await queryClient.cancelQueries({ queryKey: [...] }); // ✅
  const previous = queryClient.getQueryData([...]);
  queryClient.setQueryData([...], [...previous, data]);
  return { previous };
}
```

### ❌ Pitfall 2: Not Handling Empty Cache
```typescript
// WRONG - Crashes if cache is empty
onMutate: async (data) => {
  const previous = queryClient.getQueryData([...]);
  queryClient.setQueryData([...], [...previous, data]); // ❌ previous might be undefined
  return { previous };
}
```

```typescript
// CORRECT - Handles empty cache
onMutate: async (data) => {
  const previous = queryClient.getQueryData([...]);
  if (previous) {
    queryClient.setQueryData([...], [...previous, data]); // ✅
  } else {
    queryClient.setQueryData([...], [data]); // ✅
  }
  return { previous };
}
```

### ❌ Pitfall 3: Not Closing Dialog in onMutate
```typescript
// WRONG - Dialog waits for API
onSuccess: () => {
  setIsDialogOpen(false); // ❌ User sees loading state
}
```

```typescript
// CORRECT - Instant feedback
onMutate: async (data) => {
  // ... optimistic update ...
  setIsDialogOpen(false); // ✅ Immediate close
  return { previous };
}
```

### ❌ Pitfall 4: Not Reopening Dialog on Error
```typescript
// WRONG - User can't retry easily
onError: (error, _variables, context) => {
  queryClient.setQueryData([...], context.previous);
  toast({ title: "Error" }); // ❌ Dialog is closed
}
```

```typescript
// CORRECT - Easy retry
onError: (error, _variables, context) => {
  queryClient.setQueryData([...], context.previous);
  setIsDialogOpen(true); // ✅ Reopen for retry
  toast({ title: "Error", variant: "destructive" });
}
```

### ❌ Pitfall 5: Forgetting Temp ID Replacement
```typescript
// WRONG - Temp ID persists
onSuccess: () => {
  toast({ title: "Success" }); // ❌ Temp ID still in cache
}
```

```typescript
// CORRECT - Real ID from server
onSuccess: (serverData, _variables, context) => {
  const current = queryClient.getQueryData([...]);
  if (current && context?.tempId) {
    queryClient.setQueryData([...],
      current.map(item => item.id === context.tempId ? serverData : item) // ✅
    );
  }
  toast({ title: "Success" });
}
```

### ❌ Pitfall 6: Skipping onSettled Invalidation
```typescript
// WRONG - Data might drift from server
onSuccess: (data) => {
  // Update cache
  // ❌ No invalidation, cache might be stale
}
```

```typescript
// CORRECT - Ensures consistency
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: [...] }); // ✅ Refetch for consistency
}
```

## Testing Checklist

When implementing or reviewing optimistic updates, verify:

### Immediate Feedback
- [ ] Optimistic update appears instantly (no visible delay)
- [ ] Dialog/modal closes immediately
- [ ] Loading state is minimal or invisible for successful operations

### Success Path
- [ ] Real server data replaces optimistic data
- [ ] Temp IDs are replaced with real IDs from server
- [ ] Success toast displays with appropriate message
- [ ] No duplicate items appear

### Error Path
- [ ] Data rolls back to previous state on error
- [ ] Dialog reopens for easy retry
- [ ] Error toast displays with user-friendly message
- [ ] No orphaned optimistic data remains

### Edge Cases
- [ ] Empty cache handled correctly
- [ ] Race conditions prevented (queries canceled)
- [ ] Multiple rapid operations handled gracefully
- [ ] Network delay doesn't cause UI flicker
- [ ] Context data properly typed and returned

### Code Quality
- [ ] All 5 handlers present (mutationFn, onMutate, onSuccess, onError, onSettled)
- [ ] Previous data snapshot saved for rollback
- [ ] TypeScript types properly defined
- [ ] Query keys consistent with other queries
- [ ] User-friendly error messages

## Query Key Convention

All queries follow the organization-scoped pattern:

```typescript
["/api/organizations", orgId, "resource-type", optionalId]
```

Examples:
```typescript
// List queries
["/api/organizations", orgId, "students"]
["/api/organizations", orgId, "categories"]
["/api/organizations", orgId, "students", studentId, "resources"]

// Single item queries
["/api/organizations", orgId, "students", studentId]
["/api/organizations", orgId, "categories", categoryId]
```

## Performance Considerations

### Temp ID Strategy
- Use `temp-${Date.now()}` for temporary IDs
- Ensures uniqueness even for rapid consecutive operations
- Easy to identify in debugging (starts with "temp-")

### Cache Updates
- Prefer `setQueryData` over `invalidateQueries` for immediate updates
- Use `invalidateQueries` in `onSettled` for eventual consistency
- Cancel queries in `onMutate` to prevent race conditions

### User Experience
- Close dialogs in `onMutate` for instant feedback
- Reopen dialogs in `onError` for easy retry
- Show loading states only during actual network operations
- Provide specific, actionable error messages

## Debugging Tips

### Check Query Cache
```typescript
// In React DevTools or console
queryClient.getQueryData(["/api/organizations", orgId, "resource-type"])
```

### Monitor Mutations
```typescript
// Add logging to mutations
onMutate: async (data) => {
  console.log("🔄 Optimistic update:", data);
  // ... rest of handler
},
onSuccess: (data) => {
  console.log("✅ Server response:", data);
  // ... rest of handler
},
onError: (error) => {
  console.log("❌ Mutation failed:", error);
  // ... rest of handler
}
```

### Simulate Network Issues
```typescript
// Test rollback behavior
throw new Error("Simulated error"); // In mutationFn
```

## Migration Guide

If you have an existing mutation without optimistic updates, follow these steps:

1. **Add onMutate handler**
   - Cancel queries
   - Snapshot previous data
   - Create optimistic data (with temp ID for CREATE)
   - Update cache
   - Close dialog
   - Return context

2. **Update onSuccess handler**
   - Add temp ID replacement (for CREATE operations)
   - Keep existing toast notification

3. **Update onError handler**
   - Add rollback logic
   - Reopen dialog
   - Keep existing error toast

4. **Add onSettled handler**
   - Move `invalidateQueries` from `onSuccess` to `onSettled`

5. **Test thoroughly**
   - Use testing checklist above
   - Test both success and error paths

## References

- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- Existing implementations in BeehaviorAI:
  - StudentProfile.tsx: createBehaviorLog, createFollowUp, deleteResource
  - AddStudentDialog.tsx: createStudent, updateStudent
  - Settings.tsx: createCategory, updateCategory, deleteCategory

---

**Last Updated:** 2025-11-09
**Coverage:** 20/20 mutations (100%)
**Pattern Version:** 1.0
