import { Breadcrumb, Card, Modal } from "antd";
import React, { useState } from "react";
import { useServicePage } from "./useServicePage";
import Contact from "../../../components/Contact";
import ContactEditPage from "../EditPage/ContactEditPage";
import WeddingAlbum from "../../../components/WeddingAlbum";
import WeddingAlbumEditPage from "../EditPage/ServiceEditPage/WeddingAlbumEditPage";
import PriceWedding from "../../../components/PriceWedding";
import PriceWeddingEdit from "../EditPage/ServiceEditPage/PriceWeddingEdit";
import { useNavigate } from "react-router-dom";
import ComboPriceWedding from "../../../components/PriceWedding/ComboPriceWedding";
import { usePriceWedding } from "../../PriceWedding/usePriceWedding";
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

export default function PriceWeddingPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string>("");
  const { data, refetch } = useServicePage();
  const { data: priceWeddingData } = usePriceWedding();

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
                title: "Bảng giá",
              },
            ]}
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card
            title="Tiêu đề nội dung và hình ảnh bảng giá"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit}
              >
                Chỉnh sửa
              </p>
            }
          >
            <PriceWedding data={data?.[0]?.priceWedding} />
          </Card>
          <Card
            title="Các gói bảng giá"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={() => navigate("/price-wedding-list")}
              >
                Chỉnh sửa
              </p>
            }
          >
            <ComboPriceWedding data={priceWeddingData} />
          </Card>
        </div>
      </div>
      <Modal
        centered
        open={isOpen}
        title="Cập nhật bảng giá"
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 200px)" }}
        footer={null}
      >
        <PriceWeddingEdit
          data={data[0]}
          refetch={refetch}
          handleCancel={handleCancel}
        />
      </Modal>
    </>
  );
}
