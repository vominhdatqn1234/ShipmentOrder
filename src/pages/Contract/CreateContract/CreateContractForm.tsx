import React, { useEffect, useRef, useState } from "react";
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
  Badge,
  DatePicker,
  Card,
  Checkbox,
  Popconfirm,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { SelectProps, UploadProps } from "antd";
import {
  InboxOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { capitalize, filter, find, isEmpty, map, reduce, remove } from "lodash";
import { FormItem } from "../../../components/Form";
import { RcFile } from "antd/es/upload";
import { firestore, storage } from "../../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "lib/supastorage";
import { collection } from "lib/db";
import { useFirestoreCollectionMutation } from "lib/queryHooks";
import { v4 as uuidv4 } from "uuid";
import {
  StatusColorType,
  formatCurrency,
  getStatusColor,
  isVietnamesePhoneNumber,
  regexPassword,
} from "../../../utils";
import dayjs, { Dayjs } from "dayjs";
import { ContractModel } from "../../../models";
import { useContract } from "../useContract";
import { useQueryClient } from "react-query";
import Editor from "../../../components/Editor";
import Viewer from "../../../components/Editor/Viewer";
import { useContractType } from "../ContractTypeList/useContractType";
import { useServicesArising } from "../ServicesArisingList/useServicesArising";
import { cn } from "../../../lib/cs";
import { useUser } from "../../../store/useUser";
import { PrintContract } from "../../../components/ComponentToPrint/PrintContract";
import { generateSlugUrl } from "../../../utils";

const { Dragger } = Upload;

const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";

const defaultValues = {
  contractType: undefined,
  userName: "",
  status: "",
  phone: "",
  address: "",
  discount: "",
  firstCheckDeposit: false,
  servicesArisingPrice: "",
  firstDepositPrice: "",
  firstDepositPriceDate: "",
  secondCheckDeposit: false,
  secondDepositPrice: "",
  secondDepositPriceDate: "",
  createDate: currentDate as Dayjs,
  shootingDate: currentDate as Dayjs,
  dueDate: dayjs(currentDate.add(3, "day")),
  contractPrice: "",
  contractImage: [],
  notes: "",
};

const statusList = ["active", "complete"];

const schema = yup
  .object({
    // contractType: yup.mixed().required("Vui lòng chọn loại hợp đồng"),
    status: yup.string().required("Vui lòng chọn trạng thái hợp đồng"),
    phone: yup
      .string()
      .required("Vui lòng nhập số điện thoại của bạn!")
      .test("phone", "Số điên thoại sai định dạng", (str, context) => {
        return isVietnamesePhoneNumber(str);
      }),
    createDate: yup.date().required("Chọn ngày ký hợp đồng"),
    shootingDate: yup.date(),
    // .required("Chọn ngày ký hợp đồng"),
    dueDate: yup.date(),
    // .min(
    //   currentDate,
    //   "Ngày hoàn thành hợp đồng lớn hơn hoặc bằng ngày hiện tại!"
    // ),
    address: yup.string().required("Vui lòng địa chỉ"),
    // contractImage: yup
    //   .mixed()
    //   .required("Vui lòng upload file hình ảnh")
    //   .test("fileEmpty", "Vui lòng upload file hình ảnh", (value: any) => {
    //     if (value?.length === 0) return false;
    //     return true;
    //   }),
  })
  .required();

export default function CreateContractForm() {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const contractRef = collection(firestore, "contract");
  const [fileList, setFileList] = useState<any[]>([]);
  const mutation = useFirestoreCollectionMutation(contractRef);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<any[]>([]);
  const [listItems, setListItems] = useState<any>([]);
  const [listContractItems, setListContractItems] = useState<any>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [discountArising, setDiscountArising] = useState(0);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [selectedContractItem, setSelectedContractItem] = useState<any>(null);
  const [quantityContract, setQuantityContract] = useState(1);
  const [discountContract, setDiscountContract] = useState(0);
  const [showQuantityContractInput, setShowQuantityContractInput] =
    useState(false);
  const { refetch } = useContract();
  const { data: contractTypeData } = useContractType();
  const { data: servicesArisingData } = useServicesArising();
  const queryClient = useQueryClient();
  const uuId = uuidv4();
  const { user } = useUser();
  const isAdmin = user?.permission === "Admin";
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
          id: uuidv4(),
          url: info.file.url,
          name: info.file.name,
          alt: info.file.name.substr(0, info.file.name.lastIndexOf(".")),
        },
      ]);
      setValue("contractImage", [
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

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    if (fileList.length > 0) {
      const matchingUrls = fileList?.reduce((result: any, image: any) => {
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileList(matchingUrls);
      setValue("contractImage", matchingUrls);
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
          const maxWidth = 1290;
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
  const props: UploadProps = {
    name: "file",
    multiple: true,
    listType: "picture",
    // beforeUpload,
    fileList,
    customRequest,
    onChange: handleChange,
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const contractNameValue = FormAntDeisgn.useWatch("contractType", form);
  // const contractPriceValue = FormAntDeisgn.useWatch("contractPrice", form);

  const contractPriceValue = reduce(
    listContractItems,
    (total: number, item: any) => {
      return total + +item?.price * item?.quantity || 0;
    },
    0
  );

  const servicesArisingPriceValue = reduce(
    listItems,
    (total: number, item: any) => {
      return total + +item?.price * item?.quantity || 0;
    },
    0
  );
  useEffect(() => {
    const servicesArisingDiscountValue = reduce(
      listItems,
      (total: number, item: any) => {
        return total + +item?.discount || 0;
      },
      0
    );
    const contractDiscountValue = reduce(
      listContractItems,
      (total: number, item: any) => {
        return total + +item?.discount || 0;
      },
      0
    );
    form.setFieldValue(
      "discount",
      +contractDiscountValue + +servicesArisingDiscountValue
    );
    setValue(
      "discount",
      +contractDiscountValue + +servicesArisingDiscountValue
    );
  }, [listContractItems, listItems]);
  const discountValue = FormAntDeisgn.useWatch("discount", form);
  const firstDepositPriceValue = FormAntDeisgn.useWatch(
    "firstDepositPrice",
    form
  );
  const secondDepositPriceValue = FormAntDeisgn.useWatch(
    "secondDepositPrice",
    form
  );
  const firstCheckDepositValue = FormAntDeisgn.useWatch(
    "firstCheckDeposit",
    form
  );
  const secondCheckDepositValue = FormAntDeisgn.useWatch(
    "secondCheckDeposit",
    form
  );

  const options: SelectProps["options"] = map(servicesArisingData, (data) => ({
    value: data.serviceName,
    label: data.serviceName,
  }));
  const contractTypeOptions: SelectProps["options"] = map(
    contractTypeData,
    (data) => ({
      value: data.contractName,
      label: data.contractName,
    })
  );

  useEffect(() => {
    form.setFieldValue("contractPrice", `${+contractPriceValue}`);
    setValue("contractPrice", `${+contractPriceValue}`);
  });

  useEffect(() => {
    // form.setFieldValue("contractPrice", contractPriceValue);
    setValue("contractPriceItems", listContractItems);
  }, [listContractItems]);

  useEffect(() => {
    form.setFieldValue("servicesArisingPrice", `${+servicesArisingPriceValue}`);
    setValue("servicesArisingPrice", `${+servicesArisingPriceValue}`);
    setValue("servicesArisingItems", listItems);
  }, [listItems]);

  useEffect(() => {
    form.setFieldValue("status", "active");
    setValue("status", "active");
  }, []);

  const totalPrice = `${
    +contractPriceValue +
    +servicesArisingPriceValue -
    (+discountValue + +firstDepositPriceValue + +secondDepositPriceValue)
  }`;

  const handleSelect = (value: any) => {
    // When an item is selected, show the quantity input field
    const payload = {
      key: generateSlugUrl(`${value}`),
      value,
      label: value,
      quantity: quantity,
      discount: discountArising,
    };
    setSelectedItem(value);
    const isExistItem = find(listItems, { value: payload?.value });
    if (!isExistItem) {
      const servicesArising = find(servicesArisingData, {
        serviceName: payload?.value,
      });
      setListItems([
        ...listItems,
        { ...payload, price: servicesArising?.servicePrice || 0 },
      ]);
    }
    setShowQuantityInput(true);
  };

  const handleSelectContract = (value: any) => {
    // When an item is selected, show the quantity input field
    const payload = {
      key: generateSlugUrl(`${value}`),
      value,
      label: value,
      quantity: quantityContract,
      discount: discountContract,
    };
    setSelectedContractItem(value);
    const isExistItem = find(listContractItems, { value: payload?.value });
    if (!isExistItem) {
      const isExistContract = find(contractTypeData, {
        contractName: payload?.value,
      });
      setListContractItems([
        ...listContractItems,
        { ...payload, price: isExistContract?.contractPrice || 0 },
      ]);
    }
    setShowQuantityContractInput(true);
  };

  const handleDeSelectContract = (value: string) => {
    setListContractItems(
      filter(listContractItems, (item: any) => item?.value !== value)
    );
  };

  const handleDeSelect = (value: string) => {
    setListItems(filter(listItems, (item: any) => item?.value !== value));
  };
  const handleAddContractItem = () => {
    // Perform actions with selected item and quantity
    const updateItems = map(listContractItems, (item) => {
      if (item.key === generateSlugUrl(`${selectedContractItem}`)) {
        return {
          ...item,
          quantity: quantityContract,
          discount: discountContract,
        };
      }
      return item;
    });
    // Reset the state and hide the quantity input field
    setSelectedContractItem(null);
    setListContractItems(updateItems);
    setQuantityContract(1);
    setDiscountContract(0);
    setShowQuantityContractInput(false);
  };

  const handleAddItem = () => {
    // Perform actions with selected item and quantity
    const updateItems = map(listItems, (item) => {
      if (item.key === generateSlugUrl(`${selectedItem}`)) {
        return {
          ...item,
          quantity: quantity,
          discount: discountArising,
        };
      }
      return item;
    });
    // Reset the state and hide the quantity input field
    setSelectedItem(null);
    setListItems(updateItems);
    setQuantity(1);
    setDiscountArising(0);
    setShowQuantityInput(false);
  };

  return (
    <>
      {contextHolder}
      <div className="py-6">
        <PrintContract getValues={getValues} />
      </div>
      <FormAntDeisgn
        form={form}
        name="control-create-contract-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit((data) => {
          const payload: ContractModel = {
            ...data,
            firstPaymentMethod: data?.firstPaymentMethod || "",
            secondPaymentMethod: data?.secondPaymentMethod || "",
            servicesArising:
              map(listItems, (item) => {
                return item?.value;
              }) || [],
            contractType:
              map(listContractItems, (item) => {
                return item?.value;
              }) || [],
            contractPriceItems: listContractItems,
            servicesArisingItems: listItems,
            totalContractPrice: data?.contractPrice || "",
            contractImage: fileList,
            shootingDate: data?.shootingDate?.toISOString?.() || "",
            createDate: data?.createDate?.toISOString?.() || "",
            dueDate: data?.dueDate?.toISOString?.() || "",
            secondDepositPriceDate:
              data?.secondDepositPriceDate?.toISOString?.() || "",
            firstDepositPriceDate:
              data?.firstDepositPriceDate?.toISOString?.() || "",
            notes: data?.notes ? [data?.notes] : [],
            totalPrice: `${
              +contractPriceValue + +servicesArisingPriceValue - +discountValue
            }`,
          };
          console.log("payload", payload);
          mutation.mutate(payload);
          queryClient.invalidateQueries("contract");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Tạo hợp đồng thành công!",
            duration: 5,
          });
          setLoading(false);
          form.resetFields();
          formRef.current?.resetFields();
          reset();
          // setFileList([]);
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="contractType" label="Loại hợp đồng">
            {/* <Select showSearch>
              {contractTypeData.map((dt) => {
                return (
                  <Select.Option
                    key={`contract-type-${dt.id}`}
                    value={dt?.contractName}
                  >
                    {dt?.contractName}
                  </Select.Option>
                );
              })}
            </Select> */}
            {/* <Select
              mode="multiple"
              allowClear
              showSearch
              style={{ width: "100%" }}
              placeholder="Chọn loại hợp đồng"
              options={contractTypeOptions}
            /> */}
            <Popconfirm
              title="Nhập số lượng"
              open={showQuantityContractInput}
              description={
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={quantityContract}
                    onChange={(e) =>
                      setQuantityContract(parseInt(e.target.value))
                    }
                  />
                  <InputNumber
                    defaultValue={0}
                    value={discountContract}
                    style={{ width: "100%" }}
                    placeholder="Nhập discount"
                    onChange={(e) => setDiscountContract(e as number)}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                  />
                </div>
              }
              onConfirm={handleAddContractItem}
              onCancel={() => setShowQuantityContractInput(false)}
              okText="Thêm"
              cancelText="Huỷ"
            >
              <Select
                mode="multiple"
                // allowClear
                showSearch
                style={{ width: "100%" }}
                placeholder="Chọn loại hợp đồng"
                options={contractTypeOptions}
                onDeselect={handleDeSelectContract}
                onSelect={handleSelectContract}
              />
            </Popconfirm>
          </FormItem>
          <FormItem
            control={control}
            name="servicesArising"
            label="Danh mục phát sinh"
          >
            <Popconfirm
              title="Nhập số lượng và discount"
              open={showQuantityInput}
              description={
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                  />
                  <InputNumber
                    defaultValue={0}
                    value={discountArising}
                    style={{ width: "100%" }}
                    placeholder="Nhập discount"
                    onChange={(e) => setDiscountArising(e as number)}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                  />
                </div>
              }
              onConfirm={handleAddItem}
              onCancel={() => setShowQuantityInput(false)}
              okText="Thêm"
              cancelText="Huỷ"
            >
              <Select
                mode="multiple"
                // allowClear
                showSearch
                style={{ width: "100%" }}
                placeholder="Chọn danh mục phát sinh"
                options={options}
                onDeselect={handleDeSelect}
                onSelect={handleSelect}
              />
            </Popconfirm>
          </FormItem>
          <FormItem control={control} name="status" label="Trạng thái">
            <Select showSearch>
              {statusList.map((sts, index) => {
                return (
                  <Select.Option key={index} value={sts}>
                    <Badge
                      color={getStatusColor(
                        (`${sts}`.toLowerCase() as StatusColorType) || "pending"
                      )}
                      text={capitalize(sts)}
                    />
                  </Select.Option>
                );
              })}
            </Select>
          </FormItem>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem control={control} name="userName" label="Tên khách hàng">
            <Input allowClear placeholder="Nhập tên khách hàng" />
          </FormItem>
          <FormItem control={control} name="phone" label="Số điện thoại">
            <Input allowClear placeholder="Nhập số điện thoại" />
          </FormItem>
          <FormItem control={control} name="address" label="Địa chỉ">
            <Input allowClear placeholder="Nhập địa chỉ" />
          </FormItem>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem
            control={control}
            name="contractPrice"
            label="Giá hợp đồng"
            valuePropName="value"
          >
            <InputNumber
              disabled
              style={{ width: "100%" }}
              placeholder="Giá hợp đồng"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem
            control={control}
            name="servicesArisingPrice"
            label="Giá mục phát sinh"
            valuePropName="value"
          >
            <InputNumber
              disabled
              style={{ width: "100%" }}
              placeholder="Giá mục phát sinh"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
          <FormItem
            control={control}
            name="discount"
            label="Tổng discount"
            valuePropName="value"
          >
            <InputNumber
              disabled
              style={{ width: "100%" }}
              placeholder="Tổng discount"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </FormItem>
        </div>
        <div className="pb-6">
          <Space>
            <span className="text-lg font-semibold text-gray-900">
              Thành tiền:
            </span>
            <span className="text-lg font-semibold text-blue-600">
              {formatCurrency(
                `${+contractPriceValue + +servicesArisingPriceValue}`
              )}
            </span>
          </Space>
        </div>
        <div className="pb-6">
          <Space>
            <span className="text-lg font-semibold text-gray-900">
              Thanh toán còn lại:
            </span>
            <span className="text-lg font-semibold text-blue-600">
              {formatCurrency(totalPrice)}
            </span>
          </Space>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
          <FormItem
            control={control}
            name="createDate"
            label="Ngày ký hợp đồng"
          >
            <DatePicker
              format={dateFormat}
              placeholder="Vui lòng chọn ngày ký hợp đồng"
              style={{ width: "100%" }}
            />
          </FormItem>
          <FormItem control={control} name="shootingDate" label="Ngày bấm máy">
            <DatePicker
              format={dateFormat}
              placeholder="Vui lòng chọn ngày bấm máy"
              style={{ width: "100%" }}
            />
          </FormItem>
          <FormItem
            control={control}
            name="dueDate"
            label="Ngày hoàn thành hợp đồng"
          >
            <DatePicker
              format={dateFormat}
              placeholder="Vui lòng chọn ngày hoàn thành hợp đồng"
              style={{ width: "100%" }}
            />
          </FormItem>
        </div>
        {/* <div className="py-6">
          <FormItem
            control={control}
            name="contractImage"
            // valuePropName='fileList'
            label="Upload hình ảnh hợp đồng"
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
        </div> */}
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6 pb-6">
          <Card
            size="small"
            title="Cọc lần 1"
            extra={
              <FormItem
                style={{ marginBottom: 0 }}
                control={control}
                name="firstCheckDeposit"
                valuePropName="checked"
              >
                <Checkbox />
              </FormItem>
            }
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6 pb-6">
              <FormItem
                control={control}
                name="firstDepositPrice"
                label="Tiền cọc lần 1"
              >
                <InputNumber
                  disabled={!firstCheckDepositValue}
                  style={{ width: "100%" }}
                  placeholder="Nhập tiền cọc lần 1"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </FormItem>
              <FormItem
                control={control}
                name="firstDepositPriceDate"
                label="Ngày cọc lần 1"
              >
                <DatePicker
                  disabled={!firstCheckDepositValue}
                  format={dateFormat}
                  placeholder="Vui lòng chọn ngày cọc lần 1"
                  style={{ width: "100%" }}
                />
              </FormItem>
              <FormItem
                control={control}
                name="firstPaymentMethod"
                label="Phương thức thanh toán"
              >
                <Select
                  style={{ width: 140 }}
                  disabled={!firstCheckDepositValue}
                  options={[
                    { value: "Chuyển khoản", label: "Chuyển khoản" },
                    { value: "Tiền mặt", label: "Tiền mặt" },
                  ]}
                />
              </FormItem>
            </div>
          </Card>
          <Card
            size="small"
            title="Cọc lần 2"
            extra={
              <FormItem
                style={{ marginBottom: 0 }}
                control={control}
                name="secondCheckDeposit"
                valuePropName="checked"
              >
                <Checkbox />
              </FormItem>
            }
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6 pb-6">
              <FormItem
                control={control}
                name="secondDepositPrice"
                label="Tiền cọc lần 2"
              >
                <InputNumber
                  disabled={!secondCheckDepositValue}
                  style={{ width: "100%" }}
                  placeholder="Nhập tiền cọc lần 2"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </FormItem>
              <FormItem
                control={control}
                name="secondDepositPriceDate"
                label="Ngày cọc lần 2"
              >
                <DatePicker
                  disabled={!secondCheckDepositValue}
                  format={dateFormat}
                  placeholder="Vui lòng chọn ngày cọc lần 2"
                  style={{ width: "100%" }}
                />
              </FormItem>
              <FormItem
                control={control}
                name="secondPaymentMethod"
                label="Phương thức thanh toán"
              >
                <Select
                  style={{ width: 140 }}
                  disabled={!secondCheckDepositValue}
                  options={[
                    { value: "Chuyển khoản", label: "Chuyển khoản" },
                    { value: "Tiền mặt", label: "Tiền mặt" },
                  ]}
                />
              </FormItem>
            </div>
          </Card>
        </div>

        <div className="pb-6">
          <FormItem control={control} name="notes" label="Ghi chú">
            <Editor />
          </FormItem>
        </div>
        {/* <Viewer value={`**anh yeu em**
        1. [13213123](13213123)2. **anh yeu em**`} /> */}
        <Button
          loading={loading}
          disabled={!isEmpty(errors)}
          type="primary"
          htmlType="submit"
          block
          size="large"
          className="mt-6"
        >
          Tạo hợp đồng
        </Button>
      </FormAntDeisgn>
    </>
  );
}
