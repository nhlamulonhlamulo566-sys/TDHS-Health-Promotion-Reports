import type { Timestamp } from "firebase/firestore";

export interface Activity {
  id: string;
  date: string; // ISO string
  type: string;
  details: Record<string, any>;
  userId?: string;
  district?: string;
  createdAt?: Timestamp | any;
}

export interface AttachmentDoc {
  id?: string;
  date: string; // ISO string
  title: string;
  notes?: string;
  userId?: string;
  district?: string;
  registerAttachmentUrl?: string | null;
  pictureAttachmentUrls?: string[];
  createdAt?: any;
  // uploadStatus: 'pending' | 'complete' | 'failed' - helps UI reflect upload progress persisted in Firestore
  uploadStatus?: string;
  uploadError?: string;
}

export interface UploadTasks {
  registerFile?: File | null;
  pictureFiles?: File[] | null;
}

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    role: string;
    district?: string;
    [key: string]: any;
}

export interface UploadProgress {
  [fileName: string]: number;
}
