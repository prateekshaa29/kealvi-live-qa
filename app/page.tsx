import QuestionsList from "./questions-list";
import { getQuestionsPage } from "@/lib/questions";
import { getCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  const [{ questions, hasMore }, categories] = await Promise.all([
    getQuestionsPage(0, PAGE_SIZE),
    getCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:py-10">
      <header className="mb-6">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Live now
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Live Q&amp;A
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Ask a question, pick a category, attach files, and upvote favorites.
        </p>
        <p className="mt-2 text-xs text-muted">
          Install on mobile: browser menu → Add to Home Screen
        </p>
      </header>
      <QuestionsList
        initialQuestions={questions}
        initialHasMore={hasMore}
        categories={categories}
      />
    </main>
  );
}
