import React, { useRef, useState } from "react";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  message,
  Select,
  Upload,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { FormItem } from "../../../components/Form";
import { RcFile } from "antd/es/upload";
import { firestore, storage } from "../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection } from "firebase/firestore";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "react-query";
import { useTeam } from "../TeamManagementList/useTeam";

const { Dragger } = Upload;

const defaultValues = {
  name: "",
  title: "",
  avatar: [
    {
      id: uuidv4(),
      name: "profile.png",
      url: "https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b",
    },
  ],
};

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

export default function CreateTeamManagementForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const teamRef = collection(firestore, "team");
  const mutation = useFirestoreCollectionMutation(teamRef);
  const [fileList, setFileList] = useState<any[]>([]);
  const uuId = uuidv4();
  const { refetch } = useTeam();
  const queryClient = useQueryClient();

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
        ...prev,
        {
          id: uuId,
          url: info.file.url,
          name: info.file.name,
        },
      ]);
      setValue("avatar", [
        ...fileList,
        {
          id: uuId,
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
    multiple: true,
    listType: "picture-card",
    fileList,
    // beforeUpload,
    customRequest,
    onChange: handleChange,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-contect-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data) => {
          mutation.mutate(data);
          setLoading(true);
          queryClient.invalidateQueries("contract");
          setTimeout(async () => await refetch(), 300);
          messageApi.open({
            type: "success",
            content: "Tạo thành viên thành công!",
            duration: 5,
          });
          setFileList([]);
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6">
          <FormItem control={control} name="name" label="Tên thành viên">
            <Input allowClear placeholder="Nhập tên váy cưới" />
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
          Gửi
        </Button>
      </FormAntDeisgn>
    </>
  );
}
