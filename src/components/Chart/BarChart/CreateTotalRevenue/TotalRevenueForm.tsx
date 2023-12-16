import { yupResolver } from "@hookform/resolvers/yup";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import {
  Button,
  DatePicker,
  Form as FormAntDeisgn,
  InputNumber,
  InputRef,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs, { Dayjs } from "dayjs";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
// import {
//   FileAddOutlined,
//   QuestionCircleOutlined,
//   SearchOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import { firestore } from "../../../../lib/firebase";
import { FormItem } from "../../../Form";
dayjs.extend(customParseFormat);

const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";

const defaultValues = {
  expense: "",
  expenseDate: currentDate as Dayjs,
};

const schema = yup
  .object({
    expense: yup.string().required("Vui lòng giá chi phí"),
    expenseDate: yup.date().required("Chọn chi phí tháng"),
  })
  .required();

export default function TotalRevenueForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [errorDate, setErrorDate] = useState(false);
  const revenueRef = collection(firestore, "revenue");
  const mutation = useFirestoreCollectionMutation(revenueRef);
  //   const mutationSearchOrder = useFirestoreCollectionMutation(searchOrderRef);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const uuId = uuidv4();
  //   const { user } = useUser();
  //   const isAdmin = user?.permission === "Admin";

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

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-create-order-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data) => {
          setLoading(true);
          const payload: any = {
            ...data,
            expenseDate: data?.expenseDate?.toISOString?.() || "",
            month: dayjs(data?.expenseDate).month() + 1,
            year: dayjs(data?.expenseDate).year()
          };
          const revenueRef = query(
            collection(firestore, "revenue"),
            where("month", "==", dayjs(data?.expenseDate).month() + 1),
            where("year", "==", dayjs(data?.expenseDate).year()),
            limit(1)
          );
          const querySnapshot = await getDocs(revenueRef);
          if (!querySnapshot.empty) {
            messageApi.open({
              type: "success",
              content: "Bạn đã tạo chi phí cho tháng này vui lòng quay về danh sách chi phí để cập nhật giá!",
              duration: 5,
            });
          } else {
            mutation.mutate(payload);
            messageApi.open({
              type: "success",
              content: "Tạo thành công!",
              duration: 5,
            });
            form.resetFields();
            formRef.current?.resetFields();
            reset();
          }
          setLoading(false);
        })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormItem
            control={control}
            name="expense"
            label="Giá chi phí"
            valuePropName="value"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Chi phí"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
        <FormItem control={control} name="expenseDate" label="Chi phí tháng">
          <DatePicker
            picker="month"
            placeholder="Vui lòng chọn chi phí tháng"
            style={{ width: "100%" }}
          />
        </FormItem>
        </div>
        
        <Button
          loading={loading}
          disabled={errorDate}
          type="primary"
          htmlType="submit"
          block
          size="large"
          className="mt-6"
        >
          Create expense
        </Button>
      </FormAntDeisgn>
    </>
  );
}
