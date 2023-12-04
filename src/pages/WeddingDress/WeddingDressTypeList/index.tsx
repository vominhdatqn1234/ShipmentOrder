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
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useQueryClient } from "react-query";
import ColorButton from "../../../components/ColorButton";
import { firestore } from "../../../lib/firebase";
import { WeddingDressTypeModel } from "../../../models/WeddingDressModel";
import { colors } from "../../../styles/colors";
import EditWeddingDressType from "../EditWeddingDressType";
import { useWeddingDressType } from "./useWeddingDressType";

type DataIndex = keyof WeddingDressTypeModel;

const WeddingDressTypeList = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const { data: weddingDressData, isLoading, refetch } = useWeddingDressType();
  const collectionRef = collection(firestore, "weddingDressType");
  const [opened, setOpened] = useState(false);
  const [defaultValues, setDefaultValues] = useState<WeddingDressTypeModel>({
    dressCode: "",
    dressCodeName: "",
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

  const handleEditWeddingDress = (record: WeddingDressTypeModel) => () => {
    setDefaultValues({
      ...record,
    });
    setOpened(true);
  };

  const handleDelete = (record: any) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("weddingDressType");
    setTimeout(async () => await refetch(), 300);
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "orderItems" | "phone" = "orderItems"
  ): ColumnType<WeddingDressTypeModel> => ({
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
    onFilter: (value: any, record: WeddingDressTypeModel) =>
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

  const columns: ColumnsType<WeddingDressTypeModel> = [
    {
      title: "Mã loại váy cưới",
      dataIndex: "dressCode",
      key: "dressCode",
      sorter: (a, b) => a.dressCode.localeCompare(b.dressCode),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Tên loại váy cưới",
      dataIndex: "dressCodeName",
      key: "dressName",
      //   fixed: "left",
      //   width: "30%",
      ...getColumnSearchProps("dressCodeName"),
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
              onClick={handleEditWeddingDress(record)}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xóa loại váy cưới"
              description="Bạn có chắc là muốn xóa loại váy cưới?"
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
              title: "Danh sách váy cưới",
            },
          ]}
        />
      </div>

      <Table
        rowKey={(record) => record.id}
        columns={columns as any}
        dataSource={weddingDressData}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật tên loại váy cưới"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditWeddingDressType
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
};
export default WeddingDressTypeList;
