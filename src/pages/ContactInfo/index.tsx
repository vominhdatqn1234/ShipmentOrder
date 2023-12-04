import React from "react";
import { Breadcrumb, Popconfirm, Skeleton, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import { QuestionCircleOutlined } from '@ant-design/icons'
import { ColumnsType } from "antd/es/table";
import { useQueryClient } from "react-query";
import { ContactInfoModel } from "../../models";
import { useContactInfo } from "./useContactInfo";
import { isEmpty } from "lodash";
import ColorButton from "../../components/ColorButton";
import { colors } from "../../styles/colors";
import { MdDeleteForever } from "react-icons/md";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../../lib/firebase";

const currentDate = dayjs();

export default function ContactInfo() {
  const {
    data: contactInfoData,
    isLoading,
    refetchContactInfo,
  } = useContactInfo();
  const queryClient = useQueryClient();
  const collectionRef = collection(firestore, "booking");
  if (isLoading) {
    return (
      <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }
  const handleDelete = (record: any) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("booking");
    setTimeout(async () => await refetchContactInfo(), 300);
  };

  const columns: ColumnsType<ContactInfoModel> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: "20%",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => a.phone.localeCompare(b.phone),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email?.localeCompare(b?.email),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Ghi chú",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => a.description?.localeCompare(b?.description),
      sortDirections: ["descend", "ascend"],
      width: "20%",
    },
    {
      title: "Ngày đặt hẹn",
      dataIndex: "createTime",
      key: "createTime",
      sorter: (a, b) => a?.createTime?.localeCompare(b?.createTime),
      sortDirections: ["descend", "ascend"],
      render: (text, record) => {
        return !isEmpty(text)
          ? dayjs(text).format("DD/MM/YYYY")
          : ("--" as any);
      },
    },
    {
      title: "Thời gian đặt hẹn",
      dataIndex: "time",
      key: "time",
      width: "10%",
      render: (text, record) => {
        const day = new Date(text);
        return `${day.getHours() || "--"}: ${day.getMinutes() || "--"} ` as any;
      },
    },
    {
      title: "Chỉnh sửa",
      dataIndex: "",
      key: "x",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xóa thông tin liên hệ của khách hàng"
              description="Bạn có chắc là muốn xóa thông tin liên hệ của khách hàng?"
              icon={<QuestionCircleOutlined style={{ color: colors.red2 }} />}
              onConfirm={handleDelete(record)}
            >
              <ColorButton
                override={colors.red2}
                type="primary"
                size="small"
                icon={<MdDeleteForever />}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

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
              title: "Thông tin liên hệ",
            },
          ]}
        />
      </div>
      <Table
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={contactInfoData}
        bordered
      />
    </div>
  );
}
