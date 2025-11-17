import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";

/**
 * Upload a single File to Storage under: activities/{docId}/{timestamp}_{filename}
 * Returns the public download URL (string).
 * Reports progress via an optional callback.
 * Throws an error if the upload fails.
 */
export async function uploadFile(
  app: FirebaseApp,
  file: File,
  docId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const storage = getStorage(app);
  const timestamp = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `attachments/${docId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  try {
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);
      task.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(progress);
        },
        (err) => reject(err), // Reject the promise on error
        () => resolve() // Resolve the promise on success
      );
    });

    // Get the download URL after the upload is complete
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (err) {
    console.error("Failed to upload file:", file.name, err);
    throw err; // Re-throw the error to be caught by the calling function
  }
}
