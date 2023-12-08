import React, { useRef, useState } from "react";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  message,
  Select,
  Upload,
  InputNumber,
  Switch,
  Space,
  Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { UploadProps } from "antd";
import {
  InboxOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { isEmpty } from "lodash";
import { FormItem } from "../../../components/Form";
import { RcFile } from "antd/es/upload";
import { firestore, storage } from "../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { isVietnamesePhoneNumber, regexPassword } from "../../../utils";
import { useEmployee } from "../EmployeeList/useEmployee";
import { useQueryClient } from "react-query";

const { Dragger } = Upload;

const defaultValues = {
  name: "",
  phone: "",
  email: "",
  password: "",
  address: "",
  permission: "",
  avatar:
    "https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b",
};

const schema = yup
  .object({
    name: yup.string().required("Vui lòng nhập tên"),
    permission: yup.string().required("Vui chọn quyền"),
    phone: yup
      .string()
      .required("Vui lòng nhập số điện thoại của bạn!")
      .test("phone", "Số điên thoại sai định dạng", (str, context) => {
        return isVietnamesePhoneNumber(str);
      }),
    email: yup
      .string()
      .email("Sai định dang email. Ví dụ abc@gmail.com")
      .required("Vui lòng nhập email của bạn"),
    password: yup
      .string()
      .min(8, "Độ dài từ 8-50 kí tự")
      .max(50, "Độ dài từ 8-50 kí tự")
      .matches(
        regexPassword,
        "Chứa ít nhất một kí tự thường, một kí tự hoa, một kí tự đặc biệt và một số"
      )
      .required("Vui lòng nhập mật khẩu"),
    address: yup.string().required("Vui lòng địa chỉ"),
    avatar: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
  })
  .required();

export default function CreateEmployeeForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const teamRef = collection(firestore, "employee");
  const mutation = useFirestoreCollectionMutation(teamRef);
  const { refetchTeam } = useEmployee();
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
      setValue("avatar", info.file.url);
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
            const storageRef = ref(storage, `/files/${resizedFile.name}`);
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
  const props: UploadProps = {
    name: "file",
    multiple: false,
    // beforeUpload,
    customRequest,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-form-create-employee-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data) => {
          setLoading(true);
          const accountQuery = query(
            teamRef,
            where("email", "==", data.email),
            limit(1)
          );
          const docSnap = await getDocs(accountQuery);
          if (!docSnap.empty) {
            messageApi.open({
              type: "error",
              content: `Email ${data?.email} này đã tồn tại trong hệ thống vui lòng nhập email khác!`,
              duration: 5,
            });
            setLoading(false);
            return;
          }
          const payload = { ...data, createAt: new Date().toISOString(), productTypes: [] };
          mutation.mutate(payload);
          queryClient.invalidateQueries("employee");
          setTimeout(async () => await refetchTeam(), 300);
          messageApi.open({
            type: "success",
            content: "Tạo thành viên thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <FormItem control={control} name="email" label="Email">
          <Input allowClear placeholder="Nhập email" />
        </FormItem>
        <FormItem control={control} name="password" label="Password">
          <Input.Password
            allowClear
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            placeholder="Nhập email"
          />
        </FormItem>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="name" label="Tên nhân viên">
            <Input allowClear placeholder="Nhập tên nhân viên" />
          </FormItem>
          <FormItem control={control} name="phone" label="Số điện thoại">
            <Input allowClear placeholder="Nhập số điện thoại" />
          </FormItem>
          <FormItem control={control} name="permission" label="Quyền">
            <Select>
              <Select.Option value="Admin">Admin</Select.Option>
              {/* <Select.Option value="Manager">Manager</Select.Option> */}
              <Select.Option value="Employee">Employee</Select.Option>
            </Select>
          </FormItem>
        </div>
        <FormItem control={control} name="address" label="Địa chỉ">
          <Input allowClear placeholder="Nhập địa chỉ" />
        </FormItem>
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
