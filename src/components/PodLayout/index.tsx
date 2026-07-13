import { Dropdown, Select, Tooltip } from "antd";
import { useEffect, useState } from "react";
import {
  FiGrid,
  FiTag,
  FiPenTool,
  FiShoppingBag,
  FiHome,
  FiLifeBuoy,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useStores, useTotalSpend } from "../../hooks/usePod";
import { usePodStore } from "../../store/usePodStore";
import { useUser } from "../../store/useUser";

const MENU = [
  { to: "/dashboard", label: "Tổng quan", icon: <FiGrid />, end: true },
  { to: "/dashboard/catalog", label: "Danh mục phôi", icon: <FiTag /> },
  { to: "/dashboard/designs", label: "Thiết kế của tôi", icon: <FiPenTool /> },
  { to: "/dashboard/orders", label: "Đơn hàng", icon: <FiShoppingBag /> },
  { to: "/dashboard/stores", label: "Quản lý Cửa hàng", icon: <FiHome /> },
  { to: "/dashboard/services", label: "Dịch vụ hỗ trợ", icon: <FiLifeBuoy /> },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function PodLayout() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [, setToken] = useLocalStorage("token", null);
  const { stores, isFetched } = useStores();
  const {
    selectedStoreId,
    setSelectedStoreId,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = usePodStore();
  const totalSpend = useTotalSpend();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isFetched) return; // chờ load xong danh sách store của user
    if (!stores.length) {
      // User này chưa có cửa hàng -> bỏ selection cũ (của tài khoản khác)
      if (selectedStoreId) setSelectedStoreId("");
      return;
    }
    // Chưa chọn store, hoặc store đã chọn không thuộc user này -> chọn store đầu
    if (!selectedStoreId || !stores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, isFetched, selectedStoreId, setSelectedStoreId]);

  if (!user?.isUserValid) return <Navigate to="/auth/login" />;

  const displayName = user?.name || user?.email || "Seller";
  // Trên mobile drawer luôn hiển thị đầy đủ; collapse chỉ áp dụng desktop
  const collapsed = sidebarCollapsed && !isMobile;
  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className="flex min-h-screen bg-[#F4F5F9]">
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-[260px] ${
          sidebarCollapsed ? "lg:w-[84px]" : "lg:w-[260px]"
        } shrink-0 bg-[#171826] text-gray-300 flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-200 transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Toggle đóng/mở (desktop) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute top-[26px] -right-3.5 z-30 w-7 h-7 rounded-full bg-[#171826] border border-white/20 text-white items-center justify-center cursor-pointer hover:bg-[#C6A15B] hover:text-[#171826] transition-colors"
        >
          {collapsed ? <FiChevronRight size={15} /> : <FiChevronLeft size={15} />}
        </button>
        {/* Nút đóng drawer (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-5 right-4 w-8 h-8 rounded-full bg-white/10 text-white border-0 flex items-center justify-center cursor-pointer"
        >
          <FiX size={16} />
        </button>

        {/* Logo */}
        <div
          className={`py-6 text-xl font-extrabold tracking-widest ${
            collapsed ? "text-center px-2" : "px-6"
          }`}
        >
          {collapsed ? (
            <span>
              <span className="text-white">T</span>
              <span className="text-[#C6A15B]">P</span>
            </span>
          ) : (
            <>
              <span className="text-white">TEEMENT</span>
              <span className="text-[#C6A15B]">.POD</span>
            </>
          )}
        </div>

        {/* Chọn cửa hàng */}
        <div className="pb-4 border-b border-white/10 px-4">
          {collapsed ? (
            <Tooltip
              title={selectedStore?.name || "Chưa có cửa hàng"}
              placement="right"
            >
              <div className="w-[52px] h-[44px] mx-auto rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-white font-bold text-base select-none">
                {(selectedStore?.name || "?").charAt(0).toUpperCase()}
              </div>
            </Tooltip>
          ) : (
            <>
              <div className="text-[11px] tracking-widest text-gray-500 mb-2 px-2">
                CỬA HÀNG
              </div>
              <Select
                className="w-full"
                value={
                  stores.some((s) => s.id === selectedStoreId)
                    ? selectedStoreId
                    : undefined
                }
                placeholder={
                  stores.length ? "Chọn cửa hàng" : "Chưa có cửa hàng"
                }
                notFoundContent="Chưa có cửa hàng"
                onChange={setSelectedStoreId}
                options={stores.map((s) => ({ value: s.id, label: s.name }))}
              />
            </>
          )}
        </div>

        {/* Menu */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-3" : "px-4"}`}>
          {MENU.map((m) => {
            const link = (
              <NavLink
                key={m.to}
                to={m.to}
                end={(m as any).end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-[15px] no-underline hover:no-underline transition-colors ${
                    collapsed
                      ? "justify-center w-[52px] h-[48px] mx-auto"
                      : "gap-3 px-4 py-3"
                  } ${
                    isActive
                      ? "bg-[#C6A15B] text-[#171826] font-bold shadow-[0_0_18px_rgba(198,161,91,0.45)]"
                      : "hover:bg-white/5 text-gray-300"
                  }`
                }
              >
                <span className="text-lg">{m.icon}</span>
                {!collapsed && m.label}
              </NavLink>
            );
            return collapsed ? (
              <Tooltip key={m.to} title={m.label} placement="right">
                {link}
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-6 py-4 text-[11px] tracking-widest text-gray-500 border-t border-white/10">
            SELLER PORTAL V1.2
          </div>
        )}
      </aside>

      {/* Main */}
      <div
        className={`flex-1 ml-0 ${
          sidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[260px]"
        } flex flex-col transition-all duration-200 min-w-0`}
      >
        <header className="h-[64px] bg-white border-b border-gray-100 flex items-center gap-3 sm:gap-6 px-3 sm:px-6 sticky top-0 z-10">
          {/* Hamburger + logo (mobile) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-[#171826] shrink-0"
          >
            <FiMenu size={18} />
          </button>
          <span className="lg:hidden font-extrabold tracking-widest text-sm">
            <span className="text-[#171826]">TEEMENT</span>
            <span className="text-[#C6A15B]">.POD</span>
          </span>

          <div className="ml-auto flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 bg-[#FBF6EC] border border-[#EADFC8] rounded-full px-3 sm:px-4 py-1.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C6A15B] text-white shrink-0">
                <FiDollarSign size={13} />
              </span>
              <div className="leading-tight hidden xs:block sm:block">
                <div className="text-[10px] tracking-widest text-[#B79351] font-bold">
                  TỔNG CHI TIÊU
                </div>
                <div className="text-sm font-extrabold text-[#171826]">
                  {totalSpend > 0 ? "-" : ""}${totalSpend.toFixed(2)}
                </div>
              </div>
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: "profile", label: "Cập nhật thông tin hồ sơ" },
                  { key: "stores", label: "Quản lý liên kết Stores" },
                  { key: "services", label: "Dịch vụ mở rộng" },
                  { type: "divider" },
                  {
                    key: "logout",
                    label: (
                      <span className="text-red-500">Đăng xuất tài khoản</span>
                    ),
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "logout") {
                    setToken(null);
                    window.location.href = "/auth/login";
                  } else if (key === "profile") navigate("/dashboard/profile");
                  else if (key === "stores") navigate("/dashboard/stores");
                  else if (key === "services") navigate("/dashboard/services");
                },
              }}
            >
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="text-right leading-tight hidden sm:block">
                  <div className="font-bold text-[#171826]">{displayName}</div>
                  <div className="text-xs text-gray-400">
                    {user?.userName || user?.email || ""}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#C6A15B] text-white flex items-center justify-center font-bold shrink-0">
                  {String(displayName).charAt(0).toUpperCase()}
                </div>
              </div>
            </Dropdown>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
