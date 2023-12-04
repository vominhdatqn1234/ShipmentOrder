import React, { useState } from "react";
import { useTeam } from "./useTeam";
import { Avatar, Modal, Popconfirm, Skeleton, Table, Tooltip } from "antd";
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useQueryClient } from "react-query";
import { TeamModel } from "../../../models";
import { ColumnsType } from "antd/es/table";
import ColorButton from "../../../components/ColorButton";
import { colors } from "../../../styles/colors";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import EditTeamManagement from "../EditTeamManagement";

export default function TeamManagementList() {
  const [opened, setOpened] = useState(false);
  const [defaultValues, setDefaultValues] = useState<TeamModel>({
    id: "",
    name: "",
    avatar: [
      {
        id: "",
        name: "",
        url: "https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b",
      },
    ],
    title: "",
  });
  const { data: teamData, isLoading, refetch } = useTeam();
  const queryClient = useQueryClient();
  const collectionRef = collection(firestore, "team");

  const handleDelete = (record: any) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("team");
    setTimeout(async () => await refetch(), 300);
  };

  const handleEditTeam = (record: TeamModel) => () => {
    setDefaultValues(record);
    setOpened(true);
  };

  const handleCancel = () => {
    setOpened(false);
  };

  const columns: ColumnsType<TeamModel> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: "40%",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: "20%",
      render: (text, record) => {
        return <Avatar src={record.avatar?.[0]?.url} />;
      },
    },
    {
      title: "Chức vụ",
      dataIndex: "title",
      key: "title",
      width: "40%",
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Chỉnh sửa",
      dataIndex: "",
      key: "edit",
      render: (text, record) => (
        <div className="flex items-center gap-2">
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
              title="Xóa thành viên trên trang"
              description="Bạn có chắc là muốn xóa thành viên trên trang?"
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
        <Skeleton key={1} active />
        <Skeleton key={2} active />
      </div>
    );
  }

  return (
    <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
      <Table
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={teamData}
        bordered
      />
      <Modal
        title="Cập nhật thành viên"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditTeamManagement
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
}
