import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const voterId = searchParams.get("voterId");
  if (!voterId) {
    return Response.json({ error: "voterId required" }, { status: 400 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(voterId),
    getUnreadCount(voterId),
  ]);

  return Response.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const { voterId, notificationId, markAll } = await req.json();
  if (!voterId) {
    return Response.json({ error: "voterId required" }, { status: 400 });
  }

  if (markAll) {
    await markAllNotificationsRead(voterId);
  } else if (notificationId) {
    await markNotificationRead(notificationId, voterId);
  } else {
    return Response.json({ error: "notificationId or markAll required" }, { status: 400 });
  }

  const unreadCount = await getUnreadCount(voterId);
  return Response.json({ ok: true, unreadCount });
}
