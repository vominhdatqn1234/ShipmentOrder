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
import { collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
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
import { ProductType } from "../../../models/ProductTypeModel";
import { useProductTypeSlice } from "../../../store/useProductType";
import { produce } from "immer";
import { useProductTypeHook } from "./useProductTypeHook";
import { sortBy } from "lodash";
// import EditWeddingDressType from "../EditWeddingDressType";
// import { useWeddingDressType } from "./useWeddingDressType";

type DataIndex = keyof ProductType;

const ContractTypeList = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  // const { data: productTypeData, isLoading, refetch } = useContractType();
  const {
    setProductsType,
    isLoading,
    productsType: productTypeData,
    removeProductTypeId,
  } = useProductTypeSlice();
  useProductTypeHook();

  const collectionRef = collection(firestore, "employee");
  const [opened, setOpened] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<ProductType>({
    name: "",
    priceOneSide: "",
    priceTwoSides: "",
    shipPrice: "",
    size: "",
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
    // removeProductTypeId(record?.id);
    // const docRef = doc(collectionRef, record?.id);
    // await deleteDoc(docRef);
    // const deletedProductTypesArray = produce(productTypeData, (draft) => {
    //   const index = draft.findIndex((todo) => todo.id === record?.id);
    //   if (index !== -1) draft.splice(index, 1);
    // });
    // setProductsType(deletedProductTypesArray);
  };

  const handleEditContractType = (record: ProductType) => () => {
    setDefaultValues({
      ...record,
    });
    setOpened(true);
  };

  // useEffect(() => {
  //   const handleQuery = async () => {
  //     try {
  //       const ref = query(collection(firestore, "productType"));
  //       const querySnapshot = await getDocs(ref);
  //       let data: any = [];
  //       querySnapshot.forEach((doc) => {
  //         data.push({ id: doc.id, ...doc.data() });
  //       });
  //       setProductsType(data);
  //     } catch (error) {
  //       console.log("error fetch product type", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   handleQuery();
  // }, []);

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "orderItems" | "phone" = "orderItems"
  ): ColumnType<ProductType> => ({
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
    onFilter: (value: any, record: ProductType) =>
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

  const columns: ColumnsType<ProductType> = [
    {
      title: "Tên loại hợp đồng",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
      ...getColumnSearchProps("name"),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      sorter: (a, b) => a.size.localeCompare(b.size),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Giá 1 mặt",
      dataIndex: "priceOneSide",
      key: "priceOneSide",
      sorter: (a, b) => a.priceOneSide.localeCompare(b.priceOneSide),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{text} $</p>;
      },
    },
    {
      title: "Giá 2 mặt",
      dataIndex: "priceTwoSides",
      key: "priceTwoSides",
      sorter: (a, b) => a.priceTwoSides.localeCompare(b.priceTwoSides),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{text} $</p>;
      },
    },
    {
      title: "Ship",
      dataIndex: "shipPrice",
      key: "shipPrice",
      sorter: (a, b) => a.shipPrice.localeCompare(b.shipPrice),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{text} $</p>;
      },
    },
    {
      title: "Tổng 1 mặt",
      dataIndex: "priceOneSide",
      key: "totalPriceOneSide",
      sorter: (a, b) => a.priceOneSide.localeCompare(b.priceOneSide),
      sortDirections: ["descend", "ascend"],
      render: (text: string, record) => {
        return <p>{parseFloat(`${parseFloat(text) + parseFloat(record?.shipPrice)}`).toFixed(2)} $</p>;
      },
    },
    {
      title: "Tổng 2 mặt",
      dataIndex: "priceTwoSides",
      key: "totalPriceTwoSides",
      sorter: (a, b) => a.priceOneSide.localeCompare(b.priceOneSide),
      sortDirections: ["descend", "ascend"],
      render: (text: string, record) => {
        return <p>{parseFloat(`${parseFloat(text) + parseFloat(record?.shipPrice)}`).toFixed(2)} $</p>;
      },
    },
    // {
    //   title: "Chỉnh sửa",
    //   dataIndex: "",
    //   key: "x",
    //   //   width: "12%",
    //   render: (text, record) => (
    //     <div className="flex items-center gap-2">
    //       <Tooltip title="Chỉnh sửa">
    //         <ColorButton
    //           override={colors.primary}
    //           type="primary"
    //           size="small"
    //           icon={<FaEdit />}
    //           onClick={handleEditContractType(record)}
    //         />
    //       </Tooltip>
    //       <Tooltip title="Xoá">
    //         <Popconfirm
    //           title="Xóa loại sản phẩm"
    //           description="Bạn có chắc là muốn xóa loại sản phẩm?"
    //           icon={<QuestionCircleOutlined style={{ color: colors.red2 }} />}
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

  if (isLoading) {
    return (
      <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }
  const sortingOrder: any = {
    "T-Shirt": 1,
    Sweatshirt: 2,
    Hoodie: 3,
    S: 1,
    M: 2,
    L: 3,
    XL: 4,
    "2XL": 5,
    "3XL": 6,
    "4XL": 7,
    "5XL": 8,
  };
  const sortedProducts = sortBy(productTypeData, [
    (product) => sortingOrder[product.name],
    (product) => sortingOrder[product.size],
  ]);

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
              title: "Danh sách loại sản phẩm",
            },
          ]}
        />
      </div>

      <Table
        rowKey={(record) => record.id}
        columns={columns as any}
        dataSource={sortedProducts}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật loại sản phẩm"
        open={opened}
        footer={null}
        onCancel={handleCancel}
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
      >
        <EditContractType
          defaultValues={defaultValues as any}
          handleCancel={handleCancel}
          refetch={() => {}}
        />
      </Modal>
    </div>
  );
};
export default ContractTypeList;
