import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (*)
    `);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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