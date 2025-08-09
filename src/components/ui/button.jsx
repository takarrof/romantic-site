const Button = ({ className = "", variant = "primary", ...props }) => {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary:
      "bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white hover:opacity-95 focus:ring-pink-300",
    secondary:
      "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 focus:ring-zinc-300",
    ghost:
      "bg-transparent border border-white/30 text-white hover:bg-white/10 focus:ring-white/30",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props} />
  );
};
export default Button;
