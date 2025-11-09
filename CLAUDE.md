# Claude AI Agent Guidelines for BeehaviorAI

## Project Context

BeehaviorAI is a school behavior management SaaS application that helps educators track student behavior, interventions, and progress.

### Tech Stack
- **Frontend:** React + TypeScript + Vite + TanStack Router + TanStack Query
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Supabase Auth
- **Deployment:** Replit/Cloud hosting

### Architecture
- Multi-tenant SaaS with organization-scoped data
- RESTful API with organization-based routing
- Optimistic UI updates for all mutations (100% coverage)
- Form validation using react-hook-form + Zod schemas

## Communication Guidelines

### Tone & Style
- Use simple, everyday language
- Avoid unnecessary technical jargon
- Focus on clarity and actionability
- Be concise and direct
- Provide specific examples when explaining concepts

### User Interaction
- Ask clarifying questions when requirements are ambiguous
- Suggest improvements or alternatives when appropriate
- Explain trade-offs when multiple approaches exist
- Anticipate edge cases and potential issues

## Core Development Patterns

### 1. Optimistic UI Updates (CRITICAL)

**ALL user-facing mutations MUST implement optimistic updates following the pattern in OPTIMISTIC_UI.md**

#### Required Elements
Every mutation must have these 5 handlers:

1. **mutationFn** - The actual API call
2. **onMutate** - Optimistic update (cancel queries, snapshot, update cache, close dialogs)
3. **onSuccess** - Replace temp IDs with real server data
4. **onError** - Rollback to previous state + reopen dialogs
5. **onSettled** - Invalidate queries for consistency

#### Quick Reference
```typescript
const mutation = useMutation({
  mutationFn: async (data) => { /* API call */ },
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: [...] });
    const previous = queryClient.getQueryData([...]);
    // Update cache optimistically
    setIsDialogOpen(false);
    return { previous, tempId };
  },
  onSuccess: (serverData, _vars, context) => {
    // Replace temp with real data
  },
  onError: (error, _vars, context) => {
    queryClient.setQueryData([...], context.previous);
    setIsDialogOpen(true);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: [...] });
  },
});
```

### 2. Naming Conventions

#### Mutations
- CREATE: `create{ResourceName}` (e.g., `createBehaviorLog`, `createStudent`)
- UPDATE: `update{ResourceName}` (e.g., `updateStudent`, `updateCategory`)
- DELETE: `delete{ResourceName}` (e.g., `deleteResource`, `deleteFollowUp`)

#### Query Keys
Organization-scoped format:
```typescript
["/api/organizations", orgId, "resource-type", optionalId]

// Examples:
["/api/organizations", "123", "students"]
["/api/organizations", "123", "students", "456"]
["/api/organizations", "123", "students", "456", "resources"]
```

#### Temporary IDs
```typescript
const tempId = `temp-${Date.now()}`;
```

### 3. Form Management

#### Pattern
- Use `react-hook-form` for form state
- Use Zod schemas for validation (shared with backend)
- Validate on blur and submit
- Show inline error messages

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 4. Error Handling

#### User-Facing Errors
- Always provide user-friendly messages
- Use toast notifications for feedback
- Provide specific, actionable guidance
- Reopen dialogs on error for easy retry

```typescript
// GOOD
toast({
  title: "Failed to save student",
  description: "Please check that all required fields are filled and try again.",
  variant: "destructive",
});

// BAD
toast({
  title: "Error",
  description: error.message, // Technical error message
  variant: "destructive",
});
```

#### Server Errors
- Log detailed errors to console for debugging
- Transform technical errors to user-friendly messages
- Preserve stack traces for troubleshooting

```typescript
onError: (error: Error) => {
  console.error("Student creation error:", error); // ✅ Detailed logging
  toast({
    title: "Failed to create student",
    description: "Please try again. If the problem persists, contact support.",
    variant: "destructive",
  });
}
```

### 5. Dialog/Modal Management

