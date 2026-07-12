import React, { useState, useRef } from "react";
import {
  Badge,
  Image,
  Input,
  InputRef,
  Modal,
  Popconfirm,
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
import ColorButton from "../../components/ColorButton";
import { colors } from "../../styles/colors";
import { useQueryClient } from "react-query";
// import { useContract } from "./useContract";
import { collection, deleteDoc, doc } from "lib/db";
import { firestore } from "../../lib/firebase";
import { ContractModel } from "../../models";
import { map, uniq } from "lodash";
import { useUser } from "../../store/useUser";
import { usePriceWedding } from "./usePriceWedding";
import { cn } from "../../lib/cs";
import PriceWeddingEdit from "./PriceWeddingEdit";
import { PriceWeddingModel } from "../../models/PriceWeddingModel";

type DataIndex = keyof ContractModel;

const PriceWedding = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const { data: priceWeddingData, isLoading, refetch } = usePriceWedding();
  const collectionRef = collection(firestore, "priceWedding");
  const [opened, setOpened] = useState(false);
  const { user } = useUser();
  const [defaultValues, setDefaultValues] = useState<any>({
    title: "",
    gallery: [],
    id: "",
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

  const handleEditContract = (record: ContractModel) => () => {
    setDefaultValues({
      ...record,
      // createDate: dayjs(record.createDate) as any,
      // dueDate: dayjs(record.dueDate) as any,
    });
    setOpened(true);
  };

  const handleCancel = () => {
    setOpened(false);
  };

  const handleDelete = (record: PriceWeddingModel) => async () => {
    const docRef = doc(collectionRef, record?.id);
    await deleteDoc(docRef);
    queryClient.invalidateQueries("priceWedding");
    setTimeout(async () => await refetch(), 300);
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    type: "contractType" | "phone" = "contractType"
  ): ColumnType<ContractModel> => ({
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
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible: any) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text, record: any) => {
      if (type !== "contractType") {
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
            <Image.PreviewGroup items={map(record?.gallery, "url")}>
              <Image
                src={record.gallery[0]?.url}
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
            <p className="font-semibold text-base">{text}</p>
          )}
        </div>
      );
    },
  });

  const columns: ColumnsType<any> = [
    {
      title: "Tên tiêu đề bảng giá cưới",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Danh sách hình ảnh bảng giá",
      dataIndex: "gallery",
      key: "gallery",
      render: (text, record) => {
        return (
          <Image.PreviewGroup
            items={map(text, "url")}
            preview={{
              imageRender: (originSrc: any, previewSrc: any) => {
                return (
                  // <div className="group w-6/12 h-[400px] relative cursor-pointer items-center justify-center overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/30">
                  //   <div
                  //     className="absolute h-full w-full inset-0 bg-cover bg-no-repeat bg-center transition-transform duration-500 group-hover:rotate-3 group-hover:scale-125"
                  //     style={{ backgroundImage: `url(${originSrc.props.src})` }}
                  //   />
                  //   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 group-hover:from-black/70 group-hover:via-black/60 group-hover:to-black/70" />
                  //   <div
                  //     className={cn(
                  //       "absolute inset-0 flex flex-col items-center justify-center px-9 text-center transition-all duration-500 group-hover:translate-y-0 translate-y-[55%]"
                  //     )}
                  //   >
                  //     <h2 className="font-dmserif text-2xl font-bold text-white">
                  //       {text?.[previewSrc.current]?.title}
                  //     </h2>
                  //     <p className="mb-3 text-lg italic text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  //       {text?.[previewSrc.current]?.description}
                  //     </p>
                  //   </div>
                  // </div>
                  <div
                    className="ml-2 overflow-hidden bg-cover rounded-lg cursor-pointer w-6/12 h-[400px] group"
                    style={{ backgroundImage: `url(${originSrc.props.src})` }}
                  >
                    <div className="overlay">
                      <div className="border-animate">
                        <h2 className="mt-4 text-xl md:text-2xl font-semibold text-white capitalize">
                          {text?.[previewSrc.current]?.title}
                        </h2>
                        <p className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-base tracking-wider text-white uppercase">
                          {text?.[previewSrc.current]?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            }}
          >
            <Image
              src={text?.[0]?.url}
              width={40}
              height={40}
              preview={{
                mask: <AiOutlineEye />,
              }}
            />
          </Image.PreviewGroup>
        );
      },
    },
  ];

  if (user?.permission === "Admin") {
    columns.push({
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
              onClick={handleEditContract(record)}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xóa bảng giá dịch vụ cưới"
              description="Bạn có chắc là muốn xóa bảng giá dịch vụ cưới?"
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
    });
  }

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
              title: "Danh sách bảng giá",
            },
          ]}
        />
      </div>

      <Table
        rowKey={(record) => record.id}
        columns={columns}
        dataSource={priceWeddingData}
        bordered
        scroll={{ x: 800 }}
      />
      <Modal
        title="Cập nhật bảng giá"
        open={opened}
        footer={null}
        centered
        onCancel={handleCancel}
      >
        <PriceWeddingEdit
          defaultValues={defaultValues}
          handleCancel={handleCancel}
          refetch={refetch}
        />
      </Modal>
    </div>
  );
};
export default PriceWedding;
