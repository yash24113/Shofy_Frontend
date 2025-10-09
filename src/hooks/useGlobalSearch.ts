// hooks/useGlobalSearch.ts
'use client';
import { useEffect, useState } from 'react';
import { publishSearchQuery, subscribeSearch, getLatestQuery } from '@/utils/searchHub';

function useDebounced<T>(value: T, delay = 250) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

export default function useGlobalSearch(debounceMs = 250) {
  const [query, setQuery] = useState<string>(getLatestQuery());
  const debounced = useDebounced(query, debounceMs);

  // reflect external publishers
  useEffect(() => subscribeSearch(setQuery), []);

  // publish when debounced changes
  useEffect(() => { publishSearchQuery(debounced); }, [debounced]);

  return { query, setQuery, debounced };
}
