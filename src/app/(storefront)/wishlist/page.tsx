"use client";

import Link from "next/link";
import { Heart, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { CloudinaryImage } from "@/components/cloudinary-image";
import { PriceDisplay } from "@/features/storefront/components/price-display";
import { AddToCartButton } from "@/features/storefront/components/add-to-cart-button";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { useGetWishlist } from "@/features/wishlist/api/get-wishlist";
import { useRemoveWishlistItem } from "@/features/wishlist/api/remove-wishlist-item";
import { useWishlistStore } from "@/stores/wishlist-store";
import { getPrimaryImage } from "@/lib/utils";
import type { PublicProduct } from "@/features/storefront/types";
import type { WishlistItemWithProduct } from "@/features/wishlist/services/wishlist-service";

function toPublicProduct(item: WishlistItemWithProduct): PublicProduct {
  const product = item.products;
  return {
    ...product,
    categories: null,
  };
}

export default function WishlistPage() {
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const { data, isLoading } = useGetWishlist();
  const removeItem = useRemoveWishlistItem();
  const wishlistStore = useWishlistStore();

  const user = profileData?.data;
  const items = data?.data ?? [];

  if (profileLoading || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Heart className="mx-auto size-16 text-muted-foreground/50" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          Sign in to view your wishlist
        </h1>
        <p className="mt-2 text-muted-foreground">
          Save your favourite pieces and come back to them anytime.
        </p>
        <Link
          href="/signin"
          className={buttonVariants({ className: "mt-6" })}
        >
          Sign in
        </Link>
      </div>
    );
  }

  function handleRemove(productId: string) {
    removeItem.mutate(productId, {
      onSuccess: () => {
        wishlistStore.remove(productId).catch(() => {});
        toast.success("Removed from wishlist");
      },
      onError: () => {
        toast.error("Failed to remove item");
      },
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-foreground">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart className="mx-auto size-16 text-muted-foreground/50" />
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-muted-foreground">
            Browse our collection and save the pieces you love.
          </p>
          <Link
            href="/products"
            className={buttonVariants({ className: "mt-6" })}
          >
            Explore products
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const product = item.products;
            const primaryImage = getPrimaryImage(product.product_images);
            const isActive = product.is_active;
            const inStock = product.stock > 0;

            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                {/* Image */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted sm:size-28"
                >
                  {primaryImage ? (
                    <CloudinaryImage
                      src={primaryImage.url}
                      alt={product.name}
                      fill
                      crop="fill"
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm font-medium text-foreground hover:underline sm:text-base"
                    >
                      {product.name}
                    </Link>
                    {product.material && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.material}
                      </p>
                    )}
                    <div className="mt-1">
                      <PriceDisplay
                        price={product.price}
                        comparePrice={product.compare_price}
                        size="sm"
                      />
                    </div>
                    {!isActive && (
                      <p className="mt-1 text-xs text-destructive">
                        This product is no longer available
                      </p>
                    )}
                    {isActive && !inStock && (
                      <p className="mt-1 text-xs text-destructive">
                        Out of stock
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    {isActive && inStock && (
                      <AddToCartButton
                        product={toPublicProduct(item)}
                        showQuantity={false}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(product.id)}
                      disabled={removeItem.isPending}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
