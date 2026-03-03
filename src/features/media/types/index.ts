export interface Media {
  id: string;
  url: string;
  public_id: string;
  filename: string;
  alt_text: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  folder: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaListResponse {
  data: Media[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
