import React from "react";
import { Breadcrumb } from "antd";
import CreateServicesArisingForm from "./CreateServicesArisingForm";

const CreateServicesArising = () => {
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
              title: "Tạo danh mục phát sinh",
            },
          ]}
        />
      </div>
      <CreateServicesArisingForm />
    </div>
  );
};
export default CreateServicesArising;
