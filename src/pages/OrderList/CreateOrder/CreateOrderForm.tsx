import { InboxOutlined, SearchOutlined } from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import {
  Button,
  Form as FormAntDeisgn,
  Image,
  Input,
  InputRef,
  Space,
  Table,
  Upload,
  UploadProps,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs, { Dayjs } from "dayjs";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import {
  find,
  groupBy,
  isEmpty,
  isNull,
  lowerCase,
  map,
  some,
  startsWith,
} from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
// import {
//   FileAddOutlined,
//   QuestionCircleOutlined,
//   SearchOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import { ColumnType, FilterConfirmProps } from "antd/es/table/interface";
import { getJsDateFromExcel } from "excel-date-to-js";
import Highlighter from "react-highlight-words";
import { AiOutlineEye } from "react-icons/ai";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore } from "../../../lib/firebase";
import { OrdersModel } from "../../../models/OrdersModel";
import { useUser } from "../../../store/useUser";
import { isInvalidDate, isVietnamesePhoneNumber } from "../../../utils";
import { useContractType } from "../../Contract/ContractTypeList/useContractType";
import { useOrders } from "../useOrders";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const { Dragger } = Upload;

const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";
type DataIndex = keyof OrdersModel;

const defaultValues = {
  customer: "",
  status: "",
  phone: "",
  address: "",
  price: "",
  total: "",
  files: "",
  partnerOrderId: "",
  created: currentDate as Dayjs,
};

const schema = yup
  .object({
    // phone: yup
    //   .string()
    //   .required("Vui lòng nhập số điện thoại của bạn!")
    //   .test("phone", "Số điên thoại sai định dạng", (str, context) => {
    //     return isVietnamesePhoneNumber(str);
    //   }),
    // price: yup.string().required("Vui lòng giá"),
    // created: yup.date().required("Chọn ngày ký hợp đồng"),
    // address: yup.string().required("Vui lòng địa chỉ"),
  })
  .required();

