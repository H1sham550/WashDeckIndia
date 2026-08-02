import Image from "next/image";
import { cn } from "@/lib/utils";

type WashDeckLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "full" | "icon" | "responsive";
};

export function WashDeckLogo({
  className,
  priority = false,
  variant = "responsive",
}: WashDeckLogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/brand/washdeck-shield-logo.png"
        alt="WashDeck"
        width={300}
        height={300}
        priority={priority}
        suppressHydrationWarning
        className={cn("h-8 w-8 object-contain", className)}
      />
    );
  }

  if (variant === "full") {
    return (
      <Image
        src="/brand/washdeck-logo-transparent.png"
        alt="WashDeck"
        width={1168}
        height={368}
        priority={priority}
        suppressHydrationWarning
        className={cn(
          "h-10 w-auto object-contain mix-blend-multiply brightness-[1.15] contrast-[1.15]",
          className
        )}
      />
    );
  }

  return (
    <>
      {/* Mobile: Shield Icon without text */}
      <Image
        src="/brand/washdeck-shield-logo.png"
        alt="WashDeck"
        width={300}
        height={300}
        priority={priority}
        suppressHydrationWarning
        className={cn("h-8 w-8 object-contain block md:hidden", className)}
      />
      {/* Desktop: Full Logo with typography */}
      <Image
        src="/brand/washdeck-logo-transparent.png"
        alt="WashDeck"
        width={1168}
        height={368}
        priority={priority}
        suppressHydrationWarning
        className={cn(
          "h-10 w-auto object-contain",
          className
        )}
      />
    </>
  );
}
