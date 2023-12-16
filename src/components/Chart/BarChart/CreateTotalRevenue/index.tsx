import React from "react";
import { Breadcrumb } from "antd";
import TotalRevenueForm from "./TotalRevenueForm";

const CreateTotalRevenue = () => {
  return (
    <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              href: "/",
              title: "Trang chủ",
            },
            {
              title: "Tạo chi phí",
            },
          ]}
        />
      </div>
      <TotalRevenueForm />
    </div>
  );
};
export default CreateTotalRevenue;
