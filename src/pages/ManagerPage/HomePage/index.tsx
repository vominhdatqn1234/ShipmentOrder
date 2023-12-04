import { Breadcrumb, Card, Modal, Tabs, TabsProps } from "antd";
import React, { useState } from "react";
import Hero from "../../../components/Hero";
import IntroduceStudio from "../../../components/IntroduceStudio";
import Services from "../../../components/Services";
import Stories from "../../../components/Stories";
import Testimonials from "../../../components/Testimonials";

import HeroEditPage from "../EditPage/HomePage/HeroEditPage";
import { useHomePage } from "./useHomePage";
import IntroduceStudioEditPage from "../EditPage/HomePage/IntroduceStudioEditPage";
import ServicesEditPage from "../EditPage/HomePage/ServicesEditPage/index";
import StoriesEditPage from "../EditPage/HomePage/StoriesEditPage";
import TestimonialsEditPage from "../EditPage/HomePage/TestimonialsEditPage";
import PreWeddingDay from "../../../components/Stories/PreWeddingDay";
import WeddingDay from "../../../components/Stories/WeddingDay";
import AllWeddingEditPage from "../EditPage/HomePage/StoriesEditPage/AllWeddingEditPage";

// {
//   hero: false,
//   introduceStudio: false,
//   services: false,
//   stories: false,
//   testimonials: false
// }

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string>("");
  const { data, refetch } = useHomePage();

  const handleShowModalEdit = (value: string) => () => {
    setIsOpen(true);
    setActiveModal(value);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const renderEditComponent: any = {
    hero: (
      <HeroEditPage data={data} refetch={refetch} handleCancel={handleCancel} />
    ),
    introduceStudio: (
      <IntroduceStudioEditPage
        data={data?.[0] || {}}
        refetch={refetch}
        handleCancel={handleCancel}
      />
    ),
    services: (
      <ServicesEditPage
        data={data}
        refetch={refetch}
        handleCancel={handleCancel}
      />
    ),
    stories: (
      <StoriesEditPage
        data={data?.[0] || {}}
        refetch={refetch}
        handleCancel={handleCancel}
      />
    ),
    testimonials: (
      <TestimonialsEditPage
        data={data?.[0] || {}}
        refetch={refetch}
        handleCancel={handleCancel}
      />
    ),
    preWedding: (
      <AllWeddingEditPage
        data={data?.[0] || {}}
        refetch={refetch}
        handleCancel={handleCancel}
      />
    ),
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "PRE WEDDING",
      children: <PreWeddingDay data={data?.[0]?.stories?.preWedding || []} />,
    },
    {
      key: "2",
      label: "PHÓNG SỰ CƯỚI",
      children: <WeddingDay data={data?.[0]?.stories?.wedding || []} />,
    },
  ];

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
                title: "Trang chủ",
              },
            ]}
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card
            title="Banner Header (Carousel)"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit("hero")}
              >
                Chỉnh sửa
              </p>
            }
          >
            <Hero data={data?.[0]?.hero} />
          </Card>
          <Card
            title="Giới thiệu"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit("introduceStudio")}
              >
                Chỉnh sửa
              </p>
            }
          >
            <IntroduceStudio {...data?.[0]?.introduceStudio} />
          </Card>
          <Card
            title="Danh sách dịch vụ"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit("services")}
              >
                Chỉnh sửa
              </p>
            }
          >
            <Services services={data?.[0]?.services} />
          </Card>
          <Card
            title="Danh sách Album cưới"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit("stories")}
              >
                Chỉnh sửa
              </p>
            }
          >
            <Stories stories={data?.[0]?.stories} />
            <Card
              title="Danh sách PreWedding and Wedding"
              extra={
                <p
                  className="text-blue-600 cursor-pointer"
                  onClick={handleShowModalEdit("preWedding")}
                >
                  Chỉnh sửa
                </p>
              }
            >
              <Tabs defaultActiveKey="1" centered items={items} />
            </Card>
          </Card>
          <Card
            title="Nhận xét của khách hàng"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit("testimonials")}
              >
                Chỉnh sửa
              </p>
            }
          >
            <Testimonials
              titleReviewer={data?.[0]?.titleReviewer}
              reviewer={data?.[0]?.reviewer}
            />
          </Card>
        </div>
      </div>
      <Modal
        centered
        open={isOpen}
        title="Chỉnh sửa"
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 200px)" }}
        footer={null}
      >
        {(renderEditComponent[activeModal] as React.ReactNode) ?? (
          <HeroEditPage />
        )}
      </Modal>
    </>
  );
}
