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
  Modal,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { UploadFile, UploadProps } from "antd";
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
import { collection, updateDoc } from "firebase/firestore";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { isVietnamesePhoneNumber, regexPassword } from "../../../utils";
import PriceWeddingEdit from "./PriceWeddingEdit";
import { useQueryClient } from "react-query";
import { usePriceWedding } from "../usePriceWedding";

const { Dragger } = Upload;

const defaultValues = {
  title: "",
  gallery: [],
};

const schema = yup
  .object({
    title: yup.string().required("Vui lòng nhập tiêu đề của bảng giá"),
    gallery: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh bảng giá")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
  })
  .required();

interface DraggableUploadListItemProps {
  originNode: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  file: UploadFile<any>;
}

export default function PriceWeddingForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const priceWeddingRef = collection(firestore, "priceWedding");
  const mutation = useFirestoreCollectionMutation(priceWeddingRef);
  const [fileList, setFileList] = useState<any[]>([]);
  const [itemFile, setItemFile] = useState<any>({});
  const { refetch } = usePriceWedding();

  const [isOpen, setIsOpen] = useState(false);
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

  const handleShowModalForm = (item: any) => () => {
    setIsOpen(true);
    setItemFile(item);
  };

  const handleCloseModalForm = () => {
    setIsOpen(false);
  };

  const handleUpload = async (info: any) => {
    if (info.file.status === "done") {
      setFileList((prev) => [
        ...prev,
        {
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
          alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
        },
      ]);
      setValue("gallery", [
        ...fileList,
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
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileList(matchingUrls);
      setValue("gallery", matchingUrls);
    }
  };

  const handleUpdateItem = (value: any[]) => {
    setFileList(value);
  };

  const props: UploadProps = {
    name: "file",
    multiple: true,
    listType: "picture-card",
    // beforeUpload,
    fileList,
    customRequest,
    onChange: handleChange,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const DraggableUploadListItem = ({
    originNode,
    file,
  }: DraggableUploadListItemProps) => {
    return (
      <div className="mt-2">
        {originNode}
        <Button onClick={handleShowModalForm(file)}>Chỉnh sửa</Button>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-price-wedding-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data) => {
          const payload = {
            title: data?.title || "",
            gallery: fileList || [],
          };
          mutation.mutate(payload);
          queryClient.invalidateQueries("priceWedding");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Tạo thành viên thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          setFileList([]);
          formRef.current?.resetFields();
          reset();
        })}
      >
        <FormItem control={control} name="title" label="Tiêu đề bảng giá">
          <Input allowClear placeholder="Nhập tiêu đề bảng giá" />
        </FormItem>
        <div className="py-6">
          <FormItem
            control={control}
            name="avatar"
            // valuePropName='fileList'
            label="Upload hình ảnh bảng giá"
          >
            <Dragger
              {...props}
              itemRender={(originNode, file) => {
                return (
                  <DraggableUploadListItem
                    originNode={originNode}
                    file={file}
                  />
                );
              }}
            >
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
      <Modal
        centered
        footer={null}
        open={isOpen}
        onCancel={handleCloseModalForm}
        title="Chỉnh sửa thông tin bảng giá"
      >
        <PriceWeddingEdit
          data={fileList}
          file={itemFile}
          handleCancel={handleCloseModalForm}
          handleUpdateItem={handleUpdateItem}
        />
      </Modal>
    </>
  );
}
