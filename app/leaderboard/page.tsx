import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Ranked by upvotes received and questions asked.
        </p>
      </header>

      <ol className="space-y-2">
        {leaderboard.map((entry, index) => (
          <li
            key={entry.author}
            className="flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-sm"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                index === 0
                  ? "bg-amber-100 text-amber-800"
                  : index === 1
                    ? "bg-zinc-200 text-zinc-700"
                    : index === 2
                      ? "bg-orange-100 text-orange-800"
                      : "bg-brand-soft text-brand"
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{entry.author}</p>
              <p className="text-xs text-muted">
                {entry.questions} questions · {entry.total_votes} upvotes
              </p>
            </div>
            <span className="text-lg font-semibold tabular-nums text-brand">
              {entry.score}
            </span>
          </li>
        ))}
      </ol>

      {leaderboard.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
          No contributors yet.
        </p>
      )}
    </main>
  );
}
