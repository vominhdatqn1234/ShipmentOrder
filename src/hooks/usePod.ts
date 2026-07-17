/**
 * CRUD hooks cho TeementPOD clone — chạy trên Supabase qua lib/db.
 */
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "lib/db";
import { firestore } from "lib/firebase";
import { sbSelectAll } from "lib/supabase";
import {
  BaseProduct,
  Design,
  PodOrder,
  PodStore,
  PodVariant,
} from "../models/pod";
import { useUser } from "../store/useUser";
import { usePodStore } from "../store/usePodStore";

const storesRef = collection(firestore, "stores");
const colorsRef = collection(firestore, "podColors");
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

/* ------- Mã màu phôi (admin cấu hình): tên màu -> hex, làm nền thiết kế ------- */

export function usePodColors() {
  const q = useQuery(["pod-colors"], () => getDocs(query(colorsRef)), {
    staleTime: 5 * 60 * 1000,
  });
  const colors = snapshotToList<{ id: string; name: string; hex: string }>(
    q.data
  );
  return { ...q, colors };
}

/* -------- Bảng giá phôi POD (biến thể) — đồng bộ từ admin để tính giá đơn -------- */

export function usePodVariants() {
  // Bảng giá phôi rất lớn (hàng nghìn dòng) — phải phân trang để lấy ĐỦ,
  // nếu không danh sách phôi sẽ bị thiếu (PostgREST mặc định chỉ trả ~1000 dòng).
  const q = useQuery(
    ["pod-variants"],
    async () => {
      const rows = await sbSelectAll("podVariants", {
        order: [{ column: "product", ascending: true }],
      });
      return rows.map((r) => {
        const { created_at, ...rest } = r as any;
        return rest as PodVariant;
      });
    },
    { staleTime: 5 * 60 * 1000 }
  );
  return { ...q, variants: (q.data as PodVariant[]) || [] };
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

/**
 * Đơn của seller. Mặc định chỉ lấy đơn của store đang chọn (mỗi store có
 * đơn riêng biệt). Truyền { allStores: true } khi cần đơn của mọi store
 * (vd: tổng chi tiêu, trang hồ sơ).
 */
export function usePodOrders(opts?: { allStores?: boolean }) {
  const { user } = useUser();
  const { selectedStoreId } = usePodStore();
  const userId = user?.id || "";
  const byStore = !opts?.allStores && !!selectedStoreId;
  const q = useQuery(
    ["pod-orders", userId, byStore ? selectedStoreId : "all"],
    () =>
      getDocs(
        query(
          ordersRef,
          where("userId", "==", userId),
          ...(byStore ? [where("storeId", "==", selectedStoreId)] : []),
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

/**
 * 3 loại phí của seller hiện tại (admin cấu hình trên bảng employee):
 * markup (phí in thêm), perOrderFee (phí xử lý đơn), discount (ưu đãi).
 * Fetch trực tiếp để admin đổi phí là client thấy ngay (không cần
 * đăng nhập lại). extra = phí cộng thêm mỗi đơn = markup + XL - ưu đãi.
 */
export function useSellerFees() {
  const { user } = useUser();
  const userId = user?.id || "";
  const q = useQuery(
    ["pod-seller-fees", userId],
    () => getDoc(doc(collection(firestore, "employee"), userId)),
    { enabled: !!userId }
  );
  const fresh = (q.data as any)?.data?.() || {};
  const markup = Number(fresh.markup ?? user?.markup ?? 0) || 0;
  const perOrderFee =
    Number(fresh.perOrderFee ?? user?.perOrderFee ?? 0) || 0;
  const discount = Number(fresh.discount ?? user?.discount ?? 0) || 0;
  return {
    markup,
    perOrderFee,
    discount,
    extra: markup + perOrderFee - discount,
  };
}

/**
 * Tổng chi tiêu = tổng total của đơn đã thanh toán (không tính chờ
 * thanh toán/hủy) + (markup + phí XL đơn - ưu đãi) × số đơn.
 * Giá hiển thị trên từng đơn vẫn là total gốc (vd $124), nhưng tổng
 * chi tiêu tính đủ phí (vd 124 + 1.5 = $125.50).
 */
export function useTotalSpend() {
  const { orders } = usePodOrders({ allStores: true });
  const { extra } = useSellerFees();
  const counted = orders.filter(
    (o) => !["pending_payment", "cancelled"].includes(o.status)
  );
  const subtotal = counted.reduce((s, o) => s + (o.total || 0), 0);
  return subtotal + extra * counted.length;
}
