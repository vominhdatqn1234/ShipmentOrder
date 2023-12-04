import React, { useEffect, useRef, useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import type { UploadProps } from "antd";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  Select,
  Upload,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { collection, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { isEmpty } from "lodash";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";
import { FormItem } from "../../../components/Form";
import { firestore, storage } from "../../../lib/firebase";
import { TeamModel } from "../../../models";
const { Dragger } = Upload;

const schema = yup
  .object({
    name: yup.string().required("Vui lòng nhập tên"),
    title: yup.string().required("Vui lòng nhập chọn chức vụ"),
    avatar: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
  })
  .required();

export default function EditTeamManagementForm({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: TeamModel;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const teamRef = collection(firestore, "team");
  const queryClient = useQueryClient();
  const [fileList, setFileList] = useState<any[]>(defaultValues.avatar);
  const uuId = uuidv4();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const handleUpload = async (info: any) => {
    if (info.file.status === "done") {
      setFileList((prev) => [
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
        },
      ]);
      setValue("avatar", [
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
        },
      ]);
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      // const storageRef = ref(storage, `/files/${file.name}`);

      // const uploadTask = uploadBytesResumable(storageRef, file);

      // uploadTask.on(
      //   "state_changed",
      //   (snapshot) => {
      //     const percent = Math.round(
      //       (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      //     );

      //     // update progress
      //     // setPercent(percent);
      //   },
      //   (err) => console.log(err),
      //   () => {
      //     // download url
      //     getDownloadURL(uploadTask.snapshot.ref).then((url) => {
      //       onSuccess();
      //       handleUpload({
      //         file: {
      //           status: "done",
      //           name: file.name,
      //           url,
      //         },
      //       });
      //     });
      //   }
      // );
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        const originalImage = new Image() as any;
        originalImage.src = e.target.result;

        originalImage.onload = () => {
          // Define your desired dimensions
          const maxWidth = 800;
          const maxHeight = 800;

          // Calculate the new dimensions while preserving the aspect ratio
          const aspectRatio = originalImage.width / originalImage.height;
          let newWidth, newHeight;
          if (
            originalImage.width > maxWidth ||
            originalImage.height > maxHeight
          ) {
            if (aspectRatio > 1) {
              newWidth = maxWidth;
              newHeight = maxWidth / aspectRatio;
            } else {
              newWidth = maxHeight * aspectRatio;
              newHeight = maxHeight;
            }
          } else {
            newWidth = originalImage.width;
            newHeight = originalImage.height;
          }

          // Create a canvas element to draw the resized image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d") as any;
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw the resized image on the canvas
          ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

          // Convert the canvas to a Blob (image file)
          canvas.toBlob((blob: any) => {
            // Create a new File object from the Blob
            const resizedFile = new File([blob], file.name, {
              type: file.type,
            });
            const storageRef = ref(
              storage,
              `/manager-page/${resizedFile.name}`
            );
            const uploadTask = uploadBytesResumable(storageRef, resizedFile);

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
                      name: resizedFile.name,
                      url,
                    },
                  });
                });
              }
            );
          }, file.type);
        };
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      onError();
    }
  };
  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    if (fileList.length > 0) {
      const matchingUrls = fileList?.reduce((result: any, image: any) => {
        if (newFileList.some((file) => image?.name?.includes(file.name))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileList(matchingUrls);
      setValue("avatar", matchingUrls);
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

  useEffect(() => {
    form.setFieldsValue({
      id: defaultValues.id,
      name: defaultValues.name,
      title: defaultValues.title,
      avatar: defaultValues.avatar,
    });
    setFileList(defaultValues.avatar);
  }, [defaultValues, form]);

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-contect-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data: TeamModel) => {
          const docRef = doc(teamRef, defaultValues.id);
          await updateDoc(docRef, data);
          queryClient.invalidateQueries("team");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Cập nhập thành viên thành công!",
            duration: 5,
          });
          setLoading(false);
          handleCancel?.();
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6">
          <FormItem control={control} name="name" label="Tên thành viên">
            <Input placeholder="Nhập tên váy cưới" />
          </FormItem>
          <FormItem control={control} name="title" label="Chức vụ">
            <Select>
              <Select.Option value="CEO">CEO</Select.Option>
              <Select.Option value="Founder">Founder</Select.Option>
              <Select.Option value="Co-founder">Co-founder</Select.Option>
              <Select.Option value="CTO">CTO</Select.Option>
              <Select.Option value="Make Up">Make Up</Select.Option>
              <Select.Option value="Photography">Photography</Select.Option>
            </Select>
          </FormItem>
        </div>
        <div className="py-6">
          <FormItem
            control={control}
            name="avatar"
            // valuePropName='fileList'
            label="Upload hình ảnh"
          >
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Nhấp hoặc kéo tệp vào khu vực này để tải lên
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ tải lên một lần hoặc hàng loạt. Nghiêm cấm tải lên dữ
                liệu công ty hoặc các thông tin khác
              </p>
            </Dragger>
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
