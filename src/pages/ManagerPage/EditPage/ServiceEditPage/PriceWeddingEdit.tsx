import React, { useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  Modal,
  UploadFile,
  UploadProps,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { isEmpty, map } from "lodash";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useQueryClient } from "react-query";
import { collection, doc, updateDoc } from "firebase/firestore";
import { FormItem } from "../../../../components/Form";
import { firestore, storage } from "../../../../lib/firebase";
import { InboxOutlined } from "@ant-design/icons";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import Dragger from "antd/es/upload/Dragger";
import { v4 as uuidv4 } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { ContactPageModel } from "../../../../models/ContactPageModel";
import WeddingAblumEditForm from "./WeddingAblumEditForm";

const schema = yup
  .object({
    title: yup
      .string()
      .required("Vui lòng nhập tiêu đề giới thiệu album cưới!"),
    subTitle: yup
      .string()
      .required("Vui lòng nhập tiêu đề thứ 2 giới thiệu album cưới!"),
    // background: yup
    //   .mixed()
    //   .required("Vui lòng upload file hình ảnh nền ablum cưới")
    //   .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
    //     if (value?.length === 0) return false;

    //     return true;
    //   }),
    // gallery: yup
    //   .mixed()
    //   .required("Vui lòng upload file danh sách hình ảnh ablum cưới")
    //   .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
    //     if (value?.length === 0) return false;

    //     return true;
    //   }),
  })
  .required();

interface DraggableUploadListItemProps {
  originNode: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  file: UploadFile<any>;
}

export default function PriceWeddingEdit({
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
  const contactPageRef = collection(firestore, "servicePage");
  const [fileListUrl, setFileListUrl] = useState<any[]>([]);
  // const [fileList, setFileList] = useState<any[]>([]);
  const [itemFile, setItemFile] = useState<any>({});
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useFirestoreCollectionMutation(contactPageRef);
  const queryClient = useQueryClient();

  const defaultValues = {
    title: data?.priceWedding?.title || "",
    subTitle: data?.priceWedding?.subTitle || "",
  };

  useEffect(() => {
    form.setFieldsValue({
      title: data?.priceWedding?.title || "",
      subTitle: data?.priceWedding?.subTitle || "",
      background: data?.priceWedding?.background || [],
      listComboPrice: data?.priceWedding?.listComboPrice || [],
    });
    setFileListUrl(data?.priceWedding?.background || []);
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

  const handleShowModalForm = (item: any) => () => {
    setIsOpen(true);
    setItemFile(item);
  };

  const handleCloseModalForm = () => {
    setIsOpen(false);
  };

  const handleUploadUrl = async (info: any) => {
    if (info.file.status === "done") {
      setFileListUrl([
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

  const customRequestUrl = async ({ file, onSuccess, onError }: any) => {
    try {
      // const storageRef = ref(storage, `/manager-page/${file.name}`);

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
      //       handleUploadUrl({
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
                  handleUploadUrl({
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
  const handleChangeUrl: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => {
    if (newFileList.length > 0) {
      const matchingUrls = newFileList?.reduce((result: any, image: any) => {
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileListUrl(matchingUrls);
      setValue("background", matchingUrls);
    }
  };

  const urlProps: UploadProps = {
    name: "file",
    multiple: false,
    listType: "picture-card",
    // beforeUpload,
    customRequest: customRequestUrl,
    onChange: handleChangeUrl,
    fileList: fileListUrl,
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
          // const newAlbumPhoto = map(data?.priceWedding?.gallery, (item) => {
          //     if (item.id === file.id) {
          //       return assign({}, item, {
          //         name: fileListUrl?.[0]?.name || fileListUrl?.[0]?.url,
          //         alt: fileListUrl?.[0]?.alt || "",
          //         url: fileListUrl?.[0]?.url || "",
          //         title: values.title,
          //         description: values.description,
          //         gallery: fileList,
          //       });
          //     }
          //     return item;
          //   });
          const payload = {
            ...data,
            priceWedding: {
              ...values,
              background: fileListUrl,
            },
          };
          console.log("payload", payload);
          // mutation.mutate(payload);
          const docRef = doc(contactPageRef, data.id);
          await updateDoc(docRef, payload);

          queryClient.invalidateQueries("servicePage");
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
            placeholder="Nhập tiêu đề giới thiệu album cưới"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="subTitle"
          label="Tiêu đề phụ"
        >
          <Input.TextArea
            allowClear
            placeholder="Nhập tiêu đề phụ giới thiệu album cưới"
          />
        </FormItem>
        <FormItem
          control={control}
          name="background"
          // valuePropName='fileList'
          label="Upload hình nền bảng giá"
        >
          <Dragger {...urlProps}>
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
        <div className="pt-10">
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
      <Modal
        centered
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
        footer={null}
        open={isOpen}
        onCancel={handleCloseModalForm}
        title="Chỉnh sửa thông tin dịch vụ"
      >
        <WeddingAblumEditForm
          refetch={refetch}
          data={data}
          file={itemFile}
          handleCancel={handleCloseModalForm}
        />
      </Modal>
    </>
  );
}
