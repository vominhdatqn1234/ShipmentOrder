import React, { Suspense } from "react";
import { ConfigProvider } from "antd";
import {
  useRoutes,
  // useRoutes,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";
import SideBar from "./components/SideBar";
import Navbar from "./components/Navbar";
import Contract from "./pages/Contract";
import WeddingDressList from "./pages/WeddingDress/WeddingDressList";
import CreateWeddingDress from "./pages/WeddingDress/CreateWeddingDress";
import TeamManagementList from "./pages/TeamManagement/TeamManagementList";
import CreateTeamManagement from "./pages/TeamManagement/CreateTeamManagement";
import ContactInfo from "./pages/ContactInfo";
import EmployeeList from "./pages/Employee/EmployeeList";
import CreateEmployee from "./pages/Employee/CreateEmployee";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./store/useUser";
import { useWindowSizeMenu } from "./store/useWindowSizeMenu";
import { cn } from "./lib/cs";
import Home from "./pages/Home";
import CreateContract from "./pages/Contract/CreateContract";
import "./lib/dayjs";
import { PuffLoader } from "react-spinners";
import FullLayout from "./components/Layouts/FullLayout";
import { colors } from "./styles/colors";
import Loader from "./components/Loader";
import { ThemeAdminRoutes, ThemeRoutes } from "./routes";

const queryClient = new QueryClient();

function App() {
  useAuth();
  const { user } = useUser();
  const isAdmin = user.permission === "Admin";
  const routing = useRoutes(isAdmin ? ThemeAdminRoutes : ThemeRoutes);
  return (
    <Suspense fallback={<Loader />}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <ToastContainer />
          {routing}
          {/* {isUserValid ? (
            <div className="App">
              <div className="flex relative">
                <div className="hidden xl:block">
                  <SideBar />
                </div>
                <div className="w-full min-h-screen">
                  <div className={cn("w-ful ml-0")}>
                    <Navbar />
                    <div
                      className={cn("pt-[60px]", isActiveMenu && "xl:ml-72")}
                    >
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="contract-list" element={<Contract />} />
                        <Route
                          path="create-contract"
                          element={<CreateContract />}
                        />

                        <Route
                          path="wedding-dress-list"
                          element={<WeddingDressList />}
                        />
                        <Route
                          path="create-wedding-dress"
                          element={<CreateWeddingDress />}
                        />
                        <Route
                          path="team-management-list"
                          element={<TeamManagementList />}
                        />
                        <Route
                          path="create-team-management"
                          element={<CreateTeamManagement />}
                        />
                        <Route
                          path="contacts-information"
                          element={<ContactInfo />}
                        />
                        {permission === "Admin" && (
                          <>
                            <Route
                              path="employees-list"
                              element={<EmployeeList />}
                            />
                            <Route
                              path="create-employees"
                              element={<CreateEmployee />}
                            />
                          </>
                        )}

                        <Route path="calendar" element={<Calendar />} />

                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Navigate to={"/login"} />
          )}
          <Routes>
            <Route path="login" element={<Login />} />
          </Routes> */}

          {/* <Outlet /> */}

          {/* <div className='App'>
            <div className="flex relative">
              <div className='hidden xl:block'>
                <SideBar />
              </div>
              <div
                className='w-full min-h-screen'>
                <div className="w-ful ml-0 xl:ml-72">
                  <Navbar /> */}
          {/* <Routes>
                    <Route path="/contract-list" element={(<Orders />)} />
                    <Route path="/create-contract" element={(<Orders />)} />

                   
                    <Route path="/wedding-dress-list" element={<WeddingDressList />} />
                    <Route path="/create-wedding-dress" element={<CreateWeddingDress />} />
                    <Route
                      path='/team-management-list'
                      element={<TeamManagementList />}
                    />
                    <Route
                      path='/create-team-management'
                      element={<CreateTeamManagement />}
                    />
                    <Route
                      path='/contacts-information'
                      element={<ContactInfo />}
                    />
                    <Route
                      path='/employees-list'
                      element={<EmployeeList />}
                    />
                    <Route
                      path='/create-employees'
                      element={<CreateEmployee />}
                    />
                    <Route
                      path='/calendar'
                      element={<Calendar />}
                    />
                  </Routes> */}
          {/* </div>
              </div>
            </div>
          </div> */}
        </ConfigProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
