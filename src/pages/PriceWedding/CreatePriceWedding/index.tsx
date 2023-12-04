import React from "react";
import { Breadcrumb } from "antd";
import PriceWeddingForm from "./PriceWeddingForm";
// import CreateEmployeeForm from './CreateEmployeeForm';

const CreatePriceWedding = () => {
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
              title: "Tạo bảng giá",
            },
          ]}
        />
      </div>
      <PriceWeddingForm />
    </div>
  );
};
export default CreatePriceWedding;
