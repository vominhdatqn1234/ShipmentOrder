import { yupResolver } from "@hookform/resolvers/yup";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import { Button, Form as FormAntDeisgn, Input, message } from "antd";
import type { FormInstance } from "antd/es/form";
import { collection } from "firebase/firestore";
import { isEmpty } from "lodash";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore } from "../../../lib/firebase";
import { WeddingDressModel } from "../../../models";
import { generateSlugUrl } from "../../../utils";
import { useWeddingDress } from "../WeddingDressList/useWeddingDress";

const defaultValues = {
  dressCodeName: "",
  dressCode: "",
};

const schema = yup
  .object({
    dressCodeName: yup.string().required("Vui lòng nhập tên loại váy cưới"),
  })
  .required();

export default function CreateWeddingDressTypeForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const weddingDressRef = collection(firestore, "weddingDressType");
  const mutation = useFirestoreCollectionMutation(weddingDressRef);
  const { refetch } = useWeddingDress();
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
          const payload: WeddingDressModel = {
            ...data,
            dressCode: generateSlugUrl(data?.dressCodeName),
          };
          mutation.mutate(payload);
          queryClient.invalidateQueries("weddingDressType");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Tạo tên loại váy cưới thành công!",
            duration: 5,
          });
          setLoading(false);
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
