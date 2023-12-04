import React from "react";
import { Breadcrumb } from "antd";
import CreateWeddingDressTypeForm from "./CreateWeddingDressTypeForm";

const CreateWeddingDressType = () => {
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
              title: "Tạo loại váy cưới",
            },
          ]}
        />
      </div>
      <CreateWeddingDressTypeForm />
    </div>
  );
};
export default CreateWeddingDressType;
