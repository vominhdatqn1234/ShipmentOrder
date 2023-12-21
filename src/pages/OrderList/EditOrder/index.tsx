import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Upload,
  message
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { collection, doc, updateDoc } from "firebase/firestore";
import { produce } from "immer";
import { isEmpty, map, omit } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore } from "../../../lib/firebase";
import { OrdersModel } from "../../../models/OrdersModel";
import { useOrderSlice } from "../../../store/useOrderSlice";

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
  const { updateOrderId, newTerm, updateSearchOrderId } = useOrderSlice();
  const contractRef = collection(firestore, "orders");

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
            total: `${parseFloat(
              `${
                +data?.quantity * parseFloat(data?.price) +
                parseFloat((data as any)?.shipPrice) -
                discount
              }`
            ).toFixed(2)}`,
            payment: data?.payment || '',
            created: dayjs(defaultValues.created).toISOString() || "",
            note: data?.note || '',
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
          if (newTerm.length >= 4) {
            updateSearchOrderId(defaultValues.orderId, payload);
          } else {
            updateOrderId(defaultValues.orderId, payload);
          }
          
          const docRef = doc(contractRef,(defaultValues as any)?.parentId);
          await updateDoc(docRef, {
            orders: map(updatedOrdersArray, (order) => omit(order, "orders")),
          });

          messageApi.open({
            type: "success",
            content: "Cập nhập thành công!",
            duration: 1,
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
            <Input
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
        </div>
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
