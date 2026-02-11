# Frontend Guidelines

## Skeleton Loading Pattern

Skeletons must **mirror the actual rendered content layout 1:1**. Not just a few random rectangles — reflect the actual component's flex structure, gap, margin, and responsive classes exactly.

### Principles

1. **Layout Mirror**: Use the same flex/grid structure, gap, and padding as the actual component
2. **Size Accuracy**: Skeleton size must match actual content size (h-4 w-20 for text, size-10 for avatar, etc.)
3. **Deep Coverage**: Apply skeletons to all visual elements — avatar, text, badge, score, button, everything
4. **Label Preservation**: When possible, keep labels/headers visible and only skeleton the value areas (inline skeleton)
5. **Responsive Match**: Apply the same responsive classes like `hidden sm:block` to skeletons
6. **Reasonable Count**: List skeletons should approximate the actual displayed count (usually 3~5 items)

### Pattern Examples

#### Component-level Skeleton (Full Replacement)
```tsx
// BAD - Just a rough rectangle
if (isLoading) {
  return <Skeleton className="h-28 w-full" />
}

// GOOD - Mirrors the actual layout
if (isLoading) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  )
}
```

#### Inline Skeleton (Value Replacement Only)
```tsx
// Keep the label visible, skeleton only the value
<div className="flex items-center justify-between">
  <span className="text-xs text-muted-foreground">Score</span>
  {isLoading ? <Skeleton className="h-4 w-16" /> : <span>{score}</span>}
</div>
```

#### List Skeleton
```tsx
// Repeat the actual item structure
{Array.from({ length: 3 }).map((_, i) => (
  <div key={i} className="flex items-center gap-3 px-4 py-3">
    <Skeleton className="size-8 rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-5 w-14" />
  </div>
))}
```

### Checklist
- [ ] Does the skeleton's parent container use the same className as the actual component?
- [ ] Is there a corresponding skeleton for every visual element (icon, text, badge, score)?
- [ ] Are responsive hidden classes applied to skeletons as well?
- [ ] Do the rounded values match the actual component?
