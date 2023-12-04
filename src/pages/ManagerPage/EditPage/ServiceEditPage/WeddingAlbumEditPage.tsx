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
// import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
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
    content: yup.string(),
    subContent: yup
      .string()
      .required("Vui lòng nhập nội dung giới thiệu album cưới"),
    background: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh nền ablum cưới")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
    gallery: yup
      .mixed()
      .required("Vui lòng upload file danh sách hình ảnh ablum cưới")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
    videoOne: yup.string().required("Vui lòng nhập link váy cưới 1"),
    videoTwo: yup.string().required("Vui lòng nhập link váy cưới 1"),
  })
  .required();

interface DraggableUploadListItemProps {
  originNode: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  file: UploadFile<any>;
}

const defaultVideo =
  "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FMardollStudio%2Fvideos%2F218799524186281&width=1600&show_text=false&appId=626080131062806&height=900";

export default function WeddingAlbumEditPage({
  type = "album",
  data,
  handleCancel,
  refetch,
}: {
  type?: "album" | "reportage";
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
  const [fileList, setFileList] = useState<any[]>([]);
  const [itemFile, setItemFile] = useState<any>({});
  const [isOpen, setIsOpen] = useState(false);
  //   const mutation = useFirestoreCollectionMutation(contactPageRef);
  const queryClient = useQueryClient();

  const typeWedding = {
    album: "albumPhoto",
    reportage: "weddingDayReportage",
  };

  const defaultValues = {
    title: data?.[typeWedding[type]]?.title || "",
    subTitle: data?.[typeWedding[type]]?.subTitle || "",
    content: data?.[typeWedding[type]]?.content || "",
    subContent: data?.[typeWedding[type]]?.subContent || "",
    background: data?.[typeWedding[type]]?.background || [],
    gallery: data?.[typeWedding[type]]?.gallery || [],
    videoOne: data?.[typeWedding[type]]?.videoOne || "",
    videoTwo: data?.[typeWedding[type]]?.videoTwo || "",
  };

  useEffect(() => {
    form.setFieldsValue({
      title: data?.[typeWedding[type]]?.title || "",
      subTitle: data?.[typeWedding[type]]?.subTitle || "",
      content: data?.[typeWedding[type]]?.content || "",
      subContent: data?.[typeWedding[type]]?.subContent || "",
      background: data?.[typeWedding[type]]?.background || [],
      gallery: data?.[typeWedding[type]]?.gallery || [],
      videoOne: data?.[typeWedding[type]]?.videoOne || "",
      videoTwo: data?.[typeWedding[type]]?.videoTwo || ``,
    });
    setFileList(data?.[typeWedding[type]]?.gallery || []);
    setFileListUrl(data?.[typeWedding[type]]?.background || []);
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
      }
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
      setValue("gallery", matchingUrls);
    }
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
        <Button className="!mt-2" onClick={handleShowModalForm(file)}>
          Chỉnh sửa
        </Button>
      </div>
    );
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
      setFileList(matchingUrls);
      setValue("background", matchingUrls);
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
        name="control-about-me-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (values: ContactPageModel) => {
          // const newAlbumPhoto = map(data?.albumPhoto?.gallery, (item) => {
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
            [typeWedding[type]]: {
              ...values,
              background: fileListUrl,
              gallery: fileList,
            },
          };
          // console.log("payload", payload);
          // //   mutation.mutate(payload);
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
          hasFeedback={false}
          control={control}
          name="content"
          label="Tiêu đề nội dung album cưới"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập tiêu đề của nội dung album cưới"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="subContent"
          label="Nội dung album cưới"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập nội dung album cưới"
          />
        </FormItem>
        <FormItem
          control={control}
          name="background"
          // valuePropName='fileList'
          label="Upload hình nền album cưới"
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
        <FormItem
          control={control}
          name="gallery"
          // valuePropName='fileList'
          label="Upload danh sách hình album cưới"
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
          </Dragger>
        </FormItem>

        <FormItem
          hasFeedback={false}
          control={control}
          name="videoOne"
          label="Video đầu tiên"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập link video đầu tiên"
          />
        </FormItem>
        <FormItem
          hasFeedback={false}
          control={control}
          name="videoTwo"
          label="Video thứ 2"
        >
          <Input.TextArea
            style={{
              height: 90,
            }}
            allowClear
            placeholder="Nhập link video thứ 2"
          />
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
          type={type}
          refetch={refetch}
          data={data}
          file={itemFile}
          handleCancel={handleCloseModalForm}
        />
      </Modal>
    </>
  );
}
