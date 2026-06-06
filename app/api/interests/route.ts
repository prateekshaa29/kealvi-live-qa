import {
  followCategory,
  unfollowCategory,
  getFollowedCategoryIds,
} from "@/lib/interests";

export async function GET(req: Request) {
  const voterId = new URL(req.url).searchParams.get("voterId");
  if (!voterId) {
    return Response.json({ error: "voterId required" }, { status: 400 });
  }
  const categoryIds = await getFollowedCategoryIds(voterId);
  return Response.json({ categoryIds });
}

export async function POST(req: Request) {
  const { voterId, categoryId, action } = await req.json();
  if (!voterId || !categoryId) {
    return Response.json({ error: "voterId and categoryId required" }, { status: 400 });
  }

  if (action === "unfollow") {
    await unfollowCategory(voterId, categoryId);
  } else {
    await followCategory(voterId, categoryId);
  }

  const categoryIds = await getFollowedCategoryIds(voterId);
  return Response.json({ categoryIds });
}
