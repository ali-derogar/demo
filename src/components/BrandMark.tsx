export function BrandMark() {
  return (
    <span className="wordmark__mark" aria-hidden="true">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
        <path d="M12 3v3M2 11v4M22 11v4" />
        <rect x="4" y="6" width="16" height="14" rx="4" />
        <path d="m9 10-2 2 2 2m6-4 2 2-2 2M9 17h6" />
      </svg>
    </span>
  );
}
