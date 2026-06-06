"use client";

import { useEffect, useState } from "react";
import { getVoterId } from "@/lib/voter";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const voterId = getVoterId();
    const res = await fetch(
      `/api/notifications?voterId=${encodeURIComponent(voterId)}`
    );
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voterId: getVoterId(),
        notificationId: id,
      }),
    });
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId(), markAll: true }),
    });
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 sm:py-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Upvotes on your questions and new posts in categories you follow.
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand"
          >
            Mark all read
          </button>
        )}
      </header>

      {loading && (
        <p className="text-center text-sm text-muted">Loading…</p>
      )}

      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-2xl border p-4 shadow-sm ${
              n.read ? "bg-surface opacity-75" : "bg-brand-soft/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && (
                  <p className="mt-1 text-xs text-muted">{n.body}</p>
                )}
                <p className="mt-1.5 text-[10px] uppercase tracking-wide text-muted">
                  {n.type} · {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="shrink-0 text-xs text-brand hover:underline"
                >
                  Read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!loading && notifications.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
          No notifications yet. Follow categories or ask questions to receive
          alerts.
        </p>
      )}
    </main>
  );
}