#### Pattern
```typescript
const [isDialogOpen, setIsDialogOpen] = useState(false);

// Close in onMutate (instant feedback)
onMutate: async (data) => {
  // ... optimistic update ...
  setIsDialogOpen(false); // ✅ Immediate close
  return { previous };
},

// Reopen in onError (easy retry)
onError: (error, _vars, context) => {
  // ... rollback ...
  setIsDialogOpen(true); // ✅ Reopen for retry
  toast({ title: "Error", variant: "destructive" });
}
```

### 6. TypeScript Best Practices

- Use shared schema types from `shared/schema.ts`
- Avoid `any` types - use proper typing
- Use type inference where possible
- Define interfaces for component props
- Use utility types (`Partial`, `Pick`, `Omit`) appropriately

```typescript
// GOOD
interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertStudent) => void;
  isPending: boolean;
}

// BAD
interface AddStudentDialogProps {
  open: any;
  onOpenChange: any;
  onSubmit: any;
  isPending: any;
}
```

## Code Review Checklist

When reviewing code or making suggestions, verify:

### Optimistic Updates
- [ ] All 5 handlers present (mutationFn, onMutate, onSuccess, onError, onSettled)
- [ ] Queries canceled in onMutate (prevents race conditions)
- [ ] Previous data snapshots saved for rollback
- [ ] Temp IDs used for CREATE operations
- [ ] Temp IDs replaced with real data in onSuccess
- [ ] Cache rolled back in onError
- [ ] Dialogs close in onMutate
- [ ] Dialogs reopen in onError
- [ ] Queries invalidated in onSettled

### Data Flow
- [ ] Query keys follow organization-scoped pattern
- [ ] Mutations update correct query caches
- [ ] Multi-query updates handle all affected queries
- [ ] Context properly typed and returned from onMutate

### User Experience
- [ ] Error messages are user-friendly and actionable
- [ ] Success feedback provided via toast
- [ ] Loading states shown appropriately
- [ ] Forms validate on blur and submit
- [ ] Dialogs can be closed and reopened

### Code Quality
- [ ] TypeScript types properly defined
- [ ] No `any` types used
- [ ] Shared schemas used from `shared/schema.ts`
- [ ] Consistent naming conventions followed
- [ ] Comments added for complex logic
- [ ] No console.log in production code (use console.error for errors)

### Security
- [ ] User input validated on client and server
- [ ] Organization access checked on server
- [ ] Authentication required for protected routes
- [ ] XSS prevention (React handles this by default)
- [ ] SQL injection prevented (Drizzle ORM handles this)

## Common Tasks

### Adding a New Mutation

1. **Define the mutation function**
   ```typescript
   mutationFn: async (data: DataType) => {
     const res = await apiRequest("POST", `/api/organizations/${orgId}/resources`, data);
     return await res.json();
   }
   ```

2. **Implement onMutate**
   - Cancel queries: `await queryClient.cancelQueries({ queryKey: [...] })`
   - Snapshot: `const previous = queryClient.getQueryData([...])`
   - Create temp ID (for CREATE): `const tempId = \`temp-${Date.now()}\``
   - Update cache: `queryClient.setQueryData([...], optimisticData)`
   - Close dialog: `setIsDialogOpen(false)`
   - Return context: `return { previous, tempId }`

3. **Implement onSuccess**
   - Replace temp with real data (for CREATE)
   - Show success toast

4. **Implement onError**
   - Rollback: `queryClient.setQueryData([...], context.previous)`
   - Reopen dialog: `setIsDialogOpen(true)`
   - Show error toast

5. **Implement onSettled**
   - Invalidate queries: `queryClient.invalidateQueries({ queryKey: [...] })`

6. **Test thoroughly**
   - Test success path
   - Test error path (simulate network error)
   - Test rapid consecutive operations
   - Test empty cache scenario

### Adding a New API Endpoint

1. **Define schema in `shared/schema.ts`**
   ```typescript
   export const resources = pgTable("resources", {
     id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
     // ... other fields
   });

   export const insertResourceSchema = createInsertSchema(resources);
   export type InsertResource = z.infer<typeof insertResourceSchema>;
   ```

