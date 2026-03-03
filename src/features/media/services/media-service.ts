import { createAdminClient } from "@/lib/supabase/admin";
import {
  uploadImage as cloudinaryUpload,
  deleteImage as cloudinaryDelete,
} from "@/lib/cloudinary";
import type { Media } from "../types";

interface ListMediaParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listMedia(params: ListMediaParams = {}) {
  const { page = 1, limit = 24, search } = params;
  const supabase = createAdminClient();

  let query = supabase
    .from("media")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`filename.ilike.%${search}%,alt_text.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    data: (data ?? []) as Media[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMediaById(id: string): Promise<Media | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Media;
}

interface CreateMediaInput {
  file: string;
  filename?: string;
  alt_text?: string;
  uploaded_by?: string;
}

export async function createMediaRecord(input: CreateMediaInput): Promise<Media> {
  const supabase = createAdminClient();

  // Upload to Cloudinary
  const result = await cloudinaryUpload(input.file, "jewellery-ecommerce/products");

  // Extract filename from original or from public_id
  const filename = input.filename || result.public_id.split("/").pop() || "untitled";

  const { data, error } = await supabase
    .from("media")
    .insert({
      url: result.url,
      public_id: result.public_id,
      filename,
      alt_text: input.alt_text ?? "",
      folder: "jewellery-ecommerce/products",
      uploaded_by: input.uploaded_by ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Media;
}

interface UpdateMediaInput {
  filename?: string;
  alt_text?: string;
}

export async function updateMedia(id: string, input: UpdateMediaInput): Promise<Media> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("media")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Media;
}

export async function deleteMedia(id: string): Promise<void> {
  const supabase = createAdminClient();

  // Get public_id first
  const { data: media, error: fetchError } = await supabase
    .from("media")
    .select("public_id")
    .eq("id", id)
    .single();

  if (fetchError || !media) throw new Error("Media not found");

  // Delete from Cloudinary
  await cloudinaryDelete(media.public_id);

  // Delete from database
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
