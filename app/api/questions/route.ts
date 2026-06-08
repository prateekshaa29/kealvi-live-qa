import { supabase } from "@/lib/supabase";
import { getQuestionsPage, searchQuestions } from "@/lib/questions";
import { getCategories } from "@/lib/categories";
import { notifyCategoryFollowers } from "@/lib/notifications";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const interestsParam = searchParams.get("interests");
  const interests = interestsParam
    ? interestsParam.split(",").filter(Boolean)
    : undefined;

  const options = { categoryId, interests };

  if (q) {
    const questions = await searchQuestions(q, PAGE_SIZE, options);
    return Response.json({ questions, hasMore: false });
  }

  const offset = Number(searchParams.get("offset") ?? 0);
  const { questions, hasMore } = await getQuestionsPage(
    offset,
    PAGE_SIZE,
    options
  );
  return Response.json({ questions, hasMore });
}

export async function POST(req: Request) {
  const { body, author, categoryId, voterId } = await req.json();

  const { data, error } = await supabase
  .from("questions")
  .insert({
    body,
    author: author ?? "Anonymous",
    category_id: categoryId ?? null,
  })
    .select(
      "id, body, author, pinned, category:categories(id, name, slug, color)"
    )
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (categoryId) {
    const categories = await getCategories();
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      await notifyCategoryFollowers(
        categoryId,
        cat.name,
        data.id,
        voterId
      ).catch(() => {});
    }
  }

  return Response.json({
    ...data,
    votes: 0,
    attachments: [],
    category: data.category,
  });
}
