"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Users,
  ShoppingCart,
  FolderTree,
  LayoutDashboard,
  ShieldCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { fetchApi } from "@/lib/api-client";
import { ADMIN_SEARCH } from "@/lib/api-routes";
import { formatCurrency } from "@/lib/utils";

interface SearchResult {
  id: string;
  name?: string;
  email?: string;
  full_name?: string;
  order_number?: string;
  slug?: string;
  price?: number;
  total?: number;
  status?: string;
  role?: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Roles", href: "/admin/roles", icon: ShieldCheck },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
];

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [users, setUsers] = useState<SearchResult[]>([]);
  const [orders, setOrders] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setProducts([]);
      setUsers([]);
      setOrders([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [prodRes, userRes, orderRes] = await Promise.allSettled([
          fetchApi<{ data: SearchResult[] }>(
            `${ADMIN_SEARCH}?q=${encodeURIComponent(query)}&type=products&limit=5`,
          ),
          fetchApi<{ data: SearchResult[] }>(
            `${ADMIN_SEARCH}?q=${encodeURIComponent(query)}&type=users&limit=5`,
          ),
          fetchApi<{ data: SearchResult[] }>(
            `${ADMIN_SEARCH}?q=${encodeURIComponent(query)}&type=orders&limit=5`,
          ),
        ]);

        setProducts(prodRes.status === "fulfilled" ? prodRes.value.data : []);
        setUsers(userRes.status === "fulfilled" ? userRes.value.data : []);
        setOrders(orderRes.status === "fulfilled" ? orderRes.value.data : []);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const hasResults = products.length > 0 || users.length > 0 || orders.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Admin Search"
      description="Search across products, users, and orders"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search products, users, orders..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!query && (
            <CommandGroup heading="Navigation">
              {NAV_ITEMS.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => navigate(item.href)}
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query && !isSearching && !hasResults && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {products.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Products">
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => navigate(`/admin/products/${p.id}`)}
                  >
                    <Package className="size-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{p.name}</span>
                      {p.price != null && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(p.price)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {users.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Users">
                {users.map((u) => (
                  <CommandItem
                    key={u.id}
                    onSelect={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <Users className="size-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{u.full_name || u.email}</span>
                      {u.role && (
                        <span className="text-xs text-muted-foreground">
                          {u.role}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {orders.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Orders">
                {orders.map((o) => (
                  <CommandItem
                    key={o.id}
                    onSelect={() => navigate(`/admin/orders/${o.id}`)}
                  >
                    <ShoppingCart className="size-4 text-muted-foreground" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>#{o.order_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {o.status}
                        {o.total != null && ` · ${formatCurrency(o.total)}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
