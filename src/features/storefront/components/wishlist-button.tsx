"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useGetProfile } from "@/features/auth/api/get-profile";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { isWishlisted, toggle } = useWishlistStore();
  const { data: profile } = useGetProfile();
  const wishlisted = isWishlisted(productId);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!profile) {
      toast.error("Please log in to add items to your wishlist");
      return;
    }

    try {
      const added = await toggle(productId);
      toast.success(added ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      toast.error("Failed to update wishlist");
    }
  }

  return (
    <motion.div whileTap={{ scale: 0.85 }}>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "rounded-full bg-background/80 backdrop-blur-sm hover:bg-background",
          className,
        )}
        onClick={handleToggle}
      >
        <Heart
          className={cn(
            "size-3.5",
            wishlisted
              ? "fill-destructive text-destructive"
              : "text-muted-foreground",
          )}
        />
        <span className="sr-only">
          {wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        </span>
      </Button>
    </motion.div>
  );
}
