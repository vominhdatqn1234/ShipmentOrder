import { Breadcrumb, Card, Modal } from "antd";
import React, { useState } from "react";
import AboutMe from "../../../components/AboutMe";
import { useAboutMePage } from "./useAboutMePage";
import AboutMeEditPage from "../EditPage/AboutMeEditPage";
// import Hero from "../../../components/Hero";
// import IntroduceStudio from "../../../components/IntroduceStudio";
// import Services from "../../../components/Services";
// import Stories from "../../../components/Stories";
// import Testimonials from "../../../components/Testimonials";

// import HeroEditPage from "../EditPage/HomePage/HeroEditPage";
// import { useHomePage } from "./useHomePage";
// import IntroduceStudioEditPage from "../EditPage/HomePage/IntroduceStudioEditPage";
// import ServicesEditPage from "../EditPage/HomePage/ServicesEditPage/index";
// import StoriesEditPage from "../EditPage/HomePage/StoriesEditPage";
// import TestimonialsEditPage from "../EditPage/HomePage/TestimonialsEditPage";

// {
//   hero: false,
//   introduceStudio: false,
//   services: false,
//   stories: false,
//   testimonials: false
// }

export default function AboutMePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string>("");
  const { data, refetch } = useAboutMePage();

  const handleShowModalEdit = () => {
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
        <div className="mb-4">
          <Breadcrumb
            items={[
              {
                href: "/",
                title: "Quản lý trang",
              },
              {
                title: "Về chúng tôi",
              },
            ]}
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card
            title="Tiêu đề nội dung và hình ảnh"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit}
              >
                Chỉnh sửa
              </p>
            }
          >
            <AboutMe data={data?.[0]} />
          </Card>
        </div>
      </div>
      <Modal
        centered
        open={isOpen}
        title="Cập nhật về chúng tôi"
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 200px)" }}
        footer={null}
      >
        <AboutMeEditPage
          data={data[0]}
          refetch={refetch}
          handleCancel={handleCancel}
        />
      </Modal>
    </>
  );
}
