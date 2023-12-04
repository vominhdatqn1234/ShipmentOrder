import { yupResolver } from "@hookform/resolvers/yup";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import { Button, Form as FormAntDeisgn, Input, InputNumber, message } from "antd";
import type { FormInstance } from "antd/es/form";
import { collection } from "firebase/firestore";
import { isEmpty } from "lodash";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore } from "../../../lib/firebase";
import { generateSlugUrl } from "../../../utils";
import { useContractType } from "../ContractTypeList/useContractType";
import { ContractType, ServicesArising } from "../../../models/ContractModel";


const defaultValues = {
  serviceName: "",
  servicePrice: "",
};

const schema = yup
  .object({
    serviceName: yup.string().required("Vui lòng nhập tên danh mục phát sinh"),
    servicePrice: yup.string().required("Vui lòng nhập giá danh mục phát sinh"),
  })
  .required();

export default function CreateServicesArisingForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const weddingDressRef = collection(firestore, "servicesArising");
  const mutation = useFirestoreCollectionMutation(weddingDressRef);
  const { refetch } = useContractType();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-wedding-dress-type-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data) => {
          setLoading(true);
          const payload: ServicesArising = {
            ...data,
            serviceType: generateSlugUrl(data?.serviceName || ''),
          };
          mutation.mutate(payload);
          queryClient.invalidateQueries("servicesArising");
          setTimeout(async () => await refetch(), 300);
          messageApi.open({
            type: "success",
            content: "Tạo tên danh mục phát sinh thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <div className="grid grid-cols-1 gap-6">
          <FormItem
            control={control}
            name="serviceName"
            label="Tên danh mục phát sinh"
          >
            <Input allowClear placeholder="Nhập tên danh mục phát sinh" />
          </FormItem>
          <FormItem control={control} name="servicePrice" label="Giá của danh mục phát sinh">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá của danh mục phát sinh"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
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
          Gửi
        </Button>
      </FormAntDeisgn>
    </>
  );
}
