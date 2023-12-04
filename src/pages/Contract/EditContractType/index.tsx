import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { collection, doc, updateDoc } from "firebase/firestore";
import { isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore } from "../../../lib/firebase";
import { WeddingDressModel } from "../../../models";
import { WeddingDressTypeModel } from "../../../models/WeddingDressModel";
import { generateSlugUrl } from "../../../utils";
import { ContractType } from "../../../models/ContractModel";

const schema = yup
  .object({
    contractName: yup.string().required("Vui lòng nhập tên tên loại hợp đồng"),
    contractPrice: yup.string().required("Vui lòng nhập giá của loại hợp đồng"),
  })
  .required();

export default function EditContractType({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: ContractType;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const contractRef = collection(firestore, "contractType");
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<any>({
    mode: "onChange",
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    form.setFieldsValue({
      id: defaultValues?.id,
      contractName: defaultValues.contractName,
      contractPrice: defaultValues.contractPrice,
      contractType: defaultValues.contractType,
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
        onFinish={handleSubmit(async (data: ContractType) => {
          setLoading(true);
          const payload: ContractType = {
            ...data,
            contractType: generateSlugUrl(data?.contractName),
          };
          console.log("payload", payload);
          const docRef = doc(contractRef, defaultValues.id);
          await updateDoc(docRef, payload);
          queryClient.invalidateQueries("contractType");
          setTimeout(async () => await refetch(), 300);
          messageApi.open({
            type: "success",
            content: "Cập nhập loại hợp đồng thành công!",
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
            name="contractName"
            label="Tên loại hợp đồng"
          >
            <Input allowClear placeholder="Nhập tên loại hợp đồng" />
          </FormItem>
          <FormItem
            control={control}
            name="contractPrice"
            label="Giá của loại hợp đồng"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá hợp đồng"
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
