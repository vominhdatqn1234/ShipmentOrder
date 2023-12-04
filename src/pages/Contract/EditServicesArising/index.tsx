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
import { ContractType, ServicesArising } from "../../../models/ContractModel";

const schema = yup
  .object({
    serviceName: yup.string().required("Vui lòng nhập tên danh mục phát sinh"),
    servicePrice: yup.string().required("Vui lòng nhập giá của danh mục phát sinh"),
  })
  .required();

export default function EditServicesArising({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: ServicesArising;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const servicesArisingRef = collection(firestore, "servicesArising");
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
      serviceName: defaultValues.serviceName,
      servicePrice: defaultValues.servicePrice,
      serviceType: defaultValues.serviceType,
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
        //   setLoading(true);
          const payload: ContractType = {
            ...data,
            contractType: generateSlugUrl(data?.contractName),
          };
          console.log("payload", payload);
        //   const docRef = doc(servicesArisingRef, defaultValues.id);
        //   await updateDoc(docRef, payload);
        //   queryClient.invalidateQueries("servicesArising");
        //   setTimeout(async () => await refetch(), 300);
        //   messageApi.open({
        //     type: "success",
        //     content: "Cập nhập danh mục phát sinh thành công!",
        //     duration: 5,
        //   });
        //   setLoading(false);
        //   handleCancel?.();
        //   form.resetFields();
        //   formRef.current?.resetFields();
        //   reset();
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem
            control={control}
            name="serviceName"
            label="Tên danh mục phát sinh"
          >
            <Input allowClear placeholder="Nhập tên danh mục phát sinh" />
          </FormItem>
          <FormItem
            control={control}
            name="servicePrice"
            label="Giá của danh mục phát sinh"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá danh mục phát sinh"
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
