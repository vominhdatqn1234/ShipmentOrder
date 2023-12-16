import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Select,
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
import { EmployeeModel, WeddingDressModel } from "../../../models";
import { WeddingDressTypeModel } from "../../../models/WeddingDressModel";
import { generateSlugUrl } from "../../../utils";
import { ContractType } from "../../../models/ContractModel";
import { ProductType } from "../../../models/ProductTypeModel";
import { produce } from "immer";
import { useProductTypeSlice } from "../../../store/useProductType";
import { useEmployeeSlice } from "../../../store/useEmployeeSlice";

const schema = yup
  .object({
    // contractName: yup.string().required("Vui lòng nhập tên tên loại hợp đồng"),
    // contractPrice: yup.string().required("Vui lòng nhập giá của loại hợp đồng"),
  })
  .required();

const statusList = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

export default function EditContractType({
  parentEmployee,
  defaultValues,
  handleCancel,
  refetch,
}: {
  parentEmployee?: any;
  defaultValues: ProductType;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const contractRef = collection(firestore, "employee");
  const queryClient = useQueryClient();
  const { updateEmployeeId } = useEmployeeSlice();

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
      name: defaultValues.name,
      priceOneSide: defaultValues.priceOneSide,
      priceTwoSides: defaultValues.priceTwoSides,
      shipPrice: defaultValues.shipPrice,
      size: defaultValues.size,
    });
    setValue('id', defaultValues?.id)
    setValue('name', defaultValues?.name)
    setValue('priceOneSide', defaultValues?.priceOneSide)
    setValue('priceTwoSides', defaultValues?.priceTwoSides)
    setValue('shipPrice', defaultValues?.shipPrice)
    setValue('size', defaultValues?.size)
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
        onFinish={handleSubmit(async (data: ProductType) => {
          setLoading(true);
          const payload: ProductType = {
            ...data,
          };

          const updatedEmployeeArray = produce(
            parentEmployee?.productTypes,
            (productType: any) => {
              const indexToUpdate = productType?.findIndex(
                (item: ProductType) => item.id === payload.id
              );
              if (indexToUpdate !== -1) {
                productType[indexToUpdate] = payload;
              }
            }
          );

          updateEmployeeId(parentEmployee?.id, updatedEmployeeArray);

          const docRef = doc(contractRef, parentEmployee?.id);
          await updateDoc(docRef, {
            ...parentEmployee,
            productTypes: updatedEmployeeArray,
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
        <div className="grid grid-cols-2 gap-6">
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
          Gửi
        </Button>
      </FormAntDeisgn>
    </>
  );
}
