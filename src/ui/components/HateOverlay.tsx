export function HateOverlay({ hate }: { hate: number }) {
  if (hate <= 8) return null;
  return <div className="hate-overlay" aria-hidden="true" />;
}
