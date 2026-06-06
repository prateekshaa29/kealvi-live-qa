import { getCategories } from "@/lib/categories";

export async function GET() {
  const categories = await getCategories();
  return Response.json({ categories });
}
