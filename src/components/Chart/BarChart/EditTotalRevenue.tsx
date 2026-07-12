import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  InboxOutlined,
} from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadProps } from "antd";
import {
  Button,
  DatePicker,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "lib/db";
import { getDownloadURL, ref, uploadBytesResumable } from "lib/supastorage";
import { isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore, storage } from "../../../lib/firebase";
import { EmployeeModel } from "../../../models";
import { isVietnamesePhoneNumber, regexPassword } from "../../../utils";
import { useEmployeeSlice } from "../../../store/useEmployeeSlice";
import { RevenueType } from "../../../models/Revenue";
import { useRevenueSlice } from "../../../store/useRevenue";
const { Dragger } = Upload;

const schema = yup
  .object({
    expense: yup.string().required("Vui lòng chi phí"),
  })
  .required();

export default function EditTotalRevenue({
  handleCancel,
  defaultValues,
}: {
  handleCancel?: () => void;
  defaultValues?: any;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const revenueRef = collection(firestore, "revenue");
  const { updateRevenueId } = useRevenueSlice();
  const queryClient = useQueryClient();
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
    form.setFieldsValue({
      expense: defaultValues?.expense,
    });
    setValue("expense", defaultValues?.expense);
  }, [defaultValues]);

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-edit-employee-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data: RevenueType) => {
          setLoading(true);
          const payload: RevenueType = {
            ...data,
          };
          updateRevenueId(payload?.id, payload);
          const docRef = doc(revenueRef, defaultValues?.id);
          await updateDoc(docRef, {
            expense: `${data?.expense}` || "",
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
        <FormItem control={control} name="expense" label="Expense">
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Expense"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        </FormItem>
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
