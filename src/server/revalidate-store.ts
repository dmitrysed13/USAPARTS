import { revalidatePath } from "next/cache";
import { bumpCache } from "@/lib/cache";

export async function revalidateStore(paths: string[] = []) {
  await bumpCache();
  revalidatePath("/", "layout");
  for (const path of paths) revalidatePath(path);
}