2. **Create route in `server/routes.ts`**
   ```typescript
   app.post(
     "/api/organizations/:orgId/resources",
     isAuthenticated,
     checkOrganizationAccess,
     async (req: any, res) => {
       const { orgId } = req.params;
       const validated = insertResourceSchema.parse(req.body);
       const result = await storage.createResource(validated);
       res.json(result);
     }
   );
   ```

3. **Add storage method in `server/storage.ts`**
   ```typescript
   async createResource(data: InsertResource): Promise<Resource> {
     const [resource] = await db.insert(resources).values(data).returning();
     return resource;
   }
   ```

4. **Create frontend mutation** (with optimistic updates!)
5. **Test endpoint** with various scenarios

### Updating Existing Code Without Optimistic Updates

See "Migration Guide" in OPTIMISTIC_UI.md for step-by-step instructions.

## Testing Strategy

### Manual Testing
1. **Happy Path**
   - Verify immediate UI feedback
   - Confirm operation completes successfully
   - Check data persistence

2. **Error Path**
   - Simulate network errors
   - Verify rollback behavior
   - Check error messages are user-friendly
   - Confirm dialog reopens for retry

3. **Edge Cases**
   - Empty data states
   - Rapid consecutive operations
   - Network latency
   - Race conditions

### Debugging Tools
- React DevTools (inspect component state)
- TanStack Query DevTools (inspect query cache)
- Network tab (monitor API calls)
- Console logs (add temporarily for debugging)

## Project-Specific Conventions

### Organization Context
All data is scoped to organizations. Always:
- Check organization access on server
- Include `organizationId` in data
- Use organization-scoped query keys
- Filter data by organization

### Student-Centric Design
Most features revolve around students:
- Student profile is the main view
- Behavior logs, follow-ups, and resources are student-scoped
- Categories and classes are organization-wide

### Multi-Tenancy
- Each organization has isolated data
- Users can belong to multiple organizations
- All routes include organization ID
- Server middleware validates access

## Performance Best Practices

### Query Optimization
- Use `staleTime` appropriately (default: 0)
- Use `cacheTime` to keep inactive data (default: 5 minutes)
- Prefetch related data when appropriate
- Use optimistic updates to hide latency

### Bundle Size
- Import only what you need from libraries
- Use tree-shaking friendly imports
- Lazy load routes and components when appropriate
- Monitor bundle size during builds

### Rendering
- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Use proper key props in lists
- Minimize state updates

## Resources

### Documentation
- [OPTIMISTIC_UI.md](./OPTIMISTIC_UI.md) - Detailed optimistic UI pattern guide
- [CURSOR.md](./CURSOR.md) - System architecture and overview
- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form Docs](https://react-hook-form.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### Key Files
- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `client/src/lib/queryClient.ts` - Query configuration
- `client/src/pages/StudentProfile.tsx` - Main feature examples

### Example Patterns
Reference these files for examples:
- **Optimistic CREATE**: StudentProfile.tsx (createBehaviorLog, createFollowUp)
- **Optimistic UPDATE**: StudentProfile.tsx (updateBehaviorLog, updateFollowUp)
- **Optimistic DELETE**: StudentProfile.tsx (deleteResource, deleteBehaviorLog)
- **Multi-query updates**: AddStudentDialog.tsx (updateStudent)
- **Form validation**: AddStudentDialog.tsx, AddResourceDialog.tsx

## When to Ask Questions

### Always Ask When:
- Requirements are ambiguous or unclear
- Multiple valid approaches exist
- User hasn't specified preferences (e.g., which UI library component)
- Implementation would significantly impact user experience
- Technical constraints might limit options
- Security or data privacy implications exist

### Don't Ask When:
- Pattern is clearly documented (follow established patterns)
- Implementation is straightforward
- Best practice is obvious
- Question would delay simple tasks unnecessarily

## Version History

- **v1.0** (2025-11-09): Initial documentation
  - 100% optimistic UI coverage (20/20 mutations)
  - Standardized patterns established
  - Comprehensive guidelines documented

---

**Remember:** The key to excellent UX in BeehaviorAI is instant feedback through optimistic updates. Every mutation should make the user feel like the app responds immediately, even when network requests are slow.
