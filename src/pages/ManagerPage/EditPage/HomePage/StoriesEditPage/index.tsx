import React, { useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  Tabs,
  TabsProps,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { isEmpty } from "lodash";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useQueryClient } from "react-query";
import { collection, doc, updateDoc } from "firebase/firestore";
import { FormItem } from "../../../../../components/Form";
import { firestore } from "../../../../../lib/firebase";
import { HomePageModal } from "../../../../../models";
import PreWeddingEditPage from "./PreWeddingEditPage/index";
import WeddingEditPage from "./WeddingEditPage/index";

const schema = yup
  .object({
    title: yup.string().required("Vui lòng nhập tiêu đề giới thiệu!"),
    // subTitle: yup.string().required("Vui lòng nhập tiêu đề phụ!"),
    content: yup.string().required("Vui lòng nhập nội dung"),
    // subContent: yup.string().required("Vui lòng nhập nội dung châm ngôn"),
    // userName: yup
    //   .string()
    //   .required("Vui lòng nhập tên người viết nội dung châm ngôn"),
    // userRole: yup.string().required("Vui lòng nhập tiêu đề công việc"),
  })
  .required();

export default function StoriesEditPage({
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
  //   const mutation = useFirestoreCollectionMutation(homePageRef);
  const queryClient = useQueryClient();

  const defaultValues = {
    title: data?.stories?.title || "",
    content: data?.stories?.content || "",
  };

  useEffect(() => {
    form.setFieldsValue({
      title: data?.stories?.title || "",
      content: data?.stories?.content || "",
      // subTitle: data?.introduceStudio?.subTitle || "",
      // content: data?.introduceStudio?.content || "",
      // subContent: data?.introduceStudio?.subContent || "",
      // userName: data?.introduceStudio?.userName || "",
      // userRole: data.introduceStudio?.userRole || "",
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

  // const items: TabsProps["items"] = [
  //   {
  //     key: "1",
  //     label: "PRE WEDDING",
  //     children: (
  //       <PreWeddingEditPage
  //         data={data}
  //         refetch={refetch}
  //         handleCancel={handleCancel}
  //       />
  //     ),
  //   },
  //   {
  //     key: "2",
  //     label: "PHÓNG SỰ CƯỚI",
  //     children: (
  //       <WeddingEditPage
  //         data={data}
  //         refetch={refetch}
  //         handleCancel={handleCancel}
  //       />
  //     ),
  //   },
  // ];

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
            stories: {
              ...values,
              preWedding: data?.stories?.preWedding || [],
              wedding: data?.stories?.wedding || [],
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
          name="content"
          label="Nội dung"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập nội dung"
          />
        </FormItem>

        <div className="pt-5">
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
        </div>
      </FormAntDeisgn>
      {/* <Tabs defaultActiveKey="1" centered items={items} /> */}
    </>
  );
}
