import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("GET ROUTE RUNNING");
  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (*)
    `);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const pollsWithVotes = await Promise.all(
    polls.map(async (poll: any) => {
      const optionsWithVotes = await Promise.all(
        poll.poll_options.map(async (option: any) => {
          const { count } = await supabase
            .from("poll_votes")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("option_id", option.id);

          return {
            ...option,
            vote_count: count || 0,
          };
        })
      );

      return {
        ...poll,
        poll_options: optionsWithVotes,
      };
    })
  );

  return NextResponse.json(pollsWithVotes);
}

export async function POST(req: Request) {
  const { title, options } = await req.json();

  if (!title || !options || options.length < 2) {
    return NextResponse.json(
      { error: "Title and at least 2 options required" },
      { status: 400 }
    );
  }

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      title,
    })
    .select()
    .single();

  if (pollError) {
    return NextResponse.json(
      { error: pollError.message },
      { status: 500 }
    );
  }

  const optionRows = options.map((option: string) => ({
    poll_id: poll.id,
    option_text: option,
  }));

  const { error: optionError } = await supabase
    .from("poll_options")
    .insert(optionRows);

  if (optionError) {
    return NextResponse.json(
      { error: optionError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    poll,
  });
}