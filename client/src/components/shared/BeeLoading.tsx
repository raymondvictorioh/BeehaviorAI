/**
 * BeeLoading - Simple bee emoji loading component
 *
 * Shows the bee emoji animation with "Loading..." text.
 * Used for simple loading states where no skeleton is needed
 * (e.g., Suspense fallbacks, auth loading, etc.)
 *
 * Uses min-h-screen to ensure proper centering when displayed
 * without a navbar (e.g., initial app loading), while still
 * working correctly with h-full in contexts where parent has height.
 */
export function BeeLoading() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-8xl animate-bounce">🐝</div>
        <p className="text-muted-foreground mt-4">Buzzing...</p>
      </div>
    </div>
  );
}

