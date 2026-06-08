"use client";

import { useState, useEffect, useCallback } from "react";
import { getVoterId } from "@/lib/voter";
import {
  getLocalInterests,
  setLocalInterests,
} from "@/lib/interests-client";
import type { Category, Question } from "@/lib/types";

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
  categories,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
  categories: Category[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [authorName, setAuthorName] = useState<string>("");
  console.log("authorName =", authorName);
  const [categoryId, setCategoryId] = useState<string>("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [myInterestsOnly, setMyInterestsOnly] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<"question" | "poll">("question");
  const [pollQuestion, setPollQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [polls, setPolls] = useState<any[]>([]);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    async function loadPolls() {
      const res = await fetch("/api/polls");
      const data = await res.json();
      console.log("POLLS DATA:", data);
      setPolls(data);
    }

    loadPolls();
  }, []);

  const syncInterestsFromServer = useCallback(async () => {
    const voterId = getVoterId();
    const res = await fetch(
      `/api/interests?voterId=${encodeURIComponent(voterId)}`
    );
    if (res.ok) {
      const data = await res.json();
      const ids = data.categoryIds as string[];
      setInterests(ids);
      setLocalInterests(ids);
    } else {
      setInterests(getLocalInterests());
    }
  }, []);

  useEffect(() => {
    syncInterestsFromServer();

    const saved = localStorage.getItem("kealvi_author") ?? "";
    setAuthorName(saved);
  }, [syncInterestsFromServer]);

  function buildQueryUrl(offset?: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filterCategory) params.set("categoryId", filterCategory);
    else if (myInterestsOnly && interests.length)
      params.set("interests", interests.join(","));
    if (offset !== undefined) params.set("offset", String(offset));
    const qs = params.toString();
    return `/api/questions${qs ? `?${qs}` : ""}`;
  }

  useEffect(() => {
    const id = setTimeout(async () => {
      const res = await fetch(buildQueryUrl());
      const data = await res.json();
      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterCategory, myInterestsOnly, interests]);

  async function toggleInterest(catId: string) {
    const voterId = getVoterId();
    const following = interests.includes(catId);
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voterId,
        categoryId: catId,
        action: following ? "unfollow" : "follow",
      }),
    });
    const data = await res.json();
    setInterests(data.categoryIds);
    setLocalInterests(data.categoryIds);
  }

  async function uploadAttachments(questionId: string) {
    for (const file of pendingFiles) {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/questions/${questionId}/attachments`, {
        method: "POST",
        body: form,
      });
    }
  }

  async function submit() {
    if (!draft.trim()) return;

    const voterId = getVoterId();
    if (authorName.trim()) {
      localStorage.setItem("kealvi_author", authorName.trim());
    }

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: draft,
        author: authorName.trim() || "Anonymous",
        categoryId: categoryId || null,
        voterId,
      }),
    });
    const created = await res.json();
    if (!res.ok) return;

    if (pendingFiles.length) {
      await uploadAttachments(created.id);
      const refresh = await fetch(buildQueryUrl());
      const data = await refresh.json();
      setQuestions(data.questions);
    } else {
      setQuestions((qs) => [
        {
          ...created,
          votes: 0,
          pinned: false,
          attachments: [],
          category:
            categories.find((c) => c.id === categoryId) ?? created.category,
        },
        ...qs,
      ]);
    }

    setDraft("");
    setPendingFiles([]);
  }
  async function createPoll() {
    alert("CREATE POLL CLICKED");
    if (!pollQuestion.trim()) {
      alert("Enter a poll question");
      return;
    }

    if (!option1.trim() || !option2.trim()) {
      alert("Enter at least 2 options");
      return;
    }

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: pollQuestion,
        options: [option1, option2, option3, option4].filter(
          (o) => o.trim() !== ""
        ),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("API Error:", err);
      alert("Failed to create poll: " + err);
      return;
    }

    console.log("Poll created");

    alert("Poll created successfully!");

    setPollQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");

    window.location.reload();

  }
  async function upvote(id: string) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q))
    );

    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId() }),
    });

    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, votes: q.votes - 1 } : q))
      );
    }
  }

  async function togglePin(id: string, currentlyPinned: boolean) {
    const res = await fetch(`/api/questions/${id}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !currentlyPinned }),
    });
    if (!res.ok) return;

    setQuestions((qs) => {
      const updated = qs.map((q) =>
        q.id === id ? { ...q, pinned: !currentlyPinned } : q
      );
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return 0;
      });
    });
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(buildQueryUrl(questions.length));
    const data = await res.json();
    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      {/* Interests */}
      <section className="rounded-2xl border bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Your interests</h2>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={myInterestsOnly}
              onChange={(e) => {
                setMyInterestsOnly(e.target.checked);
                if (e.target.checked) setFilterCategory("");
              }}
              className="accent-brand"
            />
            My feed only
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = interests.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleInterest(cat.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active
                  ? "border-transparent text-white"
                  : "bg-background text-muted hover:border-brand hover:text-brand"
                  }`}
                style={
                  active
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                {active ? "✓ " : "+ "}
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Ask */}
      {/* Ask / Poll Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("question")}
          className={`rounded-xl px-4 py-2 ${mode === "question"
            ? "bg-brand text-white"
            : "border bg-surface"
            }`}
        >
          Ask Question
        </button>

        <button
          type="button"
          onClick={() => setMode("poll")}
          className={`rounded-xl px-4 py-2 ${mode === "poll"
            ? "bg-brand text-white"
            : "border bg-surface"
            }`}
        >
          Create Poll
        </button>
      </div>

      {/* Ask */}
      {mode === "question" ? (
        <div className="rounded-2xl border bg-surface p-4 shadow-sm">
          <div className="space-y-2">
            <input
              value={authorName ?? ""}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-xl border bg-background px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Category (optional)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <textarea
              value={draft ?? ""}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              rows={3}
              className="w-full resize-none rounded-xl border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-xl border bg-background px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand">
                Attach files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={(e) => {
                    const files = [...(e.target.files ?? [])];
                    setPendingFiles((prev) => [...prev, ...files].slice(0, 3));
                    e.target.value = "";
                  }}
                />
              </label>
              {pendingFiles.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="rounded-full bg-brand-soft px-2 py-1 text-xs text-brand"
                >
                  {f.name}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong sm:w-auto sm:px-6"
            >
              Ask
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-surface p-4 shadow-sm">
          <div className="space-y-2">
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Poll Question"
              className="w-full rounded-xl border px-4 py-2"
            />

            <input
              value={option1}
              onChange={(e) => setOption1(e.target.value)}
              placeholder="Option 1"
              className="w-full rounded-xl border px-4 py-2"
            />

            <input
              value={option2}
              onChange={(e) => setOption2(e.target.value)}
              placeholder="Option 2"
              className="w-full rounded-xl border px-4 py-2"
            />

            <input
              value={option3}
              onChange={(e) => setOption3(e.target.value)}
              placeholder="Option 3"
              className="w-full rounded-xl border px-4 py-2"
            />

            <input
              value={option4}
              onChange={(e) => setOption4(e.target.value)}
              placeholder="Option 4"
              className="w-full rounded-xl border px-4 py-2"
            />

            <button
              type="button"
              onClick={createPoll}
              className="rounded-xl bg-brand px-5 py-2 text-white"
            >
              Create Poll
            </button>
          </div>
        </div>
      )}
      {/* Filter + search */}
      {polls.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Polls</h2>

          {polls.map((poll) => (
            <div
              key={poll.id}
              className="rounded-2xl border bg-surface p-4 shadow-sm"
            >
              <h3 className="font-medium">{poll.title}</h3>

              <div className="mt-3 space-y-2">
                {poll.poll_options?.map((opt: any) => (
                  <div
                    key={opt.id}
                    className="rounded-lg border px-3 py-2"
                  >
                    {opt.option_text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory("")}
            className={`rounded-full border px-3 py-1 text-xs ${!filterCategory ? "bg-brand-soft font-medium text-brand" : "text-muted"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setFilterCategory(cat.id);
                setMyInterestsOnly(false);
              }}
              className={`rounded-full border px-3 py-1 text-xs ${filterCategory === cat.id
                ? "font-medium text-white"
                : "text-muted"
                }`}
              style={
                filterCategory === cat.id
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : undefined
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full flex-1 rounded-xl border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
          />
          <span className="shrink-0 text-xs text-muted">
            {hydrated ? "Live ✓" : "…"}
          </span>
        </div>
      </div>

      {/* List */}
      <ul className="space-y-3">
        {questions.map((q) => (
          <li
            key={q.id}
            className={`flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md ${q.pinned ? "ring-2 ring-brand/30" : ""
              }`}
          >
            <button
              type="button"
              onClick={() => upvote(q.id)}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3.5 py-2 text-brand transition-colors hover:border-brand hover:bg-brand-soft"
            >
              <span className="text-xs leading-none">▲</span>
              <span className="text-sm font-semibold leading-none tabular-nums">
                {q.votes}
              </span>
            </button>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {q.pinned && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                    Pinned
                  </span>
                )}
                {q.category && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: q.category.color }}
                  >
                    {q.category.name}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => togglePin(q.id, q.pinned)}
                  className="ml-auto text-xs text-muted hover:text-brand"
                  title={q.pinned ? "Unpin" : "Pin"}
                >
                  {q.pinned ? "Unpin" : "Pin"}
                </button>
              </div>
              <p className="leading-snug">{q.body}</p>
              {q.attachments?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {q.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand underline-offset-2 hover:underline"
                      >
                        📎 {a.file_name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {q.author && (
                <p className="mt-1.5 text-xs text-muted">{q.author}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {questions.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
          No questions yet — be the first to ask.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
