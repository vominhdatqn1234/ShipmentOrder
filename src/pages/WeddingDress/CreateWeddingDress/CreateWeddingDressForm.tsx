import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form as FormAntDeisgn,
  Input,
  message,
  Select,
  Upload,
  InputNumber,
  Space,
  Divider,
  Tooltip,
  InputRef,
  SelectProps,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { isEmpty, map } from "lodash";
import { FormItem } from "../../../components/Form";
import { RcFile } from "antd/es/upload";
import { firestore, storage } from "../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { PlusOutlined } from "@ant-design/icons";
import { collection } from "firebase/firestore";
import { useFirestoreCollectionMutation } from "@react-query-firebase/firestore";
import { useQueryClient } from "react-query";
import { v4 as uuidv4 } from "uuid";
import { WeddingDressModel } from "../../../models";
import dayjs from "dayjs";
import { ImageType } from "../../../models/ContractModel";
import { useWeddingDress } from "../WeddingDressList/useWeddingDress";
import { generateSlugUrl } from "../../../utils";
import { toast } from "react-toastify";
import { useWeddingDressType } from "../WeddingDressTypeList/useWeddingDressType";

const { Dragger } = Upload;

const defaultValueDressShape = ["A Line", "Ballgown", "Váy công chúa"];
const options: SelectProps["options"] = [
  {
    value: "Size S",
    label: "Size S",
  },
  {
    value: "Size M",
    label: "Size M",
  },
  {
    value: "Size L",
    label: "Size L",
  },
  {
    value: "Size XL",
    label: "Size XL",
  },
];

const schema = yup
  .object({
    dressName: yup.string().required("Vui lòng nhập tên váy cưới"),
    dressCode: yup.mixed().required("Vui lòng nhập chọn loại váy cưới"),
    // dressPrice: yup.string().required("Vui lòng nhập giá váy cưới"),
    // dressPriceSale: yup.string().required("Vui lòng nhập giá sale váy cưới"),
    dressImage: yup
      .mixed()
      .required("Vui lòng upload file hình ảnh")
      .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
        if (value?.length === 0) return false;

        return true;
      }),
    // dressQuantity: yup
    //   .number()
    //   .min(1, "Số lượng phải lớn hơn 1!")
    //   .required("Vui lòng nhập số lượng"),
    dressShape: yup.mixed().required("Vui lòng chọn dáng váy cưới"),
  })
  .required();

export default function CreateWeddingDressForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const keepRef = useRef<Record<string, any>>({});
  const weddingDressRef = collection(firestore, "weddingDress");
  const mutation = useFirestoreCollectionMutation(weddingDressRef);

  const { data: weddingDressTypeData } = useWeddingDressType();
  const [fileList, setFileList] = useState<any[]>([]);
  const { refetch } = useWeddingDress();
  const queryClient = useQueryClient();
  const uuId = uuidv4();

  const [name, setName] = useState("");

  const defaultValues = {
    dressName: "",
    dressCode: weddingDressTypeData[0]?.dressCodeName,
    dressPrice: "",
    dressPriceSale: "",
    description: "",
    dressImage: [],
    // dressQuantity: 1,
    dressShape: "",
    sizes: [],
  };

  const [items, setItems] = useState<string[]>(defaultValueDressShape);
  const [defaultValue, setDefaultValue] = useState<{
    value: string;
    label: string;
  }>({ value: defaultValueDressShape[0], label: defaultValueDressShape[0] });

  const inputRef = useRef<InputRef>(null);

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleChangeSelectDress = (value: { value: string; label: string }) => {
    setDefaultValue(value);
  };

  const addItem = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    e.preventDefault();
    if (!items.includes(name)) {
      setItems((prev) => [...prev, name || ""]);
      setName("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return;
    }
    toast.error(
      "Dáng váy cưới đã tồn tại trọng danh sách vui lòng nhập dáng váy cưới khác!",
      {
        position: toast.POSITION.TOP_RIGHT,
      }
    );
  };

  keepRef.current.dressImage = [];

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
      dressCode: weddingDressTypeData?.[0]?.dressCodeName || "",
    });
    setValue("dressCode", weddingDressTypeData?.[0]?.dressCodeName || "");
  }, [form, weddingDressTypeData]);

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
      setValue("dressImage", [
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
      setValue("dressImage", matchingUrls);
    }
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
          const payload: WeddingDressModel = {
            ...data,
            slug: generateSlugUrl(data?.dressName || ""),
            dressImage: fileList,
            dressCode: data?.dressCode,
            dressShape: data?.dressShape?.value,
            createDate: dayjs().toISOString(),
          };

          mutation.mutate(payload);
          queryClient.invalidateQueries("weddingDress");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Tạo váy cưới thành công!",
            duration: 5,
          });
          setLoading(false);
          setFileList([]);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="dressName" label="Tên váy cưới">
            <Input allowClear placeholder="Nhập tên váy cưới" />
          </FormItem>
          <FormItem control={control} name="dressCode" label="Loại váy cưới">
            <Select defaultValue={"Premium"}>
              {weddingDressTypeData.map((drn, index) => {
                return (
                  <Select.Option key={index} value={drn?.dressCodeName}>
                    {drn?.dressCodeName}
                  </Select.Option>
                );
              })}
              {/* <Select.Option value="Premium">Premium</Select.Option>
              <Select.Option value="Limited">Limited</Select.Option>
              <Select.Option value="Luxury">Luxury</Select.Option> */}
            </Select>
          </FormItem>
          <FormItem
            control={control}
            name="dressShape"
            label="Chi tiết váy cưới"
          >
            <Select
              // showSearch
              defaultValue={defaultValue}
              // style={{ width: 200 }}
              optionFilterProp="children"
              placeholder="Chi tiết váy cưới"
              onChange={handleChangeSelectDress}
              labelInValue
              filterOption={false}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <Space style={{ padding: "0 8px 4px" }}>
                    <Tooltip title="Nhập chi tiết váy cưới">
                      <Input
                        placeholder="Nhập chi tiết váy cưới"
                        ref={inputRef}
                        value={name}
                        onChange={onNameChange}
                      />
                    </Tooltip>
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={addItem}
                    >
                      Thêm
                    </Button>
                  </Space>
                </>
              )}
              options={map(items, (shape) => ({
                value: shape,
                label: shape,
              }))}
            />
          </FormItem>
          <FormItem control={control} name="description" label="Mô tả váy cưới">
            <Input.TextArea style={{ height: 120 }} allowClear />
          </FormItem>
        </div>
        <div className="py-6">
          <FormItem
            control={control}
            name="dressImage"
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
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          {/* <FormItem control={control} name="dressQuantity" label="Số lượng">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập số lượng"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem> */}
          <FormItem control={control} name="dressPrice" label="Giá">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem control={control} name="dressPriceSale" label="Giá Sale">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá sale"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem control={control} name="sizes" label="Size">
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="Chọn size"
              options={options}
            />
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
