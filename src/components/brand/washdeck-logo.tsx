import Image from "next/image";
import { cn } from "@/lib/utils";

type WashDeckLogoProps = {
  className?: string;
  priority?: boolean;
};

export function WashDeckLogo({ className, priority = false }: WashDeckLogoProps) {
  return (
    <Image
      src="/brand/washdeck-logo-transparent.png"
      alt="WashDeck"
      width={1168}
      height={368}
      priority={priority}
      className={cn("h-auto w-48 object-contain mix-blend-multiply brightness-[1.15] contrast-[1.15]", className)}
    />
  );
