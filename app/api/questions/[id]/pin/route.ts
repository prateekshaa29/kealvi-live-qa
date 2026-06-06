import { togglePin } from "@/lib/questions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { pinned } = await req.json();

  const data = await togglePin(id, Boolean(pinned));
  return Response.json(data);
}
