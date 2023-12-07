import { yupResolver } from "@hookform/resolvers/yup";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import {
  Badge,
  Button,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Select,
  SelectProps,
  message,
} from "antd";
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
  name: "",
};

const statusList = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const schema = yup
  .object({
    name: yup.string().required("Vui lòng nhập tên loại sản phẩm"),
    size: yup.string().required("Vui lòng nhập size"),
  })
  .required();

export default function CreateContractTypeForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const weddingDressRef = collection(firestore, "productType");
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
          };
          mutation.mutate(payload);
          queryClient.invalidateQueries("productType");
          setTimeout(async () => await refetch(), 300);
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
        <div className="grid grid-cols-5 gap-6">
          <FormItem control={control} name="name" label="Tên loại sản phẩm">
            <Input allowClear placeholder="Nhập tên loại sản phẩm" />
          </FormItem>
          <FormItem control={control} name="size" label="Size">
            <Select showSearch>
              {statusList.map((sts, index) => {
                return (
                  <Select.Option key={index} value={sts}>
                    {sts}
                  </Select.Option>
                );
              })}
            </Select>
          </FormItem>
          <FormItem control={control} name="priceOneSide" label="Giá 1 mặt">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá của 1 mặt"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem control={control} name="priceTwoSides" label="Giá 2 mặt">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá của 2 mặt"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem control={control} name="shipPrice" label="Giá ship">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá ship"
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
          Tạo
        </Button>
      </FormAntDeisgn>
    </>
  );
}
