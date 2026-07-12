/**
 * Đã migrate sang Supabase.
 * File này giữ nguyên tên export { firestore, storage } để các file import
 * "lib/firebase" không phải sửa gì — bên dưới đã là Supabase.
 */
import { firestoreInstance } from "./db";
import { storageInstance } from "./supastorage";

const firestore = firestoreInstance;
const storage = storageInstance;

export { firestore, storage };
