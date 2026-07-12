import { Dropdown } from "antd";
import {
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiBox,
  FiTag,
  FiTruck,
  FiPenTool,
  FiSettings,
  FiSearch,
} from "react-icons/fi";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";

const EXTENSIONS = [
  { to: "/app/finance", label: "Tài chính & Công nợ", icon: <FiDollarSign /> },
  { to: "/app/sellers", label: "Quản lý Seller", icon: <FiUsers /> },
  { to: "/app/services", label: "Dịch vụ mở rộng", icon: <FiFileText /> },
  { to: "/app/blanks", label: "Kho Phôi POD", icon: <FiBox /> },
  { to: "/app/pod-prices", label: "Bảng giá POD", icon: <FiTag /> },
  { to: "/app/shipping-prices", label: "Bảng giá Vận chuyển", icon: <FiTruck /> },
  { to: "/app/design-orders", label: "Đơn Thiết Kế", icon: <FiPenTool /> },
];

export default function AdminLayout() {
  const { adminUser, logout } = useAdminAuth();

  if (!adminUser) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar kiểu Medusa */}
      <aside className="w-[220px] shrink-0 bg-[#FAFAFA] border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="px-4 py-4 flex items-center gap-2 border-b border-gray-100">
          <span className="w-6 h-6 rounded bg-[#171826] text-white text-xs font-bold flex items-center justify-center">
            T
          </span>
          <span className="font-semibold text-sm text-gray-800">
            Teement Admin
          </span>
        </div>

        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-gray-400 text-sm border border-gray-200 bg-white">
            <FiSearch size={13} />
            Search
          </div>
        </div>

        <div className="px-3 pt-4">
          <div className="text-[11px] font-medium text-gray-400 px-2 mb-1 flex items-center justify-between">
            Extensions
          </div>
          <nav className="space-y-0.5">
            {EXTENSIONS.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] no-underline hover:no-underline transition-colors ${
                    isActive
                      ? "bg-white border border-gray-200 shadow-sm text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-100 border border-transparent"
                  }`
                }
              >
                <span className="text-gray-400">{m.icon}</span>
                {m.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-3 pb-3 space-y-0.5">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] text-gray-600 hover:bg-gray-100 cursor-pointer">
            <FiSettings className="text-gray-400" size={14} />
            Settings
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: "logout",
                  label: <span className="text-red-500">Đăng xuất</span>,
                },
              ],
              onClick: ({ key }) => {
                if (key === "logout") {
                  logout();
                  window.location.href = "/login";
                }
              },
            }}
          >
            <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 cursor-pointer border-t border-gray-100">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                {(adminUser.name || "A").charAt(0).toUpperCase()}
              </span>
              <span className="text-[12px] text-gray-600 truncate">
                {adminUser.email}
              </span>
            </div>
          </Dropdown>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[220px] min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  );
}
