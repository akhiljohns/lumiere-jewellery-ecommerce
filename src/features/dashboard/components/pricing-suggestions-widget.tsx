"use client";

import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPricingSuggestions } from "@/features/dashboard/api/get-pricing-suggestions";
import { formatCurrency } from "@/lib/utils";

const priorityVariant: Record<string, "default" | "secondary" | "destructive"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export function PricingSuggestionsWidget() {
  const { data, isLoading } = useGetPricingSuggestions();
  const result = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const topSuggestions = result.suggestions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4" />
          Pricing Suggestions
        </CardTitle>
        <CardDescription>
          {result.summary.products_needing_attention} products need pricing attention ·
          Avg discount: {result.margin_analysis.avg_discount_percentage}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topSuggestions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            All products are priced optimally
          </p>
        ) : (
          <div className="space-y-3">
            {topSuggestions.map((suggestion) => (
              <Link
                key={suggestion.product_id}
                href={`/admin/products/${suggestion.product_id}/edit`}
                className="flex items-start justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {suggestion.product_name}
                    </span>
                    <Badge variant={priorityVariant[suggestion.priority]}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {suggestion.reason}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-medium">
                      {formatCurrency(suggestion.current_price)}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span className="text-primary">
                      Compare: {formatCurrency(suggestion.suggested_compare_price)}
                    </span>
                    <span className="text-muted-foreground">
                      ({suggestion.discount_percentage}% off)
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
