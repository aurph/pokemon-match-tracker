/** Crisp upscaled pixel-art sprite. Plain <img> so we control rendering; sprites live in /public. */
export function PixelSprite({
  src,
  alt = "",
  size = 32,
  className = "",
}: {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`pixelated ${className}`}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
