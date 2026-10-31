type MaskLinesProps = {
  as?: "h2" | "p";
  lines: string[];
  className?: string;
};

// Headline split into fixed lines, each inside an overflow-hidden mask so
// useChapterMotion can lift it into view. The padding keeps Vietnamese
// diacritics and descenders from being clipped by the mask.
export function MaskLines({
  as: Tag = "h2",
  lines,
  className,
}: MaskLinesProps) {
  return (
    <Tag data-lines className={className}>
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden py-[0.12em]">
          <span data-line className="block">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
