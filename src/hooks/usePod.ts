/**
 * CRUD hooks cho TeementPOD clone — chạy trên Supabase qua lib/db.
 */
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "lib/db";
import { firestore } from "lib/firebase";
import {
  BaseProduct,
  Design,
  PodOrder,
  PodStore,
} from "../models/pod";
import { useUser } from "../store/useUser";
import { usePodStore } from "../store/usePodStore";

const storesRef = collection(firestore, "stores");
const productsRef = collection(firestore, "baseProducts");
const designsRef = collection(firestore, "designs");
const ordersRef = collection(firestore, "podOrders");

function snapshotToList<T>(snapshot: any): T[] {
  const out: T[] = [];
  snapshot?.forEach((d: any) => out.push({ id: d.id, ...d.data() }));
  return out;
}

/* ---------------- Stores (mỗi user có cửa hàng riêng) ---------------- */

export function useStores() {
  const { user } = useUser();
  const userId = user?.id || "";
  const q = useQuery(
    ["pod-stores", userId],
    () => getDocs(query(storesRef, where("userId", "==", userId))),
    { enabled: !!userId }
  );
  return { ...q, stores: snapshotToList<PodStore>(q.data) };
}

export function useStoreMutations() {
  const qc = useQueryClient();
  const { user } = useUser();
  const invalidate = () => qc.invalidateQueries(["pod-stores"]);
  const add = useMutation(
    (data: Partial<PodStore>) =>
      addDoc(storesRef, { ...data, userId: user?.id || "" }),
    { onSuccess: invalidate }
  );
  const update = useMutation(
    ({ id, ...data }: Partial<PodStore> & { id: string }) =>
      updateDoc(doc(storesRef, id), data),
    { onSuccess: invalidate }
  );
  const remove = useMutation((id: string) => deleteDoc(doc(storesRef, id)), {
    onSuccess: invalidate,
  });
  return { add, update, remove };
}

/* ---------------- Base products (phôi) ---------------- */

export function useBaseProducts() {
  const q = useQuery(["pod-products"], () =>
    getDocs(query(productsRef, orderBy("created", "desc")))
  );
  return { ...q, products: snapshotToList<BaseProduct>(q.data) };
}

/* ------- Designs (thư viện SKU — riêng theo user và từng cửa hàng) ------- */

export function useDesigns() {
  const { user } = useUser();
  const { selectedStoreId } = usePodStore();
  const userId = user?.id || "";
  const q = useQuery(
    ["pod-designs", userId, selectedStoreId],
    () =>
      getDocs(
        query(
          designsRef,
          where("userId", "==", userId),
          where("storeId", "==", selectedStoreId)
        )
      ),
    { enabled: !!userId && !!selectedStoreId }
  );
  // Sort ổn định (mới nhất trước) — tránh UPDATE làm đảo thứ tự hàng trên bảng
  const designs = snapshotToList<Design>(q.data).sort((a, b) => {
    const c = (b.created || "").localeCompare(a.created || "");
    return c !== 0 ? c : a.sku.localeCompare(b.sku);
  });
  return { ...q, designs };
}

export function useDesignMutations() {
  const qc = useQueryClient();
  const { user } = useUser();
  const { selectedStoreId } = usePodStore();
  const invalidate = () => qc.invalidateQueries(["pod-designs"]);
  const add = useMutation(
    (data: Partial<Design>) =>
      addDoc(designsRef, {
        ...data,
        userId: user?.id || "",
        storeId: selectedStoreId,
      }),
    { onSuccess: invalidate }
  );
  const update = useMutation(
    ({ id, ...data }: Partial<Design> & { id: string }) =>
      updateDoc(doc(designsRef, id), data),
    { onSuccess: invalidate }
  );
  const remove = useMutation((id: string) => deleteDoc(doc(designsRef, id)), {
    onSuccess: invalidate,
  });
  const removeMany = useMutation(
    async (ids: string[]) => {
      for (const id of ids) await deleteDoc(doc(designsRef, id));
    },
    { onSuccess: invalidate }
  );
  return { add, update, remove, removeMany };
}

/* ---------------- Orders (theo user) ---------------- */

export function usePodOrders() {
  const { user } = useUser();
  const userId = user?.id || "";
  const q = useQuery(
    ["pod-orders", userId],
    () =>
      getDocs(
        query(
          ordersRef,
          where("userId", "==", userId),
          orderBy("created", "desc")
        )
      ),
    { enabled: !!userId }
  );
  return { ...q, orders: snapshotToList<PodOrder>(q.data) };
}

export function usePodOrderMutations() {
  const qc = useQueryClient();
  const { user } = useUser();
  const userId = user?.id || "";
  const invalidate = () => qc.invalidateQueries(["pod-orders"]);
  const add = useMutation(
    (data: Partial<PodOrder>) => addDoc(ordersRef, { ...data, userId }),
    { onSuccess: invalidate }
  );
  const addMany = useMutation(
    async ({
      list,
      onProgress,
    }: {
      list: { id?: string; data: Partial<PodOrder> }[];
      onProgress?: (done: number, total: number) => void;
    }) => {
      let done = 0;
      for (const row of list) {
        const data = { ...row.data, userId };
        if (row.id) await setDoc(doc(ordersRef, row.id), data);
        else await addDoc(ordersRef, data);
        done += 1;
        onProgress?.(done, list.length);
      }
    },
    { onSuccess: invalidate }
  );
  const update = useMutation(
    ({ id, ...data }: Partial<PodOrder> & { id: string }) =>
      updateDoc(doc(ordersRef, id), data),
    { onSuccess: invalidate }
  );
  const remove = useMutation((id: string) => deleteDoc(doc(ordersRef, id)), {
    onSuccess: invalidate,
  });
  const removeMany = useMutation(
    async ({
      ids,
      onProgress,
    }: {
      ids: string[];
      onProgress?: (done: number, total: number) => void;
    }) => {
      let done = 0;
      for (const id of ids) {
        await deleteDoc(doc(ordersRef, id));
        done += 1;
        onProgress?.(done, ids.length);
      }
    },
    { onSuccess: invalidate }
  );
  return { add, addMany, update, remove, removeMany };
}

/* Tổng chi tiêu = tổng total của đơn đã thanh toán (không tính chờ thanh toán/hủy) */
export function useTotalSpend() {
  const { orders } = usePodOrders();
  return orders
    .filter((o) => !["pending_payment", "cancelled"].includes(o.status))
    .reduce((s, o) => s + (o.total || 0), 0);
}
