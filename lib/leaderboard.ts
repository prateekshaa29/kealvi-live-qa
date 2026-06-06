import { supabase } from "@/lib/supabase";
import type { LeaderboardEntry } from "@/lib/types";

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("author, votes(count)")
    .not("author", "is", null);

  if (error) throw new Error(error.message);

  const byAuthor = new Map<string, { questions: number; total_votes: number }>();

  for (const q of questions ?? []) {
    const author = q.author as string;
    if (!author?.trim()) continue;
    const votes = (q.votes as { count: number }[])?.[0]?.count ?? 0;
    const cur = byAuthor.get(author) ?? { questions: 0, total_votes: 0 };
    byAuthor.set(author, {
      questions: cur.questions + 1,
      total_votes: cur.total_votes + votes,
    });
  }

  return [...byAuthor.entries()]
    .map(([author, stats]) => ({
      author,
      questions: stats.questions,
      total_votes: stats.total_votes,
      score: stats.total_votes * 2 + stats.questions,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
