import React from "react";
import BarChart from "../../components/Chart/BarChart";
import { Avatar, Badge, Button, Divider, Select, Space } from "antd";
import { FiShoppingBag } from "react-icons/fi";
import { FaDongSign } from "react-icons/fa6";
import AreaChart from "../../components/Chart/AreaChart";
import { colors } from "../../styles/colors";
import TotalSales from "../../components/TotalSales";
import { AiOutlineShopping } from "react-icons/ai";
import TotalIncome from "../../components/TotalIncome";
import { useUser } from "../../store/useUser";
import BarChartArising from "../../components/Chart/BarChartArising";
import BarChartRevenue from "../../components/Chart/BarChartRevenue";
import BarchartDiscount from "../../components/Chart/BarChartDiscount";
import BarChartClient from "../../components/Chart/BarChartClient";

export default function Home() {
  const { user } = useUser();
  const isAdmin = user.permission === "Admin";
  const renderEcommer = () => {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* <div className="analytics-report-container">
            <div className="analytics-report bg-white rounded-3xl drop-shadow-lg p-[14px]">
              <p className="text-lg font-semibold leading-4 text-gray-900">
                Hey {user?.name}
              </p>
              <div className="pb-6"></div>
            </div>
            <div className="grid grid-cols-1 mt-4 gap-6">
              <TotalIncome />
            </div>
          </div> */}
          {/* <div className="bg-white rounded-3xl drop-shadow-lg px-4 flex flex-col justify-center">
            <TotalSales />
          </div> */}
        </div>
        <div>
          {isAdmin ? (
            <div className="py-6">
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
              <div className="bg-white rounded-3xl drop-shadow-lg px-4 flex flex-col justify-center">
                <BarChart />
                {/* </div> */}
              </div>
            </div>
          ) : null}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6"> */}
          {!isAdmin ? (
            <>
              <div className="py-6">
                <div className="bg-white rounded-3xl drop-shadow-lg px-4 flex flex-col justify-center">
                  <BarChartClient />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  };
  return <div className="h-full p-6">{renderEcommer()}</div>;
}
