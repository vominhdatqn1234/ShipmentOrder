import React, { useEffect, useRef, useState } from "react";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  Upload,
  UploadProps,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import Dragger from "antd/es/upload/Dragger";
import { collection, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { assign, find, isEmpty, map } from "lodash";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";
import { FormItem } from "../../../../components/Form";
import { storage } from "../../../../lib/firebase";
// import { FormItem } from "../../../../../components/Form";
// import { firestore, storage } from "../../../../../lib/firebase";

const schema = yup
  .object({
    title: yup.string().required("Vui lòng nhập tiêu đề dịch vụ!"),
    description: yup.string().required("Vui lòng nhập nội dung dịch vụ!"),
    url: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
  })
  .required();

export default function PriceWeddingEdit({
  data,
  file,
  handleCancel,
  handleUpdateItem,
}: // refetch,
{
  data: any;
  file: any;
  handleCancel: () => void;
  handleUpdateItem: (nextValue: any[]) => void;
  // refetch: () => void;
}) {
  const priceWeddingItem = find(data, { id: file?.id }) || {};

  const defaultUrlItem = {
    id: uuidv4(),
    uid: uuidv4(),
    status: "done",
    url: priceWeddingItem?.url || "",
    name: priceWeddingItem?.name || "",
    alt: priceWeddingItem?.alt || "",
  };
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fileListUrl, setFileListUrl] = useState<any[]>([defaultUrlItem]);
  // const homePageRef = collection(firestore, "homePage");
  //   const mutation = useFirestoreCollectionMutation(homePageRef);
  // const queryClient = useQueryClient();

  const defaultValues = {
    title: priceWeddingItem?.title || "",
    description: priceWeddingItem?.description || "",
    url: [defaultUrlItem],
  };

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

  useEffect(() => {
    form.setFieldsValue({
      title: priceWeddingItem?.title || "",
      description: priceWeddingItem?.description || "",
      url: [defaultUrlItem],
    });
    setValue("title", priceWeddingItem?.title || "");
    setValue("description", priceWeddingItem?.description || "");
    setFileListUrl([defaultUrlItem] || []);
  }, [priceWeddingItem, form]);

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
      setValue("url", [
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
      const matchingUrls = fileListUrl?.reduce((result: any, image: any) => {
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileListUrl(matchingUrls);
      setValue("serviceUrl", matchingUrls);
    }
  };

  const urlProps: UploadProps = {
    name: "file",
    multiple: false,
    listType: "picture",
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
        name="control-edit-create-wedding-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (values: any) => {
          // console.log('values', values)
          const newPriceWedding = map(data, (item) => {
            if (item.id === file.id) {
              return assign({}, item, {
                name: fileListUrl?.[0]?.name || fileListUrl?.[0]?.url,
                alt: fileListUrl?.[0]?.alt || "",
                url: fileListUrl?.[0]?.url || "",
                title: values.title,
                description: values.description,
              });
            }
            return item;
          });
          handleUpdateItem?.(newPriceWedding);
          // console.log('newPriceWedding', newPriceWedding)

          // const payload = {
          //   ...data,
          //   services: newServiceItem,
          // };
          // const docRef = doc(homePageRef, data.id);
          // await updateDoc(docRef, payload);
          // queryClient.invalidateQueries("homePage");
          // setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Cập nhập thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
          handleCancel?.();
        })}
      >
        <FormItem
          control={control}
          name="url"
          // valuePropName='fileList'
          label="Upload hình ảnh dịch vụ"
        >
          <Upload {...urlProps}>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </FormItem>
        <FormItem control={control} name="title" label="Tên dịch vụ">
          <Input allowClear placeholder="Nhập tiêu đề dịch vụ" />
        </FormItem>
        <FormItem control={control} name="description" label="Nội dung dịch vụ">
          <Input allowClear placeholder="Nhập nội dung dịch vụ" />
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
