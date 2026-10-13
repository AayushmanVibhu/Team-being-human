export function KinliiSymbol() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="11" cy="11" r="4" />
      <circle cx="25" cy="11" r="4" />
      <path d="M5 27c1-6 4-9 8-9 2 0 3.8 1 5 2.6C19.2 19 21 18 23 18c4 0 7 3 8 9" />
      <path d="M13.5 24c2.8 2.6 6.2 2.6 9 0" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <span className="kinlii-mark">
        <KinliiSymbol />
      </span>
      <span className="logo-copy">
        <b>kinlii</b>
        <small>Less Screen. More Seen.</small>
      </span>
    </div>
  );
}
