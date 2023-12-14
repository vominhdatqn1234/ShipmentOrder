import { InboxOutlined } from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  DatePicker,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Upload,
  UploadProps,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { collection, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { isEmpty, map, omit } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { cn } from "../../../lib/cs";
import { firestore, storage } from "../../../lib/firebase";
import { ContractModel } from "../../../models";
import { useUser } from "../../../store/useUser";
import { isVietnamesePhoneNumber } from "../../../utils";
import { OrdersModel } from "../../../models/OrdersModel";
import { useOrderSlice } from "../../../store/useOrderSlice";
import { produce } from "immer";
const { Dragger } = Upload;

const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";

const schema = yup
  .object({
    // phone: yup
    //   .string()
    //   .required("Vui lòng nhập số điện thoại của bạn!")
    //   .test("phone", "Số điên thoại sai định dạng", (str, context) => {
    //     return isVietnamesePhoneNumber(str);
    //   }),
    // created: yup.date().required("Chọn ngày ký hợp đồng"),
    // address: yup.string().required("Vui lòng địa chỉ"),
  })
  .required();

export default function EditOrder({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: OrdersModel;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const { orders, updateOrderId } = useOrderSlice();
  const contractRef = collection(firestore, "orders");
  // const queryClient = useQueryClient();
  const { user } = useUser();
  const isAdmin = user?.permission === "Admin";

  // const [fileList, setFileList] = useState<any[]>(
  //   (defaultValues as any).files || []
  // );
  const uuId = uuidv4();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<any>({
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    form.setFieldsValue({
      id: defaultValues.id,
      partnerOrderId: defaultValues.partnerOrderId,
      name: defaultValues?.name,
      phone: defaultValues?.phone,
      address: defaultValues?.address,
      price: defaultValues?.price,
      total: defaultValues?.total,
      status: defaultValues?.status,
      created: defaultValues?.created,
      quantity: defaultValues?.quantity,
      tracking: defaultValues?.tracking,
      refund: defaultValues?.refund,
      payment: defaultValues?.payment,
      note: defaultValues?.note
    });
  }, [defaultValues, form]);

  // const handleUpload = async (info: any) => {
  //   if (info.file.status === "done") {
  //     setFileList([
  //       {
  //         id: uuId,
  //         url: info.file.url,
  //         name: info.file.name,
  //       },
  //     ]);
  //     setValue("files", [
  //       {
  //         id: uuId,
  //         url: info.file.url,
  //         name: info.file.name,
  //       },
  //     ]);
  //     message.success(`${info.file.name} file uploaded successfully`);
  //   } else if (info.file.status === "error") {
  //     message.error(`${info.file.name} file upload failed.`);
  //   }
  // };

  // const customRequest = async ({ file, onSuccess, onError }: any) => {
  //   try {
  //     const storageRef = ref(storage, `/files/${file.name}`);

  //     const uploadTask = uploadBytesResumable(storageRef, file);

  //     uploadTask.on(
  //       "state_changed",
  //       (snapshot) => {
  //         const percent = Math.round(
  //           (snapshot.bytesTransferred / snapshot.totalBytes) * 100
  //         );

  //         // update progress
  //         // setPercent(percent);
  //       },
  //       (err) => console.log(err),
  //       () => {
  //         // download url
  //         getDownloadURL(uploadTask.snapshot.ref).then((url) => {
  //           onSuccess();
  //           handleUpload({
  //             file: {
  //               status: "done",
  //               name: file.name,
  //               url,
  //             },
  //           });
  //         });
  //       }
  //     );
  //   } catch (error) {
  //     console.error("Error uploading file:", error);
  //     onError();
  //   }
  // };
  // const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
  //   if (fileList.length > 0) {
  //     const matchingUrls = fileList?.reduce((result: any, image: any) => {
  //       if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
  //         result.push(image);
  //       }
  //       return result;
  //     }, []);
  //     setFileList(matchingUrls);
  //     setValue("contractImage", matchingUrls);
  //   }
  // };
  // const props: UploadProps = {
  //   name: "file",
  //   multiple: true,
  //   listType: "picture",
  //   // beforeUpload,
  //   customRequest,
  //   onChange: handleChange,
  //   fileList,
  //   onDrop(e) {
  //     console.log("Dropped files", e.dataTransfer.files);
  //   },
  // };

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-contract-edit-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data: OrdersModel) => {
          const discount =
            +data?.quantity === 2 ? 3 : +data?.quantity === 3 ? 6 : 0;
          const payload: OrdersModel = {
            ...data,
            // files: fileList,
            total: `${parseFloat(
              `${
                +data?.quantity * parseFloat(data?.price) +
                parseFloat((data as any)?.shipPrice) -
                discount
              }`
            ).toFixed(2)}`,
            payment: defaultValues?.payment || '',
            created: dayjs(defaultValues.created).toISOString() || "",
            tracking: `${data?.tracking || ""}`,
          };
          setLoading(true);
          const updatedOrdersArray = (defaultValues as any)?.orders?.length > 0 ? produce(
            (defaultValues as any)?.orders,
            (order: any) => {
              const indexToUpdate = order.findIndex(
                (item: OrdersModel) => item.orderId === payload.orderId
              );
              if (indexToUpdate !== -1) {
                order[indexToUpdate] = payload;
              }
            }
          ) : [];
          // console.log("payload", payload, updatedOrdersArray);
          updateOrderId(defaultValues.orderId, payload);
          const docRef = doc(contractRef,(defaultValues as any)?.parentId);
          await updateDoc(docRef, {
            orders: map(updatedOrdersArray, (order) => omit(order, "orders")),
          });

          messageApi.open({
            type: "success",
            content: "Cập nhập thành công!",
            duration: 5,
          });
          setLoading(false);
          handleCancel?.();
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
            <Input allowClear disabled placeholder="Nhập mã order của khách hàng" />
          </FormItem>
          {/* <FormItem control={control} name="name" label="Tên khách hàng">
            <Input allowClear placeholder="Nhập tên khách hàng" />
          </FormItem> */}
          <FormItem
            control={control}
            name="payment"
            label="pay"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Pay"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem
            control={control}
            name="refund"
            label="Refund"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Refund"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="address" label="Địa chỉ">
            <Input allowClear placeholder="Nhập địa chỉ" />
          </FormItem>
          <FormItem
            control={control}
            name="quantity"
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
          <FormItem control={control} name="color" label="Color">
            <Input allowClear placeholder="Nhập color" />
          </FormItem>
          <FormItem
            control={control}
            name="tracking"
            label="Tracking Number"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Tracking Number"
            />
          </FormItem>
          <FormItem
            control={control}
            name="note"
            label="Note"
          >
            <Input.TextArea placeholder="Nhập ghi chú" />
          </FormItem>
          {/* <FormItem control={control} name="created" label="Ngày ngày tạo">
            <DatePicker
              format={dateFormat}
              placeholder="Vui lòng chọn ngày ngày tạo"
              style={{ width: "100%" }}
            />
          </FormItem> */}
        </div>
        {/* <div className="py-6">
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
        </div> */}
        {/* <div className="pb-20 ">
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
        >
          Cập nhật
        </Button>
      </FormAntDeisgn>
    </>
  );
}
