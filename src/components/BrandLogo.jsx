export function BrandLogo({ variant = "sidebar", className = "" }) {
  if (variant === "wordmark") {
    return (
      <img
        src="/brand/mast-logo.svg"
        alt="MAST"
        className={`brand-logo wordmark ${className}`.trim()}
      />
    );
  }

  return <span className={`brand-logo text ${className}`.trim()}>MAST</span>;
}
