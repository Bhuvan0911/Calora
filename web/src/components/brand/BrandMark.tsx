import Image from 'next/image';

export function BrandMark({
  size = 32,
  withName = true,
}: {
  size?: number;
  withName?: boolean;
}) {
  const tag = Math.max(14, Math.round(size * 0.5));
  const markWidth = Math.round(size * (536 / 660));

  return (
    <span className="inline-flex items-center leading-none" style={{ gap: Math.max(8, Math.round(size * 0.22)) }}>
      <Image
        src="/brand/logo-c.png"
        alt=""
        width={markWidth}
        height={size}
        className="block object-contain"
        priority
      />
      {withName && (
        <span
          className="whitespace-nowrap font-semibold tracking-tight text-foreground"
          style={{ fontSize: tag, lineHeight: 1 }}
        >
          Calora
        </span>
      )}
    </span>
  );
}
