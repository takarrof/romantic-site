export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-3xl border border-white/20 bg-white/70 dark:bg-zinc-900/40 backdrop-blur ${className}`}
      {...props}
    />
  );
}
export function CardContent({ className = "", ...props }) {
  return <div className={`p-6 ${className}`} {...props} />;
}
