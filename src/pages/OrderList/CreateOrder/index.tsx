import React from "react";
import { Breadcrumb } from "antd";
import CreateOrderForm from "./CreateOrderForm";

const CreateOrder = () => {
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
              title: "Tạo hóa đơn",
            },
          ]}
        />
      </div>
      <CreateOrderForm />
    </div>
  );
};
export default CreateOrder;
