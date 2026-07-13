import { collection, getDocs, limit, query, where } from "lib/db";
import { firestore } from "lib/firebase";
import { useUser } from "../store/useUser";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Kiểm tra tài khoản seller còn tồn tại/không bị vô hiệu hóa.
 * Gọi trước các hành động quan trọng (vd: tạo đơn). Nếu tài khoản đã bị
 * admin xóa hoặc vô hiệu hóa -> tự đăng xuất và trả về false.
 */
export function useAccountGuard() {
  const { user, setUser } = useUser();
  const [, setToken] = useLocalStorage("token", null);

  const ensureAccount = async (): Promise<boolean> => {
    if (!user?.id || !user?.email) return true; // thiếu thông tin -> bỏ qua
    try {
      const snap = await getDocs(
        query(
          collection(firestore, "employee"),
          where("email", "==", user.email),
          limit(1)
        )
      );
      const rows: any[] = [];
      (snap as any)?.forEach?.((d: any) => rows.push({ id: d.id, ...d.data() }));
      const acc = rows[0];
      if (!acc || acc.id !== user.id || acc.disabled) {
        setToken(null);
        setUser({});
        window.location.href = "/auth/login";
        return false;
      }
      return true;
    } catch {
      return true; // lỗi mạng -> không đá user ra ngoài
    }
  };

  return { ensureAccount };
}
