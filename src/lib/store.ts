import { create } from "zustand";
import {
  doc,
  addDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  type Firestore,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { FirebaseApp } from "firebase/app";
import { uploadFile } from "./upload-utils";
import type { Activity, AttachmentDoc, UploadTasks, UserProfile, UploadProgress } from "./types";

interface StoreState {
  activities: Activity[];
  attachments: AttachmentDoc[];
  users: UserProfile[];
  isUploading: boolean;
  uploadProgress: UploadProgress;

  setActivities: (activities: Activity[]) => void;
  setAttachments: (attachments: AttachmentDoc[]) => void;
  setUsers: (users: UserProfile[]) => void;

  addActivity: (
    db: Firestore,
    userId: string,
    district: string,
    activity: Omit<Activity, "id" | "userId" | "createdAt" | "district">
  ) => Promise<string>;

  addAttachment: (
    db: Firestore,
    app: FirebaseApp,
    userId: string,
    district: string,
    attachment: { date: Date; title: string; notes?: string },
    uploadTasks: UploadTasks
  ) => Promise<string>;

  deleteActivity: (db: Firestore, id: string) => Promise<void>;
  deleteAttachment: (db: Firestore, id: string) => Promise<void>;
}

const useStore = create<StoreState>((set, get) => ({
  activities: [],
  attachments: [],
  users: [],
  isUploading: false,
  uploadProgress: {},

  setActivities: (activities) => set({ activities }),
  setAttachments: (attachments) => set({ attachments }),
  setUsers: (users) => set({ users }),

  addActivity: async (db, userId, district, activity) => {
    if (!userId) throw new Error("User is not authenticated.");
    try {
        const newActivity = {
        ...activity,
        userId,
        district,
        createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "activities"), newActivity);
        return docRef.id;
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError(
            {
            path: "activities",
            operation: "create",
            requestResourceData: activity,
            },
            serverError
        );
        errorEmitter.emit("permission-error", permissionError);
        throw permissionError;
    }
  },

  addAttachment: async (db, app, userId, district, attachmentData, uploadTasks) => {
    if (!userId) throw new Error("User not authenticated.");
    if (!app) throw new Error("Firebase app not provided.");

    console.log("[addAttachment] Starting attachment upload process", { userId, district, uploadTasks });
    set({ isUploading: true, uploadProgress: {} });
    let docRef: DocumentReference | null = null;

    try {
      // 1. Create Firestore doc with safe fields
      const newAttachment: Omit<AttachmentDoc, "id"> = {
        date: attachmentData.date.toISOString(),
        title: attachmentData.title,
        notes: attachmentData.notes || "",
        userId,
        district,
        createdAt: serverTimestamp(),
        registerAttachmentUrl: null,
        pictureAttachmentUrls: [],
      };

      console.log("[addAttachment] Creating Firestore document...");
      docRef = await addDoc(collection(db, "attachments"), newAttachment);
      console.log("[addAttachment] Firestore document created:", docRef.id);

      const updateProgress = (fileName: string, progress: number) => {
        console.log(`[addAttachment] Progress update for ${fileName}: ${progress}%`);
        set((state) => ({
          uploadProgress: { ...state.uploadProgress, [fileName]: progress },
        }));
      };

      const uploadPromises: Promise<any>[] = [];
      const updatePayload: Partial<AttachmentDoc> = {};
      
      const uploadAndTrack = async (file: File, key: 'registerAttachmentUrl' | 'pictureAttachmentUrls') => {
        try {
          console.log(`[addAttachment] Uploading file: ${file.name} to key: ${key}`);
          const url = await uploadFile(app, file, docRef!.id, (p) => updateProgress(file.name, p));
          console.log(`[addAttachment] File uploaded successfully: ${file.name} -> ${url}`);
          if (key === 'registerAttachmentUrl') {
            updatePayload.registerAttachmentUrl = url;
          } else {
            if (!updatePayload.pictureAttachmentUrls) {
              updatePayload.pictureAttachmentUrls = [];
            }
            updatePayload.pictureAttachmentUrls.push(url);
          }
        } catch (uploadError) {
          console.error(`[addAttachment] Failed to upload ${file.name}:`, uploadError);
          // We throw here to make sure the Promise.all fails
          throw uploadError;
        }
      };
      
      // 2. Handle Register File
      if (uploadTasks?.registerFile) {
        console.log("[addAttachment] Queuing register file for upload");
        uploadPromises.push(uploadAndTrack(uploadTasks.registerFile, 'registerAttachmentUrl'));
      }

      // 3. Handle Picture Files
      if (uploadTasks?.pictureFiles && uploadTasks.pictureFiles.length > 0) {
        console.log(`[addAttachment] Queuing ${uploadTasks.pictureFiles.length} picture files for upload`);
        uploadTasks.pictureFiles.forEach(file => {
          uploadPromises.push(uploadAndTrack(file, 'pictureAttachmentUrls'));
        });
      }
      
      // 4. Wait for all uploads to settle
      console.log(`[addAttachment] Waiting for ${uploadPromises.length} uploads to complete...`);
      await Promise.all(uploadPromises);
      console.log("[addAttachment] All uploads completed successfully");

      // 5. Update Firestore with all URLs at once if there are any
      if (Object.keys(updatePayload).length > 0) {
        console.log("[addAttachment] Updating Firestore with URLs:", updatePayload);
        await updateDoc(docRef, updatePayload);
        console.log("[addAttachment] Firestore document updated with URLs");
      } else {
        console.warn("[addAttachment] No URLs to update in Firestore");
      }
      
      // Reset state after a brief delay to allow UI to show 100% progress
      setTimeout(() => {
        console.log("[addAttachment] Resetting upload state");
        set({ isUploading: false, uploadProgress: {} });
      }, 500);
      
      console.log("[addAttachment] Upload process completed successfully");
      return docRef.id;

    } catch (error: any) {
        console.error("[addAttachment] Upload process failed:", error);
        const isCreateOp = !docRef;
        // If an error occurs, especially during uploads, we need to inform the user.
        // The FirestorePermissionError is a good way to wrap this.
        const permissionError = new FirestorePermissionError(
            {
                path: isCreateOp ? "attachments" : `attachments/${docRef?.id}`,
                operation: isCreateOp ? "create" : "update",
                requestResourceData: { message: "File upload or document operation failed", error: error?.message },
            },
            error
        );
        // Reset state immediately on error
        set({ isUploading: false, uploadProgress: {} });
        // We throw the error so the form's own catch block can handle it.
        throw permissionError;
    }
  },

  deleteActivity: async (db, id) => {
    try {
      const activityRef = doc(db, "activities", id);
      await deleteDoc(activityRef);
    } catch (err) {
      const permissionError = new FirestorePermissionError({
        path: `activities/${id}`,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    }
  },

  deleteAttachment: async (db, id) => {
    try {
      const attachmentRef = doc(db, "attachments", id);
      await deleteDoc(attachmentRef);
    } catch (err) {
      const permissionError = new FirestorePermissionError({
        path: `attachments/${id}`,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
      throw permissionError;
    }
  },
}));

export default useStore;
export type { UserProfile };
