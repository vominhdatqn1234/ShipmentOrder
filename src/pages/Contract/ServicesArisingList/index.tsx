import { SearchOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import {
  Breadcrumb,
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
import type {
  ColumnType,
  ColumnsType,
  FilterConfirmProps,
} from "antd/es/table/interface";
import { collection, deleteDoc, doc } from "lib/db";
import { useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useQueryClient } from "react-query";
import ColorButton from "../../../components/ColorButton";
import { firestore } from "../../../lib/firebase";
import { colors } from "../../../styles/colors";

import { ServicesArising } from "../../../models/ContractModel";
import { formatCurrency } from "../../../utils";
import EditServicesArising from "../EditServicesArising";
import { useServicesArising } from "./useServicesArising";

type DataIndex = keyof ServicesArising;

const ServicesArisingList = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const { data: servicesArisingData, isLoading, refetch } = useServicesArising();
  const collectionRef = collection(firestore, "servicesArising");
  const [opened, setOpened] = useState(false);
  const [defaultValues, setDefaultValues] = useState<ServicesArising>({
    serviceName: "",
    servicePrice: "",
    serviceType: "",
    id: "",
  });

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

  const handleDelete = (record: any) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("servicesArising");
    setTimeout(async () => await refetch(), 300);
  }

  const handleEditContractType = (record: ServicesArising) => () => {
    setDefaultValues({
      ...record,
    });
    setOpened(true);
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "orderItems" | "phone" = "orderItems"
  ): ColumnType<ServicesArising> => ({
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
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: ServicesArising) =>
     `${record?.[dataIndex] || ''}`
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible: any) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text, record) => {
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
    },
  });

  const columns: ColumnsType<ServicesArising> = [
    {
      title: "Mã loại danh mục phát sinh",
      dataIndex: "serviceType",
      key: "serviceType",
      sorter: (a, b) => a.serviceType.localeCompare(b.serviceType),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Tên loại danh mục phát sinh",
      dataIndex: "serviceName",
      key: "serviceName",
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
      sortDirections: ["descend", "ascend"],
      ...getColumnSearchProps('serviceName')
    },
    {
      title: "Giá loại danh mục phát sinh",
      dataIndex: "servicePrice",
      key: "servicePrice",
      sorter: (a, b) => a.servicePrice.localeCompare(b.servicePrice),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{formatCurrency(text)}</p>;
      },
    },
    {
      title: "Chỉnh sửa",
      dataIndex: "",
      key: "x",
      //   width: "12%",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Chỉnh sửa">
            <ColorButton
              override={colors.primary}
              type="primary"
              size="small"
              icon={<FaEdit />}
              onClick={handleEditContractType(record)}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xóa loại danh mục phát sinh"
              description="Bạn có chắc là muốn xóa danh mục phát sinh?"
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
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              href: "/",
              title: "Trang chủ",
            },
            {
              title: "Danh sách danh mục phát sinh",
            },
          ]}
        />
      </div>

      <Table
        rowKey={(record) => record.id}
        columns={columns as any}
        dataSource={servicesArisingData}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật danh mục phát sinh"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditServicesArising
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
};
export default ServicesArisingList;
