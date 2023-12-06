import {
  FileAddOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Button,
  Input,
  InputRef,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tooltip,
} from "antd";
import type {
  ColumnType,
  ColumnsType,
  FilterConfirmProps,
} from "antd/es/table/interface";
import { useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";

import dayjs from "dayjs";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useQueryClient } from "react-query";
import ColorButton from "../../components/ColorButton";
import { firestore } from "../../lib/firebase";
import { colors } from "../../styles/colors";
import { formatCurrency } from "../../utils";
import { useOrders } from "./useOrders";
// import { OrdersModel } from "../../models";
// import EditContract from "./EditContract";
import { v4 as uuid } from "uuid";
import { OrdersModel } from "../../models/OrdersModel";
import { useUser } from "../../store/useUser";
import EditOrder from "./EditOrder";
import ExcelReader from "../../components/ExcelReader";
import RangePickerOrder from "./RangePickerOrder";
import { useOrdersHook } from "./useOrdersHook";
import { useOrderSlice } from "../../store/useOrderSlice";
const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";

type DataIndex = keyof OrdersModel;

const OrderList = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const { data: contractData, isLoading, refetch } = useOrders();
  useOrdersHook()
  const { orders: orderData } = useOrderSlice()

  const collectionRef = collection(firestore, "orders");
  const [opened, setOpened] = useState(false);
  const { user } = useUser();
  const [defaultValues, setDefaultValues] = useState<OrdersModel>({
    id: "",
    name: "",
    phone: "",
    address: "",
    created: "",
    price: "",
    total: "",
    status: "",
    partnerOrderId: "",
    quantity: "",
    size: "",
    userId: user?.id || "",
    type: "",
    tracking: '',
  });

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

  const handleEditContract = (record: OrdersModel) => () => {
    setDefaultValues({
      ...record,
      created: dayjs(record.created) as any,
    });
    setOpened(true);
  };

  const handleCancel = () => {
    setOpened(false);
  };

  const handleDelete = (record: OrdersModel) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("orders");
    setTimeout(async () => await refetch(), 300);
  };

  const handlePrint = (record: OrdersModel) => () => {
    console.log("record", record);
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "created" | "phone"
  ): ColumnType<OrdersModel> => ({
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
    onFilter: (value: any, record: OrdersModel) =>
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
      if (type === "created") {
        return (
          <>
            {searchedColumn === dataIndex ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={
                  text
                    ? type === "created"
                      ? dayjs(text).format("DD/MM/YYYY").toString()
                      : text.toString()
                    : ""
                }
              />
            ) : type === "created" ? (
              dayjs(text).format("DD/MM/YYYY")
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

  const columns: ColumnsType<OrdersModel> = [
    {
      title: "OrderId",
      dataIndex: "partnerOrderId",
      key: "partnerOrderId",
      // fixed: "left",
      //   width: "15%",
      ...getColumnSearchProps("partnerOrderId", "phone"),
    },
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    // {
    //   title: "Price",
    //   dataIndex: "price",
    //   key: "price",
    //   sorter: (a, b) => a.price.localeCompare(b.price),
    //   sortDirections: ["descend", "ascend"],
    //   render: (text: string) => {
    //     return <p>{formatCurrency(text)}</p>;
    //   },
    // },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total.localeCompare(b.total),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{text} $</p>;
      },
    },
    // {
    //   title: "Phone",
    //   dataIndex: "phone",
    //   key: "phone",
    //   ...getColumnSearchProps("phone", "phone"),
    // },
    {
      title: "Created",
      dataIndex: "created",
      key: "created",
      sorter: (a, b) => a.created.localeCompare(b.created),
      sortDirections: ["descend", "ascend"],
      ...getColumnSearchProps("created", "created"),
      // render: (text: string) => {
      //   return <p>{dayjs(text).format("DD/MM/YYYY")}</p>;
      // },
    },
    {
      title: "Tracking",
      dataIndex: "tracking",
      key: "tracking",
          render: (text: string) => {
        return <p>{text || '--'}</p>
      }
    },
  ];

  if (user?.permission === "Admin" || user?.permission === "Manager") {
    columns.push({
      title: "Action",
      dataIndex: "editDelete",
      key: "editDelete",
      render: (text, record) => (
        <div className="flex items-center gap-1">
          {/* <Tooltip title="Upload File">
            <ColorButton
              override={colors.primary}
              type="primary"
              size="small"
              icon={<FileAddOutlined />}
              onClick={handleEditContract(record)}
            />
          </Tooltip> */}
          {user?.permission === "Admin" ? (
            <>
              <Tooltip title="Chỉnh sửa">
                <ColorButton
                  override={colors.primary}
                  type="primary"
                  size="small"
                  icon={<FaEdit />}
                  onClick={handleEditContract(record)}
                />
              </Tooltip>

              <Tooltip title="Xoá">
                <Popconfirm
                  title="Xóa order"
                  description="Bạn có chắc là muốn xóa?"
                  icon={
                    <QuestionCircleOutlined style={{ color: colors.red2 }} />
                  }
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
            </>
          ) : null}
        </div>
      ),
    });
  }

  return (
    <div className="m-6 p-2 md:p-4 bg-white rounded-3xl">
      <div className="py-4">
        <RangePickerOrder />
      </div>
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              href: "/",
              title: "Home",
            },
            {
              title: "Shipment Infomation",
            },
          ]}
        />
      </div>
        
      <Table
        rowKey={(record) => `${uuid()}-${record.id}`}
        columns={columns}
        dataSource={orderData}
        bordered
        scroll={{ x: 900 }}
      />
      <Modal
        title="Cập nhật"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        width={1000}
        bodyStyle={{
          overflowY: "scroll",
          height: "calc(100vh - 250px)",
        }}
      >
        <EditOrder
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
};
export default OrderList;
