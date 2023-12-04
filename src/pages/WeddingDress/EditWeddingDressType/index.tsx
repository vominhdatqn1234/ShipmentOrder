import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Form as FormAntDeisgn, Input, message } from "antd";
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

const schema = yup
  .object({
    dressCodeName: yup.string().required("Vui lòng nhập tên loại váy cưới"),
  })
  .required();

export default function EditWeddingDressType({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: WeddingDressTypeModel;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const contractRef = collection(firestore, "weddingDressType");
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
      dressCode: defaultValues.dressCode,
      dressCodeName: defaultValues.dressCodeName,
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
        onFinish={handleSubmit(async (data: WeddingDressTypeModel) => {
          const payload: WeddingDressTypeModel = {
            ...data,
            dressCode: generateSlugUrl(data?.dressCodeName),
          };
          const docRef = doc(contractRef, defaultValues.id);
          await updateDoc(docRef, payload);
          queryClient.invalidateQueries("weddingDressType");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Cập nhập tên loại váy cưới thành công!",
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
            name="dressCodeName"
            label="Tên loại váy cưới"
          >
            <Input allowClear placeholder="Nhập tên loại váy cưới" />
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