export default function CreateOrderForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [errorDate, setErrorDate] = useState(false);
  const contractRef = collection(firestore, "orders");
  const searchOrderRef = collection(firestore, "searchOrders");
  const [fileList, setFileList] = useState<any[]>([]);
  const [fileExcelData, setFileExcelData] = useState<any[]>([]);
  const mutation = useFirestoreCollectionMutation(contractRef);
  const mutationSearchOrder = useFirestoreCollectionMutation(searchOrderRef);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const uuId = uuidv4();
  const { user } = useUser();
  const isAdmin = user?.permission === "Admin";
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const handleQuery = async () => {
      try {
        const employeeRef = collection(firestore, "employee");
        const docRef = doc(employeeRef, user?.id);
        const querySnapshot = await getDoc(docRef);
        setProductTypes(querySnapshot.data()?.productTypes || []);
      } catch (error) {
        console.log("error fetch employee", error);
      }
    };
    handleQuery();
  }, []);

  const handleUpload = async (info: any) => {
    if (info.file.status === "done") {
      setFileList([
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
          alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
        },
      ]);
      // setFileList((prev) => [
      //   ...prev,
      //   {
      //     id: uuidv4(),
      //     url: info.file.url,
      //     name: info.file.name,
      //     alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
      //   },
      // ]);
      setValue("files", [
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
          alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
        },
      ]);
      // setValue("files", [
      //   ...fileList,
      //   {
      //     id: uuidv4(),
      //     url: info.file.url,
      //     name: info.file.name,
      //     alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
      //   },
      // ]);
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  // const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
  //   if (fileList.length > 0) {
  //     const matchingUrls = fileList?.reduce((result: any, image: any) => {
  //       if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
  //         result.push(image);
  //       }
  //       return result;
  //     }, []);
  //     setFileList(matchingUrls);
  //     setValue("files", matchingUrls);
  //   }
  // };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      //   const storageRef = ref(storage, `/files/${file.name}`);

      //   const uploadTask = uploadBytesResumable(storageRef, file);
      const reader = new FileReader();
      const calculateSum = (data: any) => {
        // Assuming your Excel file has a column named 'price'
        const mapProductType = map(productTypes as any, (item) => ({
          ...item,
          name: lowerCase(item?.name),
        }));

        const array = [
          {
            type: "Shirt-T",
            name: "Shirt-T",
          },
          {
            type: "Hoodie",
            name: "Hoodie",
          },
          {
            type: "Sweatshirt",
            name: "Sweatshirt",
          },
        ];
        const mapFileExcel = map(data, (item) => {
          const itemType = lowerCase(item["Type"]).includes("sweatshirt")
            ? "Sweatshirt"
            : item["Type"].toLowerCase().includes("shirt")
            ? "T-Shirt"
            : item["Type"];
          const isExistItem = find(mapProductType as any, {
            name: lowerCase(itemType)?.trim(),
            size: `${item["Size"]}`.trim(),
          });

          const quantity = !isNull(item["Quantity"])
            ? `${item["Quantity"]}`
            : "1";
          function getDirectImageLink(originalLink: string) {
            if (!originalLink.includes("drive.google.com")) {
              console.error("Invalid Google Drive link.");
              return originalLink;
            }
            const fileId = extractFileId(originalLink);

            if (fileId) {
              return `https://drive.google.com/uc?export=download&id=${fileId}`;
            } else {
              console.error("Invalid Google Drive link.");
              return null;
            }
          }

          function extractFileId(originalLink: string) {
            const match = originalLink.match(/\/file\/d\/(.*?)(?:\/|$)/);
            return match ? match[1] : null;
          }

          const designPrice =
            !isEmpty(getDirectImageLink(item["Design Front"] || "")) &&
            !isEmpty(getDirectImageLink(item["Design Back"] || ""))
              ? isExistItem?.priceTwoSides
              : isExistItem?.priceOneSide;
          const format = "DD/MM/YYYY";

          const typeCreated =
            typeof item["Date"] === "number"
              ? dayjs(`${getJsDateFromExcels?.(item["Date"])}`, format)
              : dayjs(item["Date"], format);
          const discount = +quantity === 2 ? 3 : +quantity === 3 ? 6 : 0;
          const total =
            +quantity *
            (parseFloat(+designPrice as any) +
              parseFloat(isExistItem?.shipPrice));

          function getJsDateFromExcels(excelSerialDate: any) {
            const secondsInDay = 24 * 60 * 60;
            const excelEpoch = new Date("1899-12-30T00:00:00Z"); // Excel epoch

            // Convert Excel serial date to milliseconds
            const excelSerialMs = excelSerialDate * secondsInDay * 1000;

            // Calculate the JavaScript date
            const jsDate = new Date(excelEpoch.getTime() + excelSerialMs);

            // Format the date as "dd/mm/yyyy"
            const formattedDate = `${(jsDate.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${jsDate
              .getDate()
              .toString()
              .padStart(2, "0")}/${jsDate.getFullYear()}`;

            return formattedDate;
          }
          return {
            created: dayjs(typeCreated).toISOString(),
            address: item["Address line 1"] || "",
            city: item["City"] || "",
            imageFront: getDirectImageLink(item["Design Front"] || ""),
            imageBack: getDirectImageLink(item["Design Back"] || ""),
            mockup: getDirectImageLink(item["Mockup"] || ""),
            name: `${item["First name"] || ""} ${item["Last name"] || ""}`,
            partnerOrderId: `${item["Order ID"] || ""}`,
            quantity,
            type: item["Type"] || "",
            size: item["Size"] || "",
            // tracking: item["Tracking"] || "",
            phone: item["Phone"] || "",
            color: item["Color"] || "",
            refund: "",
            price: `${+designPrice}`,
            shipPrice: `${isExistItem?.shipPrice}`,
            total: parseFloat(`${+total - discount}`).toFixed(2),
            userId: user?.id,
            createdUserName: user?.name,
            orderId: uuidv4(),
          };
        });
        setFileExcelData(mapFileExcel);
      };

      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Do something with the jsonData (e.g., calculate sum)
        calculateSum(jsonData);
      };

      reader.readAsBinaryString(file);

      message.success(`${file.name} file uploaded successfully`);

      //   handleUpload({
      //     file: {
      //       status: "done",
      //       name: file.name,
      //       url,
      //     })

      //   uploadTask.on(
      //     "state_changed",
      //     (snapshot) => {
      //       const percent = Math.round(
      //         (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      //       );

      //       // update progress
      //       // setPercent(percent);
      //     },
      //     (err) => console.log(err),
      //     () => {
      //       // download url
      //       getDownloadURL(uploadTask.snapshot.ref).then((url) => {
      //         onSuccess();
      //         handleUpload({
      //           file: {
      //             status: "done",
      //             name: file.name,
      //             url,
      //           },
      //         });
      //       });
      //     }
      //   );
    } catch (error) {
      console.error("Error uploading file:", error);
      onError();
    }
  };
  const props: UploadProps = {
    name: "file",
    multiple: true,
    listType: "picture",
    // beforeUpload,
    fileList,
    customRequest,
    // onChange: handleChange,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
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
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
    },
    // {
    //   title: "Design Front",
    //   dataIndex: "imageFront",
    //   key: "imageFront",
    //   render: (text, record) => {
    //     return (
    //       <div className="flex flex-col gap-2 items-center">
    //         <div className="overflow-hidden rounded-lg drop-shadow-lg w-[40px] h-[40px]">
    //           {!isEmpty(text) ? (
    //             <Image
    //               src={text}
    //               width={40}
    //               height={40}
    //               preview={{
    //                 mask: <AiOutlineEye />,
    //               }}
    //             />
    //           ) : (
    //             "--"
    //           )}
    //         </div>
    //       </div>
    //     );
    //   },
    // },
    // {
    //   title: "Design Back",
    //   dataIndex: "imageBack",
    //   key: "imageBack",
    //   render: (text, record) => {
    //     return (
    //       <div className="flex flex-col items-center">
    //         <div className="overflow-hidden rounded-lg drop-shadow-lg w-[40px] h-[40px]">
    //           {!isEmpty(text) ? (
    //             <Image
    //               src={text}
    //               width={40}
    //               height={40}
    //               preview={{
    //                 mask: <AiOutlineEye />,
    //               }}
    //             />
    //           ) : (
    //             "--"
    //           )}
    //         </div>
    //       </div>
    //     );
    //   },
    // },
    // {
    //   title: "Mockup",
    //   dataIndex: "mockup",
    //   key: "mockup",
    //   render: (text, record) => {
    //     return (
    //       <div className="flex flex-col items-center">
    //         <div className="overflow-hidden rounded-lg drop-shadow-lg w-[40px] h-[40px]">
    //           {!isEmpty(text) ? (
    //             <Image
    //               src={text}
    //               width={40}
    //               height={40}
    //               preview={{
    //                 mask: <AiOutlineEye />,
    //               }}
    //             />
    //           ) : (
    //             "--"
    //           )}
    //         </div>
    //       </div>
    //     );
    //   },
    // },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price.localeCompare(b.price),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => {
        return <p>{text} $</p>;
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total.localeCompare(b.total),
      sortDirections: ["descend", "ascend"],
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
    },
  ];
  function hasNaNTotal(arr: any = []) {
    return some(arr, (obj) => obj.total === "NaN");
  }
  console.log("fileExcelData", fileExcelData);
  return (
    <>
      {contextHolder}
      {/* <div className="py-6">
        <PrintContract getValues={getValues} />
      </div> */}
      <FormAntDeisgn
        form={form}
        name="control-create-order-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit((data) => {
          // const payload: OrdersModel = {
          //   ...data,
          //   files: fileList,
          //   total: `${+data?.quality * +data?.price}`,
          //   created: data?.created?.toISOString?.() || "",
          // };
          // const payload = {
          //   orderId: user?.id,
          //   data: fileExcelData,
          //   created: dayjs()?.toISOString?.() || "",
          // };
          const groupedData = groupBy(fileExcelData, (item) => item.created);
          const groupedArray = Object.entries(groupedData).map(
            ([created, orders]) => ({
              created,
              orders,
              createdUser: user?.id,
              name: user?.name,
            })
          );

          groupedArray.forEach(
            (item) =>
              new Promise((resolve, reject) => {
                try {
                  mutation.mutate(item);
                  resolve(item);
                } catch (error) {
                  reject(error);
                }
              })
          );
          fileExcelData.forEach(
            (item) =>
              new Promise((resolve, reject) => {
                try {
                  mutationSearchOrder.mutate(item);
                  resolve(item);
                } catch (error) {
                  reject(error);
                }
              })
          );
          // console.log("payload", payload);
          // mutation.mutate(payload);
          // queryClient.invalidateQueries("orders");
          // setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Tạo thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
          setFileExcelData([]);
        })}
      >
        {/* <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem
            control={control}
            name="partnerOrderId"
            label="Partner OrderId"
          >
            <Input allowClear placeholder="Nhập mã order của khách hàng" />
          </FormItem>
          <FormItem control={control} name="customer" label="Tên khách hàng">
            <Input allowClear placeholder="Nhập tên khách hàng" />
          </FormItem>
          <FormItem control={control} name="phone" label="Số điện thoại">
            <Input allowClear placeholder="Nhập số điện thoại" />
          </FormItem>
        </div> */}
        {/* <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="address" label="Địa chỉ">
            <Input allowClear placeholder="Nhập địa chỉ" />
          </FormItem>
          <FormItem
            control={control}
            name="quality"
            label="Số lượng"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Price"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem
            control={control}
            name="price"
            label="Giá tiền"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Price"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
        </div> */}
        {/* <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem
            control={control}
            name="tracking"
            label="Tracking Number"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Tracking Number"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem control={control} name="created" label="Ngày ngày tạo">
            <DatePicker
              format={dateFormat}
              placeholder="Vui lòng chọn ngày ngày tạo"
              style={{ width: "100%" }}
            />
          </FormItem>
        </div> */}
        {fileExcelData.length > 0 && (
          <Table
            rowKey={(record) => `${uuidv4()}-${record.id}`}
            columns={columns}
            dataSource={fileExcelData}
            bordered
            scroll={{ x: 900 }}
          />
        )}
        <div className="py-6">
          <FormItem
            control={control}
            name="files"
            // valuePropName='fileList'
            label="Upload file "
          >
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Nhấp hoặc kéo tệp vào khu vực này để tải lên
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ tải lên một lần hoặc hàng loạt. Nghiêm cấm tải lên dữ
                liệu công ty hoặc các thông tin khác
              </p>
            </Dragger>
          </FormItem>
        </div>
        {/* <div className="pb-6">
          <FormItem control={control} name="notes" label="Ghi chú">
            <Editor />
          </FormItem>
        </div> */}
        {hasNaNTotal(fileExcelData) || errorDate ? (
          <span className="pb-6 text-base text-red-700">
            File upload có giá trị total không thoả điều kiện nên không được tạo
          </span>
        ) : null}

        <Button
          loading={loading}
          disabled={
            fileExcelData.length <= 0 || hasNaNTotal(fileExcelData) || errorDate
          }
          type="primary"
          htmlType="submit"
          block
          size="large"
          className="mt-6"
        >
          Create Order
        </Button>
      </FormAntDeisgn>
    </>
  );
}
