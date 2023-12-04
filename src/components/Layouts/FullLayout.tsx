import { Navigate, Outlet } from "react-router-dom";
import SideBar from "../SideBar";
import Navbar from "../Navbar";
import { cn } from "../../lib/cs";
import { useWindowSizeMenu } from "../../store/useWindowSizeMenu";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../store/useUser";

const FullLayout = () => {
  const { user } = useUser();
  const { isActiveMenu } = useWindowSizeMenu();
  const { isUserValid, permission } = user || {};
  return (
    <main>
      {isUserValid ? (
        <div className="App">
          <div className="flex relative">
            <div className="hidden xl:block">
              <SideBar />
            </div>
            <div className="w-full min-h-screen">
              <div className={cn("w-ful ml-0")}>
                <Navbar />
                <div className={cn("pt-[60px]", isActiveMenu && "xl:ml-72")}>
                  <Outlet />
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
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Navigate to={"auth/login"} />
      )}
    </main>
  );
};

export default FullLayout;
