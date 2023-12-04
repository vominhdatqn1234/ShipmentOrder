import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Loadable from "../components/Loadable";

/****Layouts*****/

const FullLayout = Loadable(
  lazy(() => import("../components/Layouts/FullLayout"))
);

// const BlankLayout = Loadable(lazy(() => import("../layouts/BlankLayout")));
/***** Pages ****/
const Login = Loadable(lazy(() => import("../pages/Login")));
const Home = Loadable(lazy(() => import("../pages/Home")));
const Contract = Loadable(lazy(() => import("../pages/Contract")));
const CreateContract = Loadable(
  lazy(() => import("../pages/Contract/CreateContract"))
);
const OrderList = Loadable(lazy(() => import("../pages/OrderList")));
const CreateContractType = Loadable(
  lazy(() => import("../pages/Contract/CreateContractType"))
);
const ContractTypeList = Loadable(
  lazy(() => import("../pages/Contract/ContractTypeList"))
);
const ServicesArisingList = Loadable(
  lazy(() => import("../pages/Contract/ServicesArisingList"))
);
const CreateServicesArising = Loadable(
  lazy(() => import("../pages/Contract/CreateServicesArising"))
);
const WeddingDressList = Loadable(
  lazy(() => import("../pages/WeddingDress/WeddingDressList"))
);
const CreateWeddingDress = Loadable(
  lazy(() => import("../pages/WeddingDress/CreateWeddingDress"))
);
const CreateWeddingDressType = Loadable(
  lazy(() => import("../pages/WeddingDress/CreateWeddingDressType"))
);
const WeddingDressTypeList = Loadable(
  lazy(() => import("../pages/WeddingDress/WeddingDressTypeList"))
);
const TeamManagementList = Loadable(
  lazy(() => import("../pages/TeamManagement/TeamManagementList"))
);
const CreateTeamManagement = Loadable(
  lazy(() => import("../pages/TeamManagement/CreateTeamManagement"))
);
const ContactInfo = Loadable(lazy(() => import("../pages/ContactInfo")));
const Calendar = Loadable(lazy(() => import("../pages/Calendar")));
const EmployeeList = Loadable(
  lazy(() => import("../pages/Employee/EmployeeList"))
);
const CreateEmployee = Loadable(
  lazy(() => import("../pages/Employee/CreateEmployee"))
);
const CreateOrder = Loadable(
  lazy(() => import("../pages/OrderList/CreateOrder"))
);
const CreatePriceWedding = Loadable(
  lazy(() => import("../pages/PriceWedding/CreatePriceWedding"))
);
const PriceWeddingList = Loadable(lazy(() => import("../pages/PriceWedding")));

/*****Manager Page******/
const HomePage = Loadable(
  lazy(() => import("../pages/ManagerPage/HomePage/index"))
);
const AboutMePage = Loadable(
  lazy(() => import("../pages/ManagerPage/AboutMePage/index"))
);
const NewsPage = Loadable(lazy(() => import("../pages/News")));
const ContactPage = Loadable(
  lazy(() => import("../pages/ManagerPage/ContactPage/index"))
);
const PricePage = Loadable(
  lazy(() => import("../pages/ManagerPage/ServicePage/PriceWeddingPage"))
);
const WeddingAlbumPage = Loadable(
  lazy(() => import("../pages/ManagerPage/ServicePage/WeddingAlbumPage"))
);
const WeddingDayReportage = Loadable(
  lazy(() => import("../pages/ManagerPage/ServicePage/WeddingDayReportage"))
);
const WeddingDressPage = Loadable(
  lazy(() => import("../pages/ManagerPage/WeddingDressPage"))
);

const managerPage = [
  {
    path: "/manager-page/home-page",
    name: "HomePage",
    exact: true,
    element: <OrderList />,
  },
  {
    path: "/manager-page/about-me-page",
    name: "AboutMePage",
    exact: true,
    element: <AboutMePage />,
  },
  {
    path: "/manager-page/contact-page",
    name: "AboutMePage",
    exact: true,
    element: <ContactPage />,
  },
  {
    path: "/manager-page/price-page",
    name: "PricePage",
    exact: true,
    element: <PricePage />,
  },
  {
    path: "/manager-page/wedding-album-page",
    name: "WeddingAlbumPage",
    exact: true,
    element: <WeddingAlbumPage />,
  },
  {
    path: "/manager-page/wedding-day-reportage-page",
    name: "WeddingDayReportage",
    exact: true,
    element: <WeddingDayReportage />,
  },
  {
    path: "/manager-page/wedding-dress-page",
    name: "WeddingDressPage",
    exact: true,
    element: <WeddingDressPage />,
  },
  {
    path: "/manager-page/news-page",
    name: "NewsPage",
    exact: true,
    element: <NewsPage />,
  },
];
/*****Routes******/

