import React, { useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  UploadProps,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { isEmpty } from "lodash";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useQueryClient } from "react-query";
import { collection, doc, updateDoc } from "firebase/firestore";
import { FormItem } from "../../../../components/Form";
import { firestore, storage } from "../../../../lib/firebase";
import { HomePageModal } from "../../../../models";
import { InboxOutlined } from "@ant-design/icons";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import Dragger from "antd/es/upload/Dragger";
import { v4 as uuidv4 } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { ContactPageModel } from "../../../../models/ContactPageModel";

const schema = yup
  .object({
    title: yup.string().required("Vui lòng nhập tiêu đề giới thiệu liên hệ!"),
    content: yup.string().required("Vui lòng nhập nội dung liên hệ"),
    background: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
    titleInfo: yup.string().required("Vui lòng tiêu đề thông tin iên hệ!"),
    contentInfo: yup.string().required("Vui lòng nội dung thông tin iên hệ!"),
    address: yup.string().required("Vui lòng địa chỉ liên hệ!"),
    phone: yup.string().required("Vui lòng số điện thoại liên hệ!"),
    email: yup.string().required("Vui lòng địa chỉ email liên hệ!"),
    workingHours: yup
      .string()
      .required("Vui lòng địa giờ làm việc của cửa hàng!"),
  })
  .required();

export default function ContactEditPage({
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
  const contactPageRef = collection(firestore, "contactPage");
  const [fileList, setFileList] = useState<any[]>([]);
  // const mutation = useFirestoreCollectionMutation(contactPageRef);
  const queryClient = useQueryClient();

  const defaultValues = {
    title: data?.title || "",
    content: data?.content || "",
    background: data?.background || [],
    titleInfo: data?.info?.title || "",
    contentInfo: data?.info?.content || "",
    address: data?.info?.address || "",
    phone: data?.info?.phone || "",
    email: data?.info?.email || "",
    workingHours: data?.info?.workingHours || "",
  };

  useEffect(() => {
    form.setFieldsValue({
      title: data?.title || "",
      content: data?.content || "",
      background: data?.background || [],
      titleInfo: data?.info?.title || "",
      contentInfo: data?.info?.content || "",
      address: data?.info?.address || "",
      phone: data?.info?.phone || "",
      email: data?.info?.email || "",
      workingHours: data?.info?.workingHours || "",
    });
    setFileList(data?.background || []);
  }, [data, form]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<any>({
    defaultValues: defaultValues,
    resolver: yupResolver(schema),
  });

  const handleUpload = async (info: any) => {
    if (info.file.status === "done") {
      setFileList([
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
          alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
        },
      ]);
      setValue("background", [
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
          alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
        },
      ]);
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      const storageRef = ref(storage, `/manager-page/${file.name}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );

          // update progress
          // setPercent(percent);
        },
        (err) => console.log(err),
        () => {
          // download url
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            onSuccess();
            handleUpload({
              file: {
                status: "done",
                name: file.name,
                url,
              },
            });
          });
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      onError();
    }
  };
  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    if (fileList.length > 0) {
      const matchingUrls = fileList?.reduce((result: any, image: any) => {
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileList(matchingUrls);
      setValue("background", matchingUrls);
    }
  };

  const props: UploadProps = {
    name: "file",
    multiple: false,
    listType: "picture-card",
    // beforeUpload,
    customRequest,
    onChange: handleChange,
    fileList,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-about-me-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (values: ContactPageModel) => {
          const payload = {
            // ...values,
            title: values?.title,
            content: values?.content,
            background: fileList,
            info: {
              title: (values as any)?.titleInfo,
              content: (values as any)?.contentInfo,
              address: (values as any)?.address,
              phone: (values as any)?.phone,
              email: (values as any)?.email,
              workingHours: (values as any)?.workingHours,
            },
          };
          // mutation.mutate(payload);
          const docRef = doc(contactPageRef, data.id);
          await updateDoc(docRef, payload);

          queryClient.invalidateQueries("contactPage");
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
          <Input.TextArea
            allowClear
            placeholder="Nhập tiêu đề giới thiệu liên hệ"
          />
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
            placeholder="Nhập nội dung liên hệ"
          />
        </FormItem>
        <FormItem
          control={control}
          name="background"
          // valuePropName='fileList'
          label="Upload hình nền liên hệ"
        >
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Nhấp hoặc kéo tệp vào khu vực này để tải lên
            </p>
            <p className="ant-upload-hint">
              Hỗ trợ tải lên một lần hoặc hàng loạt. Nghiêm cấm tải lên dữ liệu
              công ty hoặc các thông tin khác
            </p>
          </Dragger>
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="titleInfo"
          label="Tiêu đề thông tin"
        >
          <Input.TextArea
            allowClear
            placeholder="Nhập tiêu đề thông tin liên hệ"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="contentInfo"
          label="Nội dung thông tin"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập nội dung thông tin liên hệ"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="address"
          label="Địa chỉ"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập địa chỉ thông tin liên hệ"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="phone"
          label="Số điện thoại"
        >
          <Input
            allowClear
            placeholder="Nhập số điện thoại thông tin liên hệ"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="email"
          label="Email"
        >
          <Input allowClear placeholder="Nhập số email thông tin liên hệ" />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="workingHours"
          label="Giờ hoạt động"
        >
          <Input
            allowClear
            placeholder="Nhập giờ hoạt động thông tin liên hệ"
          />
        </FormItem>

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
