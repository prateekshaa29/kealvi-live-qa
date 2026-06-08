import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pollId, optionId, voterId } = await req.json();

    // Check if user already voted in this poll
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("voter_id", voterId)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted in this poll" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: voterId,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}