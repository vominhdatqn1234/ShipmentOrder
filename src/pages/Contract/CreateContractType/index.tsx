import React from "react";
import { Breadcrumb } from "antd";
import CreateContractTypeForm from "./CreateContractTypeForm";

const CreateContractType = () => {
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
              title: "Tạo loại hợp đồng",
            },
          ]}
        />
      </div>
      <CreateContractTypeForm />
    </div>
  );
};
export default CreateContractType;
