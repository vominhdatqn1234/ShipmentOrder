import React, { useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Form as FormAntDeisgn, Input, message } from "antd";
import type { FormInstance } from "antd/es/form";
import { isEmpty } from "lodash";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useQueryClient } from "react-query";
import { collection, doc, updateDoc } from "firebase/firestore";
import { FormItem } from "../../../../components/Form";
import { firestore } from "../../../../lib/firebase";
import { HomePageModal } from "../../../../models";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";

const schema = yup
  .object({
    title: yup.string().required("Vui lòng nhập tiêu đề giới thiệu!"),
    subTitle: yup.string().required("Vui lòng nhập tiêu đề phụ!"),
    content: yup.string().required("Vui lòng nhập nội dung"),
    subContent: yup.string().required("Vui lòng nhập nội dung châm ngôn"),
    userName: yup
      .string()
      .required("Vui lòng nhập tên người viết nội dung châm ngôn"),
    userRole: yup.string().required("Vui lòng nhập tiêu đề công việc"),
  })
  .required();

export default function IntroduceStudioEditPage({
  data,
  handleCancel,
  refetch,
}: {
  data: any;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const homePageRef = collection(firestore, "homePage");
  // const mutation = useFirestoreCollectionMutation(homePageRef);
  const queryClient = useQueryClient();

  const defaultValues = {
    title: data?.introduceStudio?.title || "",
    subTitle: data?.introduceStudio?.subTitle || "",
    content: data?.introduceStudio?.content || "",
    subContent: data?.introduceStudio?.subContent || "",
    userName: data?.introduceStudio?.userName || "",
    userRole: data.introduceStudio?.userRole || "",
  };

  useEffect(() => {
    form.setFieldsValue({
      title: data?.introduceStudio?.title || "",
      subTitle: data?.introduceStudio?.subTitle || "",
      content: data?.introduceStudio?.content || "",
      subContent: data?.introduceStudio?.subContent || "",
      userName: data?.introduceStudio?.userName || "",
      userRole: data.introduceStudio?.userRole || "",
    });
  }, [data, form]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    defaultValues: defaultValues,
    resolver: yupResolver(schema),
  });

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-contect-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (values: HomePageModal) => {
          const payload = {
            ...data,
            introduceStudio: {
              ...values,
            },
          };
          const docRef = doc(homePageRef, data.id);
          await updateDoc(docRef, payload);
          queryClient.invalidateQueries("homePage");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
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
        <FormItem
          hasFeedback={false}
          control={control}
          name="title"
          label="Tiêu đề"
        >
          <Input.TextArea allowClear placeholder="Nhập tiêu đề giới thiệu" />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="subTitle"
          label="Tiêu đề phụ"
        >
          <Input.TextArea allowClear placeholder="Nhập tiêu đề phụ" />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="content"
          label="Nội dung"
        >
          <Input.TextArea allowClear placeholder="Nhập nội dung" />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="subContent"
          label="Nội dung châm ngôn"
        >
          <Input.TextArea allowClear placeholder="Nhập nội dung châm ngôn" />
        </FormItem>
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6">
          <FormItem
            hasFeedback={false}
            control={control}
            name="userName"
            label="Tên người viết"
          >
            <Input.TextArea
              allowClear
              placeholder="Nhập tên người viết nội dung châm ngôn"
            />
          </FormItem>
          <FormItem
            hasFeedback={false}
            control={control}
            name="userRole"
            label="Tiêu đề công việc"
          >
            <Input.TextArea allowClear placeholder="Nhập tiêu đề công việc" />
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
          Cập nhật
        </Button>
      </FormAntDeisgn>
    </>
  );
}
