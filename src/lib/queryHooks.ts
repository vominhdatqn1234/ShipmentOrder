/**
 * Thay thế @react-query-firebase/firestore, chạy trên Supabase qua lib/db.
 *   useFirestoreQuery(key, ref)            -> useQuery trả QuerySnapshot
 *   useFirestoreCollectionMutation(collRef) -> useMutation gọi addDoc
 */
import { useMutation, useQuery } from "react-query";
import {
  addDoc,
  CollectionReference,
  getDocs,
  Query,
  QuerySnapshot,
} from "./db";

export function useFirestoreQuery(
  key: any,
  ref: Query | CollectionReference,
  _options?: any,
  useQueryOptions?: any
) {
  return useQuery<QuerySnapshot, Error>(
    key,
    () => getDocs(ref),
    useQueryOptions
  );
}

export function useFirestoreCollectionMutation(
  ref: CollectionReference,
  useMutationOptions?: any
) {
  return useMutation(
    (data: any) => addDoc(ref, data),
    useMutationOptions
  );
}
