import { supabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";

export async function getNotifications(
  recipientId: string,
  limit = 30
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, question_id, read, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createNotification(input: {
  recipientId: string;
  type: string;
  title: string;
  body?: string;
  questionId?: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    recipient_id: input.recipientId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    question_id: input.questionId ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function markNotificationRead(id: string, recipientId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("recipient_id", recipientId);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(recipientId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", recipientId)
    .eq("read", false);

  if (error) throw new Error(error.message);
}

/** Notify users who follow this category (stored as voter ids in interests). */
export async function notifyCategoryFollowers(
  categoryId: string,
  categoryName: string,
  questionId: string,
  excludeVoterId?: string
) {
  const { data: followers } = await supabase
    .from("category_followers")
    .select("voter_id")
    .eq("category_id", categoryId);

  if (!followers?.length) return;

  const rows = followers
    .filter((f) => f.voter_id !== excludeVoterId)
    .map((f) => ({
      recipient_id: f.voter_id,
      type: "category",
      title: `New in ${categoryName}`,
      body: "A question was posted in a category you follow.",
      question_id: questionId,
    }));

  if (rows.length) {
    await supabase.from("notifications").insert(rows);
  }
}
