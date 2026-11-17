import type { Metadata } from "next";

export const closedRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};

export function closedMetadata(input: {
  title: string;
  description?: string | null;
  canonical: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description || undefined,
    alternates: { canonical: input.canonical },
    robots: closedRobots,
  };
}
