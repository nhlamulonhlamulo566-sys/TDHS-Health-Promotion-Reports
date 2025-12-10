
'use client';

import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { FirebaseApp } from "firebase/app";

// This utility function is designed to separate file inputs from the rest of
// the form data. It returns the data ready to be stored in Firestore and the
// files ready to be uploaded to Firebase Storage.

export async function prepareActivityData(data: any, type: string) {
    const { registerFile, pictureFile, ...firestoreData } = data;

    const activityData = {
        date: firestoreData.date.toISOString(),
        type,
        details: {
            ...firestoreData,
            registerAttachment: null,
            pictureAttachment: null,
        }
    };
    
    const uploadTasks: { registerFile?: File, pictureFile?: File } = {};
    if (registerFile) {
        activityData.details.registerAttachment = registerFile.name;
        uploadTasks.registerFile = registerFile;
    }
    if (pictureFile) {
        activityData.details.pictureAttachment = pictureFile.name;
        uploadTasks.pictureFile = pictureFile;
    }

    return {
        activityData,
        uploadTasks,
    };
}


export async function uploadFile(app: FirebaseApp, file: File, activityId: string, onProgress?: (progress: number) => void): Promise<string> {
    if (!app) {
        throw new Error("Firebase app not initialized");
    }

    const storage = getStorage(app);
    const storageRef = ref(storage, `activities/${activityId}/${file.name}`);

    return await new Promise<string>((resolve, reject) => {
        try {
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = snapshot.totalBytes > 0 ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
                    try {
                        onProgress?.(pct);
                    } catch (e) {
                        console.warn('onProgress handler failed', e);
                    }
                },
                (error) => {
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(storageRef);
                        resolve(downloadURL);
                    } catch (err) {
                        reject(err);
                    }
                }
            );
        } catch (err) {
            reject(err);
        }
    });
}
