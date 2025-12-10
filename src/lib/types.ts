
export interface AttachmentDoc {
  id?: string;
  date: string; // ISO date string
  title: string;
  notes?: string;
  registerAttachmentUrl?: string | null;
  pictureAttachmentUrls?: string[];
  userId?: string;
  district?: string;
  createdAt?: any;
  [key: string]: any;
}

export type UploadProgress = Record<string, number>;
