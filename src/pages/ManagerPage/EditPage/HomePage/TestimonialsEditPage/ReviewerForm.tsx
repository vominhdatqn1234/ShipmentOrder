import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { firestore, storage } from "../../../../../lib/firebase";
import { FormItem } from "../../../../../components/Form";

const schema = yup
  .object({
    userName: yup.string(),
    // .required("Vui lòng nhập tiêu đề giới thiệu!"),
    content: yup.string(),
    // .required("Vui lòng nhập tiêu đề phụ!"),
    url: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
  })
  .required();

export default function ReviewerForm({
  data,
  file,
  handleCancel,
  refetch,
}: {
  data: any;
  file: any;
  handleCancel: () => void;
  refetch: () => void;
}) {
  //   const reviewerItem = useMemo(
  //     () => find(data?.reviewer, { id: file?.id }) || {},
  //     [data?.reviewer, file?.id]
  //   );

  const isExistReviewer = find(data?.reviewer, { id: file?.id });
  const reviewerItem = isExistReviewer || file;

  const defaultUrlItem = {
    id: uuidv4(),
    uid: uuidv4(),
    status: "done",
    url: reviewerItem?.url,
    name: reviewerItem?.name,
    alt: reviewerItem?.alt,
  };
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fileListUrl, setFileListUrl] = useState<any[]>([defaultUrlItem]);
  const homePageRef = collection(firestore, "homePage");
  //   const mutation = useFirestoreCollectionMutation(homePageRef);
  const queryClient = useQueryClient();

  const defaultValues = {
    userName: reviewerItem?.userName || "",
    content: reviewerItem?.content || "",
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
      userName: reviewerItem?.userName || "",
      content: reviewerItem?.content || "",
      url: [defaultUrlItem] || [],
    });
    setFileListUrl([defaultUrlItem] || []);
  }, [reviewerItem, form]);

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
      setValue("url", matchingUrls);
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
        name="control-pre-wedding-edit-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (values: any) => {
          const newReviewer = map(data?.reviewer, (item) => {
            if (item.id === file.id) {
              return assign({}, item, {
                name: fileListUrl?.[0]?.name || fileListUrl?.[0]?.url,
                alt: fileListUrl?.[0]?.alt || "",
                url: fileListUrl?.[0]?.url || "",
                userName: values.userName,
                content: values.content,
              });
            }
            return item;
          });

          const payload = {
            ...data,
            reviewer: isEmpty(isExistReviewer)
              ? [
                  ...data?.reviewer,
                  {
                    id: uuidv4(),
                    name: fileListUrl?.[0]?.name || fileListUrl?.[0]?.url,
                    alt: fileListUrl?.[0]?.alt || "",
                    url: fileListUrl?.[0]?.url || "",
                    userName: values.userName,
                    content: values.content,
                  },
                ]
              : newReviewer || [],
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
          control={control}
          name="url"
          // valuePropName='fileList'
          label="Upload hình avatar"
        >
          <Upload {...urlProps}>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="userName"
          label="Tên người review"
        >
          <Input allowClear placeholder="Nhập tiêu tên người review" />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="content"
          label="Nội dung"
        >
          <Input.TextArea allowClear placeholder="Nhập nội dung review" />
        </FormItem>
        <div className="mt-10">
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
    </>
  );
}
