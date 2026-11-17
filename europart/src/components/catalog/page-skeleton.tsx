import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <Container className="grid gap-4 py-10">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </Container>
  );
}
