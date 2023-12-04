import React, { useState, useRef } from "react";
import { Badge, Image, Input, InputRef, Tooltip } from "antd";
import { Button, Space, Table, Breadcrumb } from "antd";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";
import { FaEdit } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { MdDeleteForever } from "react-icons/md";
import type {
  ColumnsType,
  FilterConfirmProps,
  ColumnType,
} from "antd/es/table/interface";
import { ordersData, ordersDataType } from "./data";
import { StatusColorType, getStatusColor } from "../../utils";
import dayjs from "dayjs";
import ColorButton from "../../components/ColorButton";
import { colors } from "../../styles/colors";
type DataIndex = keyof ordersDataType;

const Orders = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

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
    type: "orderItems" | "phone" = "orderItems"
  ): ColumnType<ordersDataType> => ({
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
          allowClear
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
    onFilter: (value: any, record: ordersDataType) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible: any) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text, record) => {
      if (type !== "orderItems") {
        return (
          <>
            {searchedColumn === dataIndex ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={text ? text.toString() : ""}
              />
            ) : (
              text
            )}
          </>
        );
      }
      return (
        <div className="flex gap-2 items-center">
          <div className="overflow-hidden rounded-lg drop-shadow-lg w-[40px] h-[40px]">
            <Image
              src={record.productImage}
              width={40}
              height={40}
              preview={{
                mask: <AiOutlineEye />,
              }}
            />
          </div>
          {searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ""}
            />
          ) : (
            <p className="font-semibold text-base">{text}</p>
          )}
        </div>
      );
    },
  });

  const columns: ColumnsType<ordersDataType> = [
    {
      title: "Tên hợp đồng",
      dataIndex: "orderItems",
      key: "orderItems",
      fixed: "left",
      width: "20%",
      ...getColumnSearchProps("orderItems", "orderItems"),
    },
    {
      title: "Tên váy cưới",
      dataIndex: "weddingDressName",
      key: "weddingDressName",
      sorter: (a, b) => a.createAt.localeCompare(b.createAt),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortDirections: ["descend", "ascend"],
      render: (text, record) => {
        return (
          <Badge
            color={getStatusColor(
              (`${text}`.toLowerCase() as StatusColorType) || "pending"
            )}
            text={text}
          />
        );
      },
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => a.phone.length - b.phone.length,
      sortDirections: ["descend", "ascend"],
      ...getColumnSearchProps("phone", "phone"),
    },
    {
      title: "Địa chỉ",
      dataIndex: "location",
      key: "location",
      sorter: (a, b) => a.location.length - b.location.length,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Ngày ký hợp đồng",
      dataIndex: "createAt",
      key: "createAt",
      sorter: (a, b) => a.createAt.localeCompare(b.createAt),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{dayjs(text).format("DD/MM/YYYY")}</p>;
      },
    },
    {
      title: "Chỉnh sửa",
      dataIndex: "",
      key: "x",
      render: () => (
        <div className="flex items-center gap-2">
          <Tooltip title="Chỉnh sửa">
            <ColorButton
              override={colors.primary}
              type="primary"
              size="small"
              icon={<FaEdit />}
            />
          </Tooltip>
          <Tooltip title="Xem bảng hợp đồng">
            <ColorButton
              override={colors.listItemTapColor}
              size="small"
              type="primary"
              icon={<AiOutlineEye />}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <ColorButton
              override={colors.red2}
              type="primary"
              size="small"
              icon={<MdDeleteForever />}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="m-6 p-2 md:p-10 bg-white rounded-3xl">
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              href: "/",
              title: "Trang chủ",
            },
            {
              title: "Danh sách hợp đồng",
            },
          ]}
        />
      </div>

      <Table
        rowKey={(record) => record.orderId}
        columns={columns}
        dataSource={ordersData}
        bordered
        scroll={{ x: 800 }}
      />
    </div>
  );
};
export default Orders;
