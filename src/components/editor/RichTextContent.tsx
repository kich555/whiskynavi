import { cn } from "@/lib/utils";

interface RichTextContentProps {
  html: string;
  className?: string;
}

export default function RichTextContent({ html, className }: RichTextContentProps) {
  return (
    <div
      className={cn(
        "max-w-none break-words whitespace-pre-wrap [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-h-[32rem] [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:min-h-[1.5em] [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
