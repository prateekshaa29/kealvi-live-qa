import { supabase } from "@/lib/supabase";
import type { ReportSummary } from "@/lib/types";

export async function getReportSummary(): Promise<ReportSummary> {
  const [
    { count: total_questions },
    { count: total_votes },
    { count: total_attachments },
    { count: pinned_count },
    { data: categories },
    { data: questions },
  ] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("votes").select("id", { count: "exact", head: true }),
    supabase.from("attachments").select("id", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("pinned", true),
    supabase.from("categories").select("id, name, slug, color"),
    supabase
      .from("questions")
      .select("id, body, author, votes(count)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const categoryCounts = await Promise.all(
    (categories ?? []).map(async (cat) => {
      const { count } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id);
      return {
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        count: count ?? 0,
      };
    })
  );

  const top_questions = (questions ?? [])
    .map((q) => ({
      id: q.id,
      body: q.body,
      author: q.author,
      votes: (q.votes as { count: number }[])?.[0]?.count ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10);

  return {
    total_questions: total_questions ?? 0,
    total_votes: total_votes ?? 0,
    total_attachments: total_attachments ?? 0,
    pinned_count: pinned_count ?? 0,
    by_category: categoryCounts.sort((a, b) => b.count - a.count),
    top_questions,
  };
}
