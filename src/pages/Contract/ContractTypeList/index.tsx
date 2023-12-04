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
import { useContractType } from "./useContractType";
import { ContractType } from "../../../models/ContractModel";
import { formatCurrency } from "../../../utils";
import EditContractType from "../EditContractType";
// import EditWeddingDressType from "../EditWeddingDressType";
// import { useWeddingDressType } from "./useWeddingDressType";

type DataIndex = keyof ContractType;

const ContractTypeList = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const { data: contractTypeData, isLoading, refetch } = useContractType();
  const collectionRef = collection(firestore, "contractType");
  const [opened, setOpened] = useState(false);
  const [defaultValues, setDefaultValues] = useState<ContractType>({
    contractName: "",
    contractPrice: "",
    contractType: "",
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
    queryClient.invalidateQueries("contractType");
    setTimeout(async () => await refetch(), 300);
  }

  const handleEditContractType = (record: ContractType) => () => {
    setDefaultValues({
      ...record,
    });
    setOpened(true);
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "orderItems" | "phone" = "orderItems"
  ): ColumnType<ContractType> => ({
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
    onFilter: (value: any, record: ContractType) =>
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

  const columns: ColumnsType<ContractType> = [
    {
      title: "Mã loại hợp đồng",
      dataIndex: "contractType",
      key: "contractType",
      sorter: (a, b) => a.contractType.localeCompare(b.contractType),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Tên loại hợp đồng",
      dataIndex: "contractName",
      key: "contractName",
      sorter: (a, b) => a.contractName.localeCompare(b.contractName),
      sortDirections: ["descend", "ascend"],
      ...getColumnSearchProps('contractName')
    },
    {
      title: "Giá loại hợp đồng",
      dataIndex: "contractPrice",
      key: "contractPrice",
      sorter: (a, b) => a.contractPrice.localeCompare(b.contractPrice),
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
              title="Xóa loại hợp đồng"
              description="Bạn có chắc là muốn xóa loại hợp đồng?"
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
        dataSource={contractTypeData}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật loại hợp đồng"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditContractType
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
};
export default ContractTypeList;
