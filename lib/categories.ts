import { supabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, color")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}
