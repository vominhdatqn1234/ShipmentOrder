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
import { ContractType } from "../../../models/ContractModel";


const defaultValues = {
  contractName: "",
  contractPrice: "",
};

const schema = yup
  .object({
    contractName: yup.string().required("Vui lòng nhập tên loại hợp đồng"),
    contractPrice: yup.string().required("Vui lòng nhập giá của loại hợp đồng"),
  })
  .required();

export default function CreateContractTypeForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const weddingDressRef = collection(firestore, "contractType");
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
          const payload: ContractType = {
            ...data,
            contractType: generateSlugUrl(data?.contractName || ''),
          };
          mutation.mutate(payload);
          queryClient.invalidateQueries("contractType");
          setTimeout(async () => await refetch(), 300);
          messageApi.open({
            type: "success",
            content: "Tạo tên loại hợp đồng thành công!",
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
            name="contractName"
            label="Tên loại hợp đồng"
          >
            <Input allowClear placeholder="Nhập tên loại hợp đồng" />
          </FormItem>
          <FormItem control={control} name="contractPrice" label="Giá của loại hợp đồng">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá của loại hợp đồng"
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
