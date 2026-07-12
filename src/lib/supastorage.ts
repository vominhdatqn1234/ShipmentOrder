/**
 * Firebase Storage-compatible API chạy trên Supabase Storage (bucket "uploads").
 * Giữ nguyên API: ref, uploadBytesResumable (uploadTask.on + snapshot.ref), getDownloadURL
 */
import { sbStoragePublicUrl, sbStorageUpload } from "./supabase";

export type FirebaseStorage = { __type: "storage" };

export const storageInstance: FirebaseStorage = { __type: "storage" };

export function getStorage(_app?: any): FirebaseStorage {
  return storageInstance;
}

export interface StorageReference {
  __type: "storageRef";
  path: string;
}

export function ref(
  _storage: FirebaseStorage | any,
  path: string
): StorageReference {
  return { __type: "storageRef", path: path.replace(/^\/+/, "") };
}

export interface UploadTaskSnapshot {
  bytesTransferred: number;
  totalBytes: number;
  ref: StorageReference;
}

export class UploadTask {
  readonly snapshot: UploadTaskSnapshot;
  private readonly promise: Promise<void>;

  constructor(storageRef: StorageReference, file: Blob) {
    this.snapshot = {
      bytesTransferred: 0,
      totalBytes: (file as any).size || 0,
      ref: storageRef,
    };
    this.promise = sbStorageUpload(storageRef.path, file).then(() => {
      this.snapshot.bytesTransferred = this.snapshot.totalBytes;
    });
  }

  on(
    _event: string,
    onProgress?: (snapshot: UploadTaskSnapshot) => void,
    onError?: (error: any) => void,
    onComplete?: () => void
  ): void {
    this.promise
      .then(() => {
        if (onProgress) onProgress(this.snapshot);
        if (onComplete) onComplete();
      })
      .catch((err) => {
        if (onError) onError(err);
      });
  }

  then<T>(
    onFulfilled?: (snapshot: UploadTaskSnapshot) => T
  ): Promise<T | void> {
    return this.promise.then(() =>
      onFulfilled ? onFulfilled(this.snapshot) : undefined
    );
  }

  catch(onRejected?: (error: any) => any): Promise<any> {
    return this.promise.catch(onRejected);
  }
}

export function uploadBytesResumable(
  storageRef: StorageReference,
  file: Blob
): UploadTask {
  return new UploadTask(storageRef, file);
}

export async function getDownloadURL(
  storageRef: StorageReference
): Promise<string> {
  return sbStoragePublicUrl(storageRef.path);
}
