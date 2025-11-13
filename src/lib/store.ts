
import { create } from 'zustand';
import {
  doc,
  addDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  type Firestore,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { uploadFile } from './activity-utils';
import { FirebaseApp } from 'firebase/app';

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
  setActivities: (activities: Activity[]) => void;
  setUsers: (users: UserProfile[]) => void;
  addActivity: (db: Firestore, userId: string, district: string, activity: Omit<Activity, 'id' | 'userId' | 'createdAt' | 'district'>, uploadTasks?: { registerFile?: File; pictureFile?: File; }) => Promise<void>;
  deleteActivity: (db: Firestore, id: string) => void;
}

const useStore = create<StoreState>()(
    (set) => ({
      activities: [],
      users: [],
      setActivities: (activities) => set({ activities }),
      setUsers: (users) => set({ users }),
      addActivity: async (db, userId, district, activity, uploadTasks) => {
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

        let docRef;
        try {
            docRef = await addDoc(collection(db, 'activities'), newActivity);
        } catch (serverError: any) {
             const permissionError = new FirestorePermissionError({
                path: 'activities',
                operation: 'create',
                requestResourceData: newActivity,
            }, serverError);
            errorEmitter.emit('permission-error', permissionError);
            // Re-throw the error so the UI can handle it (e.g., stop loading state)
            throw permissionError;
        }
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
