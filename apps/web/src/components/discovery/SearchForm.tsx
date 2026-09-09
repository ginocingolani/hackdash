"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/ui/Input";

// URL-synced discovery search: typing debounces into a router.replace of
// ?q=… so results render server-side and stay shareable (§2.2 item 6).
// The input itself is client state, so focus and caret survive re-renders.

const DEBOUNCE_MS = 350;

export interface SearchFormProps {
  /** Server-rendered initial value from searchParams. */
  initialQuery?: string;
  placeholder: string;
  /** Accessible name for the search field. */
  label: string;
  className?: string;
}

export function SearchForm({ initialQuery = "", placeholder, label, className }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function navigate(raw: string) {
    const q = raw.trim();
    router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, {
      scroll: false,
    });
  }

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <SearchInput
        name="q"
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
        }}
      />
    </form>
  );
}
