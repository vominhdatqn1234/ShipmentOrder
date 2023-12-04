import { yupResolver } from "@hookform/resolvers/yup";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import type { UploadProps } from "antd";
import {
  Button,
  DatePicker,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Upload,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs, { Dayjs } from "dayjs";
import { collection } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { isEmpty } from "lodash";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { InboxOutlined } from "@ant-design/icons";

import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import { PrintContract } from "../../../components/ComponentToPrint/PrintContract";
import Editor from "../../../components/Editor";
import { FormItem } from "../../../components/Form";
import { firestore, storage } from "../../../lib/firebase";
import { OrdersModel } from "../../../models/OrdersModel";
import { useUser } from "../../../store/useUser";
import { isVietnamesePhoneNumber } from "../../../utils";
import { useOrders } from "../useOrders";

const { Dragger } = Upload;

const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";

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
    phone: yup
      .string()
      .required("Vui lòng nhập số điện thoại của bạn!")
      .test("phone", "Số điên thoại sai định dạng", (str, context) => {
        return isVietnamesePhoneNumber(str);
      }),
    price: yup.string().required("Vui lòng giá"),
    created: yup.date().required("Chọn ngày ký hợp đồng"),
    address: yup.string().required("Vui lòng địa chỉ"),
  })
  .required();

export default function CreateOrderForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const contractRef = collection(firestore, "orders");
  const [fileList, setFileList] = useState<any[]>([]);
  const mutation = useFirestoreCollectionMutation(contractRef);
  const { refetch } = useOrders();
  const queryClient = useQueryClient();
  const uuId = uuidv4();
  const { user } = useUser();
  const isAdmin = user?.permission === "Admin";
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

  const handleUpload = async (info: any) => {
    if (info.file.status === "done") {
      console.log("info.file", info.file);
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
      const storageRef = ref(storage, `/files/${file.name}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );

          // update progress
          // setPercent(percent);
        },
        (err) => console.log(err),
        () => {
          // download url
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            onSuccess();
            handleUpload({
              file: {
                status: "done",
                name: file.name,
                url,
              },
            });
          });
        }
      );
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

  return (
    <>
      {contextHolder}
      <div className="py-6">
        <PrintContract getValues={getValues} />
      </div>
      <FormAntDeisgn
        form={form}
        name="control-create-order-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit((data) => {
          const payload: OrdersModel = {
            ...data,
            files: fileList,
            total: `${+data?.quality * +data?.price}`,
            created: data?.created?.toISOString?.() || "",
          };
          console.log("payload", payload);
          mutation.mutate(payload);
          queryClient.invalidateQueries("orders");
          setTimeout(async () => await refetch(), 300);
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
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
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
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
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
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
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
        </div>
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
        <Button
          loading={loading}
          disabled={!isEmpty(errors)}
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
