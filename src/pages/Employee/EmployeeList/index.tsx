import React, { useState } from "react";
import { useEmployee } from "./useEmployee";
import { Avatar, Modal, Popconfirm, Skeleton, Table, Tooltip } from "antd";
import { useQueryClient } from "react-query";
import { EmployeeModel } from "../../../models";
import { ColumnsType } from "antd/es/table";
import ColorButton from "../../../components/ColorButton";
import { colors } from "../../../styles/colors";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { QuestionCircleOutlined, FileAddOutlined } from "@ant-design/icons";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import EditEmployee from "../EditEmployee";
import dayjs from "dayjs";
import ProductsType from "../../Contract/ContractTypeList/ProductsTypeDetail";
import { useEmployeesHook } from "./useEmployeeHook";
import { useEmployeeSlice } from "../../../store/useEmployeeSlice";
import { find } from "lodash";
import { produce } from "immer";

// const defaultValues = {
// 	name: '',
// 	phone: '',
// 	email: '',
// 	password: '',
// 	address: '',
// 	permission: '',
// 	avatar: 'https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b',
// };
export default function EmployeeList() {
  const [opened, setOpened] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any>({});
  const [defaultValues, setDefaultValues] = useState<EmployeeModel>({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    permission: "",
    username: "",
    avatar:
      "https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b",
    createAt: "",
    productTypes: [],
  });
  const { isLoading } = useEmployeesHook();
  const { employees: employeeData, removeEmployeeId } = useEmployeeSlice();
  const collectionRef = collection(firestore, "employee");

  const handleDelete = (record: any) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    removeEmployeeId(record!.id);
  };

  const handleEditTeam = (record: EmployeeModel) => () => {
    setDefaultValues(record);
    setOpened(true);
  };

  const handleShowDetail = (record: EmployeeModel) => () => {
    setShowDetail(true);
    setOrderDetail(record?.id);
  };

  const handleCancelDetail = () => {
    setShowDetail(false);
  };

  const handleCancel = () => {
    setOpened(false);
  };

  const columns: ColumnsType<EmployeeModel> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: "20%",
      fixed: "left",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: "10%",
      render: (text, record) => {
        return <Avatar src={text} />;
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "10%",
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      width: "10%",
      sorter: (a, b) => a.password.localeCompare(b.password),
      sortDirections: ["descend", "ascend"],
      render: (text) => {
        const numAsterisks = 0;

        // Replace characters with asterisks
        const maskedText =
          text.length > numAsterisks
            ? text.slice(0, numAsterisks) +
              "•".repeat(text.length - numAsterisks)
            : text;

        return (
          <Tooltip title={text}>
            <p>{maskedText}</p>
          </Tooltip>
        );
      },
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => a.phone.localeCompare(b.phone),
      sortDirections: ["descend", "ascend"],
      width: "10%",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      sorter: (a, b) => a.address.localeCompare(b.address),
      sortDirections: ["descend", "ascend"],
      width: "20%",
    },
    {
      title: "Quyền",
      dataIndex: "permission",
      key: "permission",
      sorter: (a, b) => a.permission.localeCompare(b.permission),
      sortDirections: ["descend", "ascend"],
    },
    // {
    // 	title: 'Ngày tạo',
    // 	dataIndex: 'createAt',
    // 	key: 'createAt',
    // 	render: (text) => {
    // 		return dayjs(text).format('DD/MM/YYYY')
    // 	}
    // },
    {
      title: "Chỉnh sửa",
      dataIndex: "",
      key: "x",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Xem danh sách hóa đơn">
            <ColorButton
              override={colors.primary}
              type="primary"
              size="small"
              icon={<FileAddOutlined />}
              onClick={handleShowDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <ColorButton
              override={colors.primary}
              type="primary"
              size="small"
              icon={<FaEdit />}
              onClick={handleEditTeam(record)}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xóa nhân viên"
              description="Bạn có chắc là muốn xóa nhân viên?"
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

  if (isLoading) {
    return (
      <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
      <Table
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={employeeData}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật nhân viên"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditEmployee
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={() => {}}
        />
      </Modal>
      <Modal
        title="Cập nhật cập danh sách sản phẩm"
        open={showDetail}
        footer={null}
        width={1280}
        onCancel={handleCancelDetail}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <ProductsType orderDetail={orderDetail} />
        {/* <EditEmployee
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetchTeam}
        /> */}
      </Modal>
    </div>
  );
}
