import { supabase } from "@/lib/supabase";

export async function followCategory(voterId: string, categoryId: string) {
  const { error } = await supabase
    .from("category_followers")
    .upsert({ voter_id: voterId, category_id: categoryId });

  if (error) throw new Error(error.message);
}

export async function unfollowCategory(voterId: string, categoryId: string) {
  const { error } = await supabase
    .from("category_followers")
    .delete()
    .eq("voter_id", voterId)
    .eq("category_id", categoryId);

  if (error) throw new Error(error.message);
}

export async function getFollowedCategoryIds(
  voterId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("category_followers")
    .select("category_id")
    .eq("voter_id", voterId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.category_id);
}
