
import { create } from 'zustand';
import {
  doc,
  addDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { FirebaseApp } from 'firebase/app';
import type { AttachmentDoc, UploadProgress } from './types';

export interface Activity {
  id: string;
  date: string;
  type: string; // e.g., 'Weekly Plan', 'Health Talk'
  details: any; // This will hold specific data for the activity type
  userId?: string;
  district?: string;
  createdAt: any;
}

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    role: string;
    district?: string;
    [key: string]: any;
}

interface StoreState {
  activities: Activity[];
  users: UserProfile[];
  attachments: AttachmentDoc[];
  setActivities: (activities: Activity[]) => void;
  setUsers: (users: UserProfile[]) => void;
  setAttachments: (attachments: AttachmentDoc[]) => void;
  addActivity: (app: FirebaseApp, db: Firestore, userId: string, district: string, activity: Omit<Activity, 'id' | 'userId' | 'createdAt' | 'district'>) => Promise<void>;
  // Attachments
  addAttachment: (db: Firestore, app: FirebaseApp, userId: string, district: string, attachmentData: { date: Date; title: string; notes?: string; }, uploadTasks: { registerFile?: File | null; pictureFiles?: File[] | null; }) => Promise<void>;
  deleteAttachment: (db: Firestore, id: string) => void;
  isUploading: boolean;
  uploadProgress: UploadProgress;
  deleteActivity: (db: Firestore, id: string) => void;
}

const useStore = create<StoreState>()(
    (set) => ({
      activities: [],
      users: [],
      attachments: [],
      setActivities: (activities) => set({ activities }),
      setUsers: (users) => set({ users }),
      setAttachments: (attachments) => set({ attachments }),
      isUploading: false,
      uploadProgress: {},
      addActivity: async (app, db, userId, district, activity) => {
        if (!userId) {
            console.error("User is not authenticated.");
            throw new Error("User is not authenticated.");
        };

        const newActivity = {
          ...activity,
          userId,
          district,
          createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'activities'), newActivity);
        } catch (serverError: any) {
             const permissionError = new FirestorePermissionError({
                path: 'activities',
                operation: "create",
                requestResourceData: newActivity,
            }, serverError);
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
      },
      addAttachment: async (db, app, userId, district, attachmentData, uploadTasks) => {
        // This function is now a no-op since Document Upload is removed.
        // Kept to avoid breaking references if any exist, but does nothing.
        console.warn('addAttachment is deprecated and no longer functions.');
        return Promise.resolve();
      },
      deleteAttachment: (db, id) => {
        // This function is now a no-op since Document Upload is removed.
        console.warn('deleteAttachment is deprecated and no longer functions.');
      },
      deleteActivity: (db, id) => {
        const activityRef = doc(db, 'activities', id);
        deleteDoc(activityRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: activityRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      },
    }),
);

export default useStore;
