export function isIndexableListing(input: {
  productCount: number;
  sort?: string;
  availability?: string;
  condition?: string;
  q?: string;
  engine?: string;
}) {
  if (input.productCount < 1) return false;
  if (input.q || input.sort || input.availability || input.condition || input.engine) return false;
  return true;
}

export function canonicalPath(path: string, page?: number) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (page && page > 1) return `${clean}?page=${page}`;
  return clean;
}
