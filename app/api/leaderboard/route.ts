import { getLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  const leaderboard = await getLeaderboard();
  return Response.json({ leaderboard });
}
