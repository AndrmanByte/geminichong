/** Gemini Pro Pixel 品牌标志：四角星「闪光」+ 辅星，品牌蓝紫渐变。 */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f8cff" />
          <stop offset="0.55" stopColor="#8b6bff" />
          <stop offset="1" stopColor="#ff7bd0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#logoBg)" />
      <path
        d="M24 8c1.6 9.2 3.8 11.4 13 13-9.2 1.6-11.4 3.8-13 13-1.6-9.2-3.8-11.4-13-13 9.2-1.6 11.4-3.8 13-13Z"
        fill="#fff"
      />
      <path
        d="M34.5 29.5c.7 3.9 1.6 4.8 5.5 5.5-3.9.7-4.8 1.6-5.5 5.5-.7-3.9-1.6-4.8-5.5-5.5 3.9-.7 4.8-1.6 5.5-5.5Z"
        fill="#fff"
        fillOpacity="0.75"
      />
    </svg>
  );
}
