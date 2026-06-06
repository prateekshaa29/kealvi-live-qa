import { getReportSummary } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const summary = await getReportSummary();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Summary &amp; reporting
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Activity overview across questions, votes, and categories.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Questions", value: summary.total_questions },
          { label: "Votes", value: summary.total_votes },
          { label: "Attachments", value: summary.total_attachments },
          { label: "Pinned", value: summary.pinned_count },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border bg-surface p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-semibold tabular-nums text-brand">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-2xl border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium">By category</h2>
        <ul className="space-y-2">
          {summary.by_category.map((cat) => (
            <li key={cat.slug} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm">{cat.name}</span>
              <span className="text-sm font-medium tabular-nums">{cat.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium">Top questions by votes</h2>
        <ol className="space-y-3">
          {summary.top_questions.map((q, i) => (
            <li key={q.id} className="flex gap-3 text-sm">
              <span className="shrink-0 font-semibold text-muted">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <p className="leading-snug">{q.body}</p>
                {q.author && (
                  <p className="mt-0.5 text-xs text-muted">{q.author}</p>
                )}
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-brand">
                {q.votes}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
