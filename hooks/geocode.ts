"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { reverseGeocode, searchAddresses } from "@/services/geocode.api";

export const geocodeKeys = {
  all: ["geocode"] as const,
  search: (query: string) => ["geocode", "search", query] as const,
};

const SEARCH_DEBOUNCE_MS = 600;

// Address search with internal debounce: the component passes every
// keystroke, the query fires only after the user pauses typing.
export function useAddressSearch(query: string) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);
  const trimmed = debounced.trim();
  return useQuery({
    queryKey: geocodeKeys.search(trimmed),
    queryFn: () => searchAddresses(trimmed),
    enabled: trimmed.length >= 3,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Reverse lookup after a map tap or marker drag. A mutation (not a
// query): it fires on explicit user gestures, never on render.
export function useReverseGeocode() {
  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      reverseGeocode(lat, lng),
    retry: 1,
  });
}
