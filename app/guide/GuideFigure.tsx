/** 教程配图：点击可在新标签页查看大图 */
export function GuideFigure({ src, alt }: { src: string; alt: string }) {
  return (
    <a className="guide-figure" href={src} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </a>
  );
}
