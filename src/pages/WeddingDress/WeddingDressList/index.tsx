import React, { useState, useRef } from "react";
import {
  Image,
  Input,
  InputRef,
  Modal,
  Popconfirm,
  Skeleton,
  Switch,
  Tooltip,
} from "antd";
import { Button, Space, Table, Breadcrumb } from "antd";
import Highlighter from "react-highlight-words";
import { SearchOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { FaEdit } from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { MdDeleteForever } from "react-icons/md";
import type {
  ColumnsType,
  FilterConfirmProps,
  ColumnType,
} from "antd/es/table/interface";
import { useQueryClient } from "react-query";
import ColorButton from "../../../components/ColorButton";
import { colors } from "../../../styles/colors";
import { formatCurrency } from "../../../utils";
import { WeddingDressModel } from "../../../models";
import { useWeddingDress } from "./useWeddingDress";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { map } from "lodash";
import EditWeddingDress from "../EditWeddingDress";
import { useUser } from "../../../store/useUser";

type DataIndex = keyof WeddingDressModel;

const WeddingDressList = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const { data: weddingDressData, isLoading, refetch } = useWeddingDress();
  const collectionRef = collection(firestore, "weddingDress");
  const [opened, setOpened] = useState(false);
  const { user } = useUser();
  const [defaultValues, setDefaultValues] = useState<WeddingDressModel>({
    dressCode: "",
    dressName: "",
    dressPrice: "",
    dressPriceSale: "",
    dressQuantity: 1,
    dressShape: "",
    dressImage: [],
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

  const handleEditWeddingDress = (record: WeddingDressModel) => () => {
    setDefaultValues({
      ...record,
    });
    setOpened(true);
  };

  const handleDelete = (record: any) => async () => {
    const docRef = doc(collectionRef, record.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("weddingDress");
    setTimeout(async () => await refetch(), 300);
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "orderItems" | "phone" = "orderItems"
  ): ColumnType<WeddingDressModel> => ({
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
    onFilter: (value: any, record: WeddingDressModel) =>
      `${record?.[dataIndex] || ""}`
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
        <div className="flex flex-col gap-2 items-center">
          <div className="overflow-hidden rounded-lg drop-shadow-lg w-[40px] h-[40px]">
            <Image.PreviewGroup items={map(record.dressImage, "url")}>
              <Image
                src={record.dressImage[0].url}
                width={40}
                height={40}
                preview={{
                  mask: <AiOutlineEye />,
                }}
              />
            </Image.PreviewGroup>
          </div>
          {searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ""}
            />
          ) : (
            <p className="font-medium text-sm">{text}</p>
          )}
        </div>
      );
    },
  });

  const columns: ColumnsType<WeddingDressModel> = [
    {
      title: "Tên váy cưới",
      dataIndex: "dressName",
      key: "dressName",
      fixed: "left",
      width: "15%",
      ...getColumnSearchProps("dressName", "orderItems"),
    },
    {
      title: "Loại váy cưới",
      dataIndex: "dressCode",
      key: "dressCode",
      sorter: (a, b) => a.dressCode.localeCompare(b.dressCode),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Dáng váy cưới",
      dataIndex: "dressShape",
      key: "dressShape",
      width: "10%",
      sorter: (a, b) => a.dressShape.localeCompare(b.dressShape),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Giá",
      dataIndex: "dressPrice",
      key: "dressPrice",
      width: "12%",
      sorter: (a, b) => a.dressPrice.localeCompare(b.dressPrice),
      sortDirections: ["descend", "ascend"],
      render: (text, record) => {
        return formatCurrency(text);
      },
    },
    {
      title: "Giá sale",
      dataIndex: "dressPriceSale",
      key: "dressPriceSale",
      sorter: (a, b) => a.dressPriceSale.localeCompare(b.dressPriceSale),
      sortDirections: ["descend", "ascend"],
      render: (text, record) => {
        return formatCurrency(text);
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "20%",
    },
    {
      title: "SL",
      dataIndex: "dressQuantity",
      key: "dressQuantity",
      width: "5%",
      sorter: (a, b) => a.dressQuantity - b.dressQuantity,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Size",
      dataIndex: "sizes",
      key: "sizes",
      width: "10%",
    },

    // {
    //   title: "Chỉnh sửa",
    //   dataIndex: "",
    //   key: "x",
    //   width: "8%",
    //   fixed: "right",
    //   render: (text, record) => (
    //     <div className="flex items-center gap-2">
    //       <Tooltip title="Chỉnh sửa">
    //         <ColorButton
    //           override={colors.primary}
    //           type="primary"
    //           size="small"
    //           icon={<FaEdit />}
    //           onClick={handleEditWeddingDress(record)}
    //         />
    //       </Tooltip>
    //       <Tooltip title="Xoá">
    //         <Popconfirm
    //           title="Xóa váy cưới"
    //           description="Bạn có chắc là muốn xóa váy cưới không?"
    //           icon={<QuestionCircleOutlined style={{ color: "red" }} />}
    //           onConfirm={handleDelete(record)}
    //         >
    //           <ColorButton
    //             override={colors.red2}
    //             type="primary"
    //             size="small"
    //             icon={<MdDeleteForever />}
    //           />
    //         </Popconfirm>
    //       </Tooltip>
    //     </div>
    //   ),
    // },
  ];
  if (user?.permission === "Admin") {
    columns.push({
      title: "Chỉnh sửa",
      dataIndex: "editDelete",
      key: "editDelete",
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Chỉnh sửa">
            <ColorButton
              override={colors.primary}
              type="primary"
              size="small"
              icon={<FaEdit />}
              onClick={handleEditWeddingDress(record)}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xóa váy cưới"
              description="Bạn có chắc là muốn xóa váy cưới không?"
              icon={<QuestionCircleOutlined style={{ color: "red" }} />}
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
    });
  }

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
              title: "Danh sách váy cưới",
            },
          ]}
        />
      </div>

      <Table
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={weddingDressData}
        bordered
        scroll={{ x: 1300 }}
      />
      <Modal
        title="Cập nhật váy cưới"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditWeddingDress
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
};
export default WeddingDressList;
