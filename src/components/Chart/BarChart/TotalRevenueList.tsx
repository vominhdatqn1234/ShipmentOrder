import React, { useRef, useState } from "react";
import {
  Avatar,
  Button,
  Input,
  InputRef,
  Modal,
  Popconfirm,
  Skeleton,
  Space,
  Table,
  Tooltip,
} from "antd";
import { useQueryClient } from "react-query";
import { EmployeeModel } from "../../../models";
import { ColumnType, ColumnsType } from "antd/es/table";
import ColorButton from "../../../components/ColorButton";
import { colors } from "../../../styles/colors";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import dayjs from "dayjs";
import { RevenueType } from "../../../models/Revenue";
import { useRevenue } from "./useRevenue";
import { useRevenueSlice } from "../../../store/useRevenue";
import { formatCurrency } from "../../../utils";
import EditTotalRevenue from "./EditTotalRevenue";
import Highlighter from "react-highlight-words";
import { FileAddOutlined, SearchOutlined } from "@ant-design/icons";
import { FilterConfirmProps } from "antd/es/table/interface";

// const defaultValues = {
// 	name: '',
// 	phone: '',
// 	email: '',
// 	password: '',
// 	address: '',
// 	permission: '',
// 	avatar: 'https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b',
// };
type DataIndex = keyof RevenueType;

export default function TotalRevenueList() {
  const [opened, setOpened] = useState(false);
  const [defaultValues, setDefaultValues] = useState<RevenueType>({
    id: "",
    expense: "",
    expenseDate: "",
  });
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const { removeRevenueId } = useRevenueSlice();
  const revenueRef = collection(firestore, "revenue");
  useRevenue();
  const { isLoading, revenue } = useRevenueSlice();

  const handleDelete = (record: any) => async () => {
    removeRevenueId(record?.id);
    const docRef = doc(revenueRef, record?.id);
    await deleteDoc(docRef);
  };

  const handleEditTeam = (record: RevenueType) => () => {
    setDefaultValues(record);
    setOpened(true);
  };

  const handleCancel = () => {
    setOpened(false);
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "expenseDate"
  ): ColumnType<RevenueType> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: RevenueType) => {
      if (type === "expenseDate") {
        return dayjs(record[dataIndex])
          .format("MM/YYYY")
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase());
      }
      return record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
    onFilterDropdownOpenChange: (visible: any) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text, record) => {
      if (type === "expenseDate") {
        return (
          <>
            {searchedColumn === dataIndex ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={
                  text
                    ? type === "expenseDate"
                      ? dayjs(text).format("MM/YYYY").toString()
                      : text.toString()
                    : ""
                }
              />
            ) : type === "expenseDate" ? (
              dayjs(text).format("MM/YYYY")
            ) : (
              text
            )}
          </>
        );
      }
      return (
        <div className="flex flex-col gap-2 items-center">
          {searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text?.toString() : ""}
            />
          ) : (
            <p className="text-base">{text}</p>
          )}
        </div>
      );
    },
  });

  const columns: ColumnsType<RevenueType> = [
    {
      title: "Giá chi phí",
      dataIndex: "expense",
      key: "expense",
      sorter: (a, b) => a.expense.localeCompare(b.expense),
      sortDirections: ["descend", "ascend"],
      render: (text) => {
        return <p>{text} $</p>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "expenseDate",
      key: "expenseDate",
      ...getColumnSearchProps("expenseDate", "expenseDate"),
    },
    {
      title: "Chỉnh sửa",
      dataIndex: "",
      key: "x",
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
              title="Xóa"
              description="Bạn có chắc là muốn xóa?"
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
        dataSource={revenue}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật chi phí"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll" }}
      >
        <EditTotalRevenue
          defaultValues={defaultValues}
          handleCancel={handleCancel}
        />
      </Modal>
    </div>
  );
}
