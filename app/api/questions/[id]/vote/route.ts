import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const { voterId } = await req.json();

  const { data: question } = await supabase
    .from("questions")
    .select("body, author_voter_id")
    .eq("id", questionId)
    .single();

  const { error } = await supabase
    .from("votes")
    .insert({ question_id: questionId, voter_id: voterId });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "already voted" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (
    question?.author_voter_id &&
    question.author_voter_id !== voterId
  ) {
    await createNotification({
      recipientId: question.author_voter_id,
      type: "vote",
      title: "Your question got an upvote",
      body: question.body?.slice(0, 120) ?? undefined,
      questionId,
    }).catch(() => {});
  }

  return Response.json({ ok: true });
}
