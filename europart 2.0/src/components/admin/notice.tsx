"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NoticeText() {
  const message = useSearchParams().get("error");
  if (!message) {
    return null;
  }
  return (
    <p
      className="mb-4 rounded-control border border-danger/20 bg-brand-soft px-4 py-3 text-sm"
      role="alert"
    >
      {message}
    </p>
  );
}

export function AdminNotice() {
  return (
    <Suspense fallback={null}>
      <NoticeText />
    </Suspense>
  );
}
