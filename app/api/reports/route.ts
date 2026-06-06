import { getReportSummary } from "@/lib/reports";

export async function GET() {
  const summary = await getReportSummary();
  return Response.json(summary);
}
