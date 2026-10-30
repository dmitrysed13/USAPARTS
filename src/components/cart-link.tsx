"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CartLink() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/cart")
      .then((response) => response.json())
      .then((data: { count?: number }) => setCount(data.count ?? 0))
      .catch(() => setCount(null));
  }, []);
  return (
    <Link href="/cart" className="text-sm font-semibold text-navy">
      Корзина{count ? ` (${count})` : ""}
    </Link>
  );
}
