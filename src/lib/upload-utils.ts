import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";

/**
 * Upload a single File to Storage under: attachments/{docId}/{timestamp}_{filename}
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

  console.log(`[uploadFile] Starting upload for: ${file.name} (${file.size} bytes) to path: ${path}`);

  try {
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);

      let lastProgress = 0;
      // timeout if upload stalls for too long (2 minutes)
      const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;
      const timeoutId = setTimeout(() => {
        console.error(`[uploadFile] Upload timed out for ${file.name} after ${UPLOAD_TIMEOUT_MS}ms`);
        try { task.cancel(); } catch (e) { /* ignore */ }
        reject(new Error("Upload timed out"));
      }, UPLOAD_TIMEOUT_MS);

      task.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
          console.log(`[uploadFile] Progress for ${file.name}: ${progress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
          lastProgress = progress;
          onProgress(progress);
        },
        (err) => {
          clearTimeout(timeoutId);
          console.error(`[uploadFile] Upload failed for ${file.name}:`, err);
          console.error(`[uploadFile] Last known progress: ${lastProgress}%`);
          reject(err);
        },
        () => {
          clearTimeout(timeoutId);
          console.log(`[uploadFile] Upload completed for ${file.name}`);
          resolve();
        }
      );
    });

    // Get the download URL after the upload is complete
    console.log(`[uploadFile] Fetching download URL for: ${path}`);
    const url = await getDownloadURL(storageRef);
    console.log(`[uploadFile] Download URL obtained: ${url}`);
    return url;
  } catch (err) {
    console.error(`[uploadFile] Failed to upload file: ${file.name}`, err);
    throw err;
  }
}
