import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form as FormAntDeisgn,
  Modal,
  UploadFile,
  message,
} from "antd";
import { FormInstance } from "antd/es/form/Form";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { UploadProps } from "antd";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, doc, updateDoc } from "firebase/firestore";
import { firestore, storage } from "../../../../../../lib/firebase";
import { FormItem } from "../../../../../../components/Form";
import Dragger from "antd/es/upload/Dragger";
import { InboxOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { HomePageModal, ServiceModal } from "../../../../../../models";
import { useQueryClient } from "react-query";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import WeddingEditForm from "./WeddingEditForm";

const defaultValues = {
  wedding: [],
};

const schema = yup
  .object({
    wedding: yup.mixed(),
    // .required("Vui lòng upload file hình ảnh")
    // .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
    //   if (value?.length === 0) return false;

    //   return true;
    // }),
  })
  .required();

interface DraggableUploadListItemProps {
  originNode: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  file: UploadFile<any>;
}

export default function PreWeddingEditPage({
  data,
  refetch,
  handleCancel,
}: any) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const homePageRef = collection(firestore, "homePage");
  // const mutation = useFirestoreCollectionMutation(homePageRef);
  const queryClient = useQueryClient();
  const [itemFile, setItemFile] = useState<any>({});

  const [isOpen, setIsOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<any>({
    defaultValues: { wedding: data?.stories?.wedding || [] },
    resolver: yupResolver(schema),
  });
  const uuId = uuidv4();

  const isEditWedding = data?.stories?.wedding?.length > 0;

  useEffect(() => {
    form.setFieldsValue({
      wedding: data?.stories?.wedding || [],
    });
    setFileList(data?.stories?.wedding || []);
  }, [data, form]);

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
      setValue("wedding", [
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
      setValue("wedding", matchingUrls);
    }
  };
  const props: UploadProps = {
    name: "file",
    multiple: true,
    listType: "picture",
    // beforeUpload,
    customRequest,
    onChange: handleChange,
    fileList,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleShowModalForm = (item: any) => () => {
    setIsOpen(true);
    setItemFile(item);
  };

  const handleCloseModalForm = () => {
    setIsOpen(false);
  };

  const DraggableUploadListItem = ({
    originNode,
    file,
  }: DraggableUploadListItemProps) => {
    return (
      <div className="py-4">
        {originNode}
        {isEditWedding && (
          <Button className="!mt-2" onClick={handleShowModalForm(file)}>
            Chỉnh sửa
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-wedding-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (values) => {
          const newWedding = fileList?.map((item: any) => {
            if (isEmpty(item?.title)) {
              return {
                ...item,
                title: "",
                description: "",
                gallery: [],
              };
            }
            return item;
          });
          //   console.log("newPreWedding", newPreWedding);
          const payload: HomePageModal = {
            ...data,
            stories: {
              title: data?.stories?.title || "",
              content: data?.stories?.content || "",
              preWedding: data?.stories?.preWedding || [],
              wedding: newWedding || [],
            },
          };
          // console.log("payload", payload);
          const docRef = doc(homePageRef, payload.id);
          await updateDoc(docRef, payload);
          queryClient.invalidateQueries("homePage");
          handleCancel?.();
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Chỉnh sửa wedding thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <FormItem
          control={control}
          name="Wedding"
          // valuePropName='fileList'
          label="Upload hình ảnh wedding"
        >
          <Dragger
            {...props}
            itemRender={(originNode, file) => {
              return (
                <DraggableUploadListItem originNode={originNode} file={file} />
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
              Hỗ trợ tải lên một lần hoặc hàng loạt. Nghiêm cấm tải lên dữ liệu
              công ty hoặc các thông tin khác
            </p>
            {!isEditWedding && fileList?.length > 0 && (
              <p className="text-red-600">
                Cập nhật wedding để chỉnh sửa chi tiết của từng hình ảnh
              </p>
            )}
          </Dragger>
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
      <Modal
        centered
        bodyStyle={{ overflowY: "scroll", height: "calc(100vh - 250px)" }}
        footer={null}
        open={isOpen}
        onCancel={handleCloseModalForm}
        title="Cập nhật thông tin wedding"
      >
        <WeddingEditForm
          refetch={refetch}
          data={data}
          file={itemFile}
          handleCancel={handleCloseModalForm}
        />
      </Modal>
    </>
  );
}
