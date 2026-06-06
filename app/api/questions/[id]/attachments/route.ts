import { supabase } from "@/lib/supabase";
import { publicAttachmentUrl } from "@/lib/questions";

const BUCKET = "question-attachments";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "file required" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `${questionId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      question_id: questionId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type || null,
      file_size: file.size,
    })
    .select("id, file_name, file_path, file_type, file_size")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    ...data,
    url: publicAttachmentUrl(filePath),
  });
}
