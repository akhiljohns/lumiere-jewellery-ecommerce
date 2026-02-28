import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  price,
  comparePrice,
  size = "md",
  className,
}: PriceDisplayProps) {
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span
        className={cn("font-semibold text-foreground", {
          "text-sm": size === "sm",
          "text-base": size === "md",
          "text-xl": size === "lg",
        })}
      >
        {formatCurrency(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn("text-muted-foreground line-through", {
              "text-xs": size === "sm",
              "text-sm": size === "md",
              "text-base": size === "lg",
            })}
          >
            {formatCurrency(comparePrice)}
          </span>
          <Badge variant="secondary" className="text-[0.625rem]">
            {discountPercent}% off
          </Badge>
        </>
      )}
    </div>
  );
}
