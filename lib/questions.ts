import { supabase } from "@/lib/supabase";
import type { Question } from "@/lib/types";

const QUESTION_SELECT = `
  id,
  body,
  author,
  pinned,
  created_at,
  category:categories(id, name, slug, color),
  votes(count),
  attachments(id, file_name, file_path, file_type, file_size)
`;

function normalizeCategory(raw: unknown): Question["category"] {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) return (raw[0] as Question["category"]) ?? null;
  return raw as Question["category"];
}

function mapQuestion(row: Record<string, unknown>): Question {
  const attachments = (row.attachments as Question["attachments"]) ?? [];
  const votes = row.votes as { count: number }[] | undefined;

  return {
    id: row.id as string,
    body: row.body as string,
    author: row.author as string | null,
    votes: votes?.[0]?.count ?? 0,
    pinned: Boolean(row.pinned),
    category: normalizeCategory(row.category),
    attachments: attachments.map((a) => ({
      ...a,
      url: publicAttachmentUrl(a.file_path),
    })),
  };
}

export function publicAttachmentUrl(filePath: string): string {
  const base = process.env.SUPABASE_URL;
  return `${base}/storage/v1/object/public/question-attachments/${filePath}`;
}

export async function getQuestionsPage(
  offset: number,
  limit: number,
  options?: { categoryId?: string; interests?: string[] }
) {
  let query = supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .order("pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  } else if (options?.interests?.length) {
    query = query.in("category_id", options.interests);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((q) => mapQuestion(q as Record<string, unknown>));
  const hasMore = rows.length > limit;
  return { questions: rows.slice(0, limit), hasMore };
}

export async function searchQuestions(
  q: string,
  limit: number,
  options?: { categoryId?: string; interests?: string[] }
) {
  let query = supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .textSearch("body", q, { type: "websearch", config: "english" })
    .order("pinned", { ascending: false })
    .limit(limit);

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  } else if (options?.interests?.length) {
    query = query.in("category_id", options.interests);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapQuestion(row as Record<string, unknown>)
  );
}

export async function togglePin(questionId: string, pinned: boolean) {
  const { data, error } = await supabase
    .from("questions")
    .update({
      pinned,
      pinned_at: pinned ? new Date().toISOString() : null,
    })
    .eq("id", questionId)
    .select("id, pinned")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
