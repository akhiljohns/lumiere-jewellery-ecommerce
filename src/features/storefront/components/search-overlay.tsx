"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { useSearchProducts } from "@/features/storefront/api/search-products";
import { formatCurrency, getPrimaryImage } from "@/lib/utils";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useSearchProducts({
    query: debouncedQuery,
    limit: 6,
  });

  const results = data?.data ?? [];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setDebouncedQuery("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const product = results[highlightedIndex];
        if (product) {
          onOpenChange(false);
          window.location.href = `/products/${product.slug}`;
        }
      }
    },
    [results, highlightedIndex, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg top-[20%] translate-y-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search jewellery..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        <div ref={resultsRef} className="max-h-80 overflow-y-auto">
          {isLoading && debouncedQuery && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && debouncedQuery && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products found for &quot;{debouncedQuery}&quot;
            </p>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="space-y-1">
              {results.map((product, i) => {
                const image = getPrimaryImage(product.product_images);
                return (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => onOpenChange(false)}
                      className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted ${
                        i === highlightedIndex ? "bg-muted" : ""
                      }`}
                    >
                      {image ? (
                        <CloudinaryImage
                          src={image.url}
                          alt={product.name}
                          width={40}
                          height={40}
                          crop="fill"
                          className="rounded-md"
                        />
                      ) : (
                        <div className="size-10 rounded-md bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {!debouncedQuery && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Type to search products...
            </p>
          )}
        </div>

        {debouncedQuery && results.length > 0 && (
          <div className="border-t border-border pt-2">
            <Link
              href={`/products?search=${encodeURIComponent(debouncedQuery)}`}
              onClick={() => onOpenChange(false)}
              className="block text-center text-xs font-medium text-primary hover:underline"
            >
              View all results
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
