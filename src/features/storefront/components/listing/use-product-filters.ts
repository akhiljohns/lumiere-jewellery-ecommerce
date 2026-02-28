"use client";

import { useQueryStates, parseAsString, parseAsInteger, parseAsFloat } from "nuqs";

export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      sort: parseAsString.withDefault("created_at"),
      order: parseAsString.withDefault("desc"),
      category: parseAsString,
      material: parseAsString,
      min_price: parseAsFloat,
      max_price: parseAsFloat,
      search: parseAsString,
    },
    {
      shallow: false,
    },
  );

  function setFilter<K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) {
    setFilters({ [key]: value, page: key === "page" ? value : 1 } as Partial<
      typeof filters
    >);
  }

  function resetFilters() {
    setFilters({
      page: 1,
      sort: "created_at",
      order: "desc",
      category: null,
      material: null,
      min_price: null,
      max_price: null,
      search: null,
    });
  }

  return { filters, setFilter, setFilters, resetFilters };
}
