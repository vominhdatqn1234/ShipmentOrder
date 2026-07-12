import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  InboxOutlined,
} from "@ant-design/icons";
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
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "lib/db";
import { getDownloadURL, ref, uploadBytesResumable } from "lib/supastorage";
import { isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore, storage } from "../../../lib/firebase";
import { EmployeeModel } from "../../../models";
import { isVietnamesePhoneNumber, regexPassword } from "../../../utils";
import { useEmployeeSlice } from "../../../store/useEmployeeSlice";
const { Dragger } = Upload;

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

export default function EditEmployee({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: EmployeeModel;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const employeeRef = collection(firestore, "employee");
  const { updateEmployee } = useEmployeeSlice();
  const queryClient = useQueryClient();
  const [fileList, setFileList] = useState<any[]>([
    {
      uid: uuidv4(),
      name: "xxx.png",
      status: "done",
      url: defaultValues.avatar,
    },
  ]);
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

  useEffect(() => {
    form.setFieldsValue({
      name: defaultValues?.name || "",
      permission: defaultValues?.permission || "",
      phone: defaultValues?.phone || "",
      email: defaultValues.email || "",
      password: defaultValues.password || "",
      address: defaultValues.address || "",
    });
    setFileList(
      [
        {
          uid: uuidv4(),
          name: "xxx.png",
          status: "done",
          url: defaultValues.avatar,
        },
      ] || []
    );
  }, [defaultValues, form]);

  // useEffect(() => {
  //   form.setFieldValue(defaultValues)
  // }, [defaultValues, form])

  const handleUpload = async (info: any) => {
    if (info.file.status === "done") {
      setFileList([
        {
          id: uuidv4(),
          status: "done",
          url: info.file.url,
          name: info.file.name,
        },
      ]);
      setValue("avatar", [
        {
          id: uuidv4(),
          status: "done",
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
  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    // setFileList(newFileList);
    // setValue(
    //   "avatar",
    //   "https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/profile.png?alt=media&token=317fa84c-f068-47d4-aa48-4943fad74b2b"
    // );
    if (fileList.length > 0) {
      const matchingUrls = fileList?.reduce((result: any, image: any) => {
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
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

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-edit-employee-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data: EmployeeModel) => {
          setLoading(true);
          if (data?.email !== defaultValues.email) {
            const accountQuery = query(
              employeeRef,
              where("email", "==", data?.email),
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
            const docRef = doc(employeeRef, defaultValues.id);
            const payload = {
              ...data,
              avatar: fileList?.[0]?.url,
            };
            await updateDoc(docRef, payload);
            setLoading(true);
            messageApi.open({
              type: "success",
              content: "Cập nhập nhân viên thành công!",
              duration: 5,
            });
            setLoading(false);
            handleCancel?.();
            form.resetFields();
            formRef.current?.resetFields();
            reset();
            setLoading(false);
            return;
          }
          const payload = {
            ...data,
            avatar: fileList?.[0]?.url,
          };
          const docRef = doc(employeeRef, defaultValues.id);
          await updateDoc(docRef, payload);
          updateEmployee(defaultValues.id, payload);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Cập nhập nhân viên thành công!",
            duration: 5,
          });
          setLoading(false);
          handleCancel?.();
          form.resetFields();
          formRef.current?.resetFields();
          reset();
          setLoading(false);
        })}
      >
        <FormItem control={control} name="email" label="Email">
          <Input placeholder="Nhập email" />
        </FormItem>
        <FormItem control={control} name="password" label="Password">
          <Input.Password
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            placeholder="Nhập email"
          />
        </FormItem>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="name" label="Tên nhân viên">
            <Input placeholder="Nhập tên nhân viên" />
          </FormItem>
          <FormItem control={control} name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
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
          <Input placeholder="Nhập địa chỉ" />
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
          Cập nhật
        </Button>
      </FormAntDeisgn>
    </>
  );
}
