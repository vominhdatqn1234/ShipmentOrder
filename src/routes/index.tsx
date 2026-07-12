import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Loadable from "../components/Loadable";

/***** Layout & Pages — TeementPOD Seller Portal *****/

const PodLayout = Loadable(lazy(() => import("../components/PodLayout")));
const Login = Loadable(lazy(() => import("../pages/Login")));
const Overview = Loadable(lazy(() => import("../pages/POD/Overview")));
const Catalog = Loadable(lazy(() => import("../pages/POD/Catalog")));
const Designs = Loadable(lazy(() => import("../pages/POD/Designs")));
const Orders = Loadable(lazy(() => import("../pages/POD/Orders")));
const Stores = Loadable(lazy(() => import("../pages/POD/Stores")));
const Services = Loadable(lazy(() => import("../pages/POD/Services")));

const podChildren = [
  { path: "/dashboard", element: <Overview /> },
  { path: "/dashboard/catalog", element: <Catalog /> },
  { path: "/dashboard/designs", element: <Designs /> },
  { path: "/dashboard/orders", element: <Orders /> },
  { path: "/dashboard/stores", element: <Stores /> },
  { path: "/dashboard/services", element: <Services /> },
];

const routes = [
  {
    path: "/",
    element: <PodLayout />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" /> },
      ...podChildren,
      { path: "*", element: <Navigate to="/dashboard" /> },
    ],
  },
  {
    path: "/auth",
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Login /> },
      { path: "*", element: <Navigate to="/auth/login" /> },
    ],
  },
];

// Giữ nguyên tên export để App.tsx không phải sửa
const ThemeRoutes = routes;
const ThemeAdminRoutes = routes;

export { ThemeRoutes, ThemeAdminRoutes };