const childrenAdmin = [
  {
    path: "/",
    name: "Home",
    exact: true,
    element: <OrderList />,
  },
  {
    path: "/contract-list",
    name: "ContractList",
    exact: true,
    element: <OrderList />,
  },
  {
    path: "/create-contract",
    name: "CreateContract",
    exact: true,
    element: <CreateOrder />,
  },
  {
    path: "/contract-type-list",
    name: "ContractTypeList",
    exact: true,
    element: <ContractTypeList />,
  },
  {
    path: "/create-contract-type",
    name: "CreateContractType",
    exact: true,
    element: <CreateContractType />,
  },
  // {
  //   path: "/services-arising-list",
  //   name: "ServicesArisingList",
  //   exact: true,
  //   element: <ServicesArisingList />,
  // },
  // {
  //   path: "/create-services-arising",
  //   name: "CreateServicesArising",
  //   exact: true,
  //   element: <CreateServicesArising />,
  // },
  // {
  //   path: "/wedding-dress-list",
  //   name: "WeddingDressList",
  //   exact: true,
  //   element: <WeddingDressList />,
  // },
  // {
  //   path: "/create-wedding-dress",
  //   name: "CreateWeddingDress",
  //   exact: true,
  //   element: <CreateWeddingDress />,
  // },
  // {
  //   path: "/wedding-dress-type-list",
  //   name: "WeddingDressTypeList",
  //   exact: true,
  //   element: <WeddingDressTypeList />,
  // },
  // {
  //   path: "/create-wedding-dress-type",
  //   name: "CreateWeddingDressType",
  //   exact: true,
  //   element: <CreateWeddingDressType />,
  // },
  {
    path: "/team-management-list",
    name: "TeamManagementList",
    exact: true,
    element: <TeamManagementList />,
  },
  {
    path: "/create-team-management",
    name: "CreateTeamManagement",
    exact: true,
    element: <CreateTeamManagement />,
  },
  // {
  //   path: "/contacts-information",
  //   name: "CreateTeamManagement",
  //   exact: true,
  //   element: <ContactInfo />,
  // },
  // {
  //   path: "/calendar",
  //   name: "Calendar",
  //   exact: true,
  //   element: <Calendar />,
  // },
  {
    path: "/employees-list",
    name: "EmployeeList",
    exact: true,
    element: <EmployeeList />,
  },
  {
    path: "/create-employees",
    name: "CreateEmployee",
    exact: true,
    element: <CreateEmployee />,
  },
  // {
  //   path: "/create-price-wedding",
  //   name: "CreatePriceWedding",
  //   exact: true,
  //   element: <CreatePriceWedding />,
  // },
  // {
  //   path: "/price-wedding-list",
  //   name: "PriceWeddingList",
  //   exact: true,
  //   element: <PriceWeddingList />,
  // },
  ...managerPage,
  {
    path: "*",
    element: <Navigate to="/" />,
  },
];
const children = [
  {
    path: "/",
    name: "Home",
    exact: true,
    element: <Home />,
  },
  {
    path: "/contract-list",
    name: "ContractList",
    exact: true,
    element: <OrderList />,
  },
  {
    path: "/create-contract",
    name: "CreateContract",
    exact: true,
    element: <CreateOrder />,
  },
  // {
  //   path: "/wedding-dress-list",
  //   name: "WeddingDressList",
  //   exact: true,
  //   element: <WeddingDressList />,
  // },
  // {
  //   path: "/create-wedding-dress",
  //   name: "CreateWeddingDress",
  //   exact: true,
  //   element: <CreateWeddingDress />,
  // },
  // {
  //   path: "/wedding-dress-type-list",
  //   name: "WeddingDressTypeList",
  //   exact: true,
  //   element: <WeddingDressTypeList />,
  // },
  // {
  //   path: "/create-wedding-dress-type",
  //   name: "CreateWeddingDressType",
  //   exact: true,
  //   element: <CreateWeddingDressType />,
  // },
  // {
  //   path: "/team-management-list",
  //   name: "TeamManagementList",
  //   exact: true,
  //   element: <TeamManagementList />,
  // },
  // {
  //   path: "/create-team-management",
  //   name: "CreateTeamManagement",
  //   exact: true,
  //   element: <CreateTeamManagement />,
  // },
  // {
  //   path: "/contacts-information",
  //   name: "CreateTeamManagement",
  //   exact: true,
  //   element: <ContactInfo />,
  // },
  // {
  //   path: "/calendar",
  //   name: "Calendar",
  //   exact: true,
  //   element: <Calendar />,
  // },
  // {
  //   path: "/create-price-wedding",
  //   name: "CreatePriceWedding",
  //   exact: true,
  //   element: <CreatePriceWedding />,
  // },
  // {
  //   path: "/price-wedding-list",
  //   name: "PriceWeddingList",
  //   exact: true,
  //   element: <PriceWeddingList />,
  // },
  ...managerPage,
  {
    path: "*",
    element: <Navigate to="/" />,
  },
];

const ThemeRoutes = [
  {
    path: "/",
    element: <FullLayout />,
    children,
  },
  {
    path: "/auth",
    element: <Login />,
    children: [
      //   {
      //     path: "404",
      //     element: <Error />,
      //   },
      {
        path: "*",
        element: <Navigate to="/auth/login" />,
      },
      {
        path: "login",
        element: <Login />,
      },
    ],
  },
];

const ThemeAdminRoutes = [
  {
    path: "/",
    element: <FullLayout />,
    children: childrenAdmin,
  },
  {
    path: "/auth",
    element: <Login />,
    children: [
      //   {
      //     path: "404",
      //     element: <Error />,
      //   },
      {
        path: "*",
        element: <Navigate to="/auth/login" />,
      },
      {
        path: "login",
        element: <Login />,
      },
    ],
  },
];

export { ThemeRoutes, ThemeAdminRoutes };
