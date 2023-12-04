import { Breadcrumb, Card, Modal } from "antd";
import React, { useState } from "react";
import { useServicePage } from "./useServicePage";
import Contact from "../../../components/Contact";
import ContactEditPage from "../EditPage/ContactEditPage";
import WeddingAlbum from "../../../components/WeddingAlbum";
import WeddingAlbumEditPage from "../EditPage/ServiceEditPage/WeddingAlbumEditPage";

export default function WeddingAlbumPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string>("");
  const { data, refetch } = useServicePage();

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
                title: "ALBUM CƯỚI",
              },
            ]}
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card
            title="Tiêu đề nội dung và hình ảnh album cưới"
            extra={
              <p
                className="text-blue-600 cursor-pointer"
                onClick={handleShowModalEdit}
              >
                Chỉnh sửa
              </p>
            }
          >
            <WeddingAlbum data={data?.[0]?.albumPhoto} />
          </Card>
        </div>
      </div>
      <Modal
        centered
        open={isOpen}
        title="Cập nhật album cưới"
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 200px)" }}
        footer={null}
      >
        <WeddingAlbumEditPage
          type='album'
          data={data[0]}
          refetch={refetch}
          handleCancel={handleCancel}
        />
      </Modal>
    </>
  );
}
