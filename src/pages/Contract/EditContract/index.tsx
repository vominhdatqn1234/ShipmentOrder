import React, { useRef, useState, useEffect } from "react";
import { InboxOutlined } from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Card,
  Checkbox,
  Popconfirm,
  SelectProps,
  Space,
  UploadProps,
} from "antd";
import {
  Badge,
  Button,
  DatePicker,
  Form as FormAntDeisgn,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { collection, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  capitalize,
  filter,
  find,
  isArray,
  isEmpty,
  isUndefined,
  map,
  reduce,
} from "lodash";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "react-query";
import * as yup from "yup";
import { FormItem } from "../../../components/Form";
import { firestore, storage } from "../../../lib/firebase";
import { ContractModel } from "../../../models";
import {
  StatusColorType,
  formatCurrency,
  generateSlugUrl,
  getStatusColor,
  isVietnamesePhoneNumber,
} from "../../../utils";
import Editor from "../../../components/Editor";
import { useServicesArising } from "../ServicesArisingList/useServicesArising";
import { cn } from "../../../lib/cs";
import { useUser } from "../../../store/useUser";
import { useContractType } from "../ContractTypeList/useContractType";
const { Dragger } = Upload;

const currentDate = dayjs();
const dateFormat = "DD-MM-YYYY";

const statusList = ["pending", "active", "complete", "canceled", "rejected"];
const dressNameList = [
  "Premium",
  "Limited",
  "Luxury",
  "Ruby",
  "Basic",
  "Áo Dài",
];

const dressTypeList = ["Chụp ảnh cưới", "Thuê váy cưới", "Quay phóng sự"];

const schema = yup
  .object({
    // contractType: yup.string().required("Vui lòng chọn loại hợp đồng"),
    // dressName: yup.string().required("Vui lòng chọn loại váy cưới"),
    status: yup.string().required("Vui lòng chọn trạng thái hợp đồng"),
    phone: yup
      .string()
      .required("Vui lòng nhập số điện thoại của bạn!")
      .test("phone", "Số điên thoại sai định dạng", (str, context) => {
        return isVietnamesePhoneNumber(str);
      }),
    createDate: yup.date().required("Chọn ngày ký hợp đồng"),
    shootingDate: yup.date().required("Chọn ngày bấm máy"),
    dueDate: yup.date().required("Chọn ngày hoàn thành hợp đồng"),
    // .min(
    //   currentDate,
    //   "Ngày hoàn thành hợp đồng lớn hơn hoặc bằng ngày hiện tại!"
    // ),
    // contractPrice: yup.string().required("Vui lòng nhập giá hợp đồng"),
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

export default function EditContract({
  defaultValues,
  handleCancel,
  refetch,
}: {
  defaultValues: ContractModel;
  handleCancel: () => void;
  refetch: () => void;
}) {
  const formRef = useRef<FormInstance>(null);
  const [form] = FormAntDeisgn.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [listItems, setListItems] = useState<any>(defaultValues?.servicesArisingItems);
  const [listContractItems, setListContractItems] = useState<any>(defaultValues?.contractPriceItems || []);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [discountArising, setDiscountArising] = useState(0);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [selectedContractItem, setSelectedContractItem] = useState<any>(null);
  const [quantityContract, setQuantityContract] = useState(1);
  const [discountContract, setDiscountContract] = useState(0);
  const [showQuantityContractInput, setShowQuantityContractInput] =
    useState(false);
  const contractRef = collection(firestore, "contract");
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isAdmin = user?.permission === "Admin";

  const [fileList, setFileList] = useState<any[]>(defaultValues.contractImage);
  const uuId = uuidv4();
  const { data: servicesArisingData } = useServicesArising();
  const { data: contractTypeData } = useContractType();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<any>({
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      notes: defaultValues?.notes?.[0]?.html || "<p></p>",
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    form.setFieldsValue({
      id: defaultValues.id,
      contractType: defaultValues.contractType,
      status: defaultValues.status,
      phone: defaultValues.phone,
      address: defaultValues.address,
      createDate: defaultValues.createDate,
      dueDate: defaultValues.dueDate,
      contractPrice: defaultValues.contractPrice,
      contractImage: defaultValues.contractImage,
      notes: defaultValues?.notes,
      firstPaymentMethod: defaultValues?.firstPaymentMethod,
      secondPaymentMethod: defaultValues?.secondPaymentMethod,
    });
    setValue("notes", defaultValues?.notes);
    setValue("contractType", defaultValues.contractType);
    setFileList(defaultValues.contractImage);
  }, [defaultValues, form]);

  const contractTypeValue = FormAntDeisgn.useWatch("contractType", form);

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
      setValue("contractImage", [
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
        if (newFileList.some((file: any) => image?.id?.includes(file?.id))) {
          result.push(image);
        }
        return result;
      }, []);
      setFileList(matchingUrls);
      setValue("contractImage", matchingUrls);
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
  const options: SelectProps["options"] = map(servicesArisingData, (data) => ({
    value: data.serviceName,
    label:  <span  onClick={(e) => {
      const isExistItem = find(listItems, { value: data.serviceName });
      const payload = {
        key: generateSlugUrl(`${data.serviceName}`),
        value: data.serviceName,
        label: data.serviceName,
        quantity: isExistItem?.quantity || quantity,
        discount: isExistItem?.discount || discountContract,
      };
      isExistItem?.quantity && setQuantity(isExistItem?.quantity)
      isExistItem?.discount && setDiscountArising(isExistItem?.discount)
      setSelectedItem(data.serviceName);
      if (!isExistItem) {
        const isExistContract = find(servicesArisingData, {
          serviceName: payload?.value,
        });
        setListItems([
          ...listContractItems,
          { ...payload, price: isExistContract?.servicePrice || 0 },
        ]);
      }
      setShowQuantityInput(true);
    }}> {data.serviceName}</span>,
  }));
  const contractTypeOptions: SelectProps["options"] = map(
    contractTypeData,
    (data) => ({
      value: data.contractName,
      label:  <span  onClick={(e) => {
        const isExistItem = find(listContractItems, { value: data.contractName });
        const payload = {
          key: generateSlugUrl(`${data.contractName}`),
          value: data.contractName,
          label: data.contractName,
          quantity: isExistItem?.quantity || quantity,
          discount: isExistItem?.discount || discountContract,
        };
        isExistItem?.quantity && setQuantityContract(isExistItem?.quantity)
        isExistItem?.discount && setDiscountContract(isExistItem?.discount)
        setSelectedContractItem(data.contractName);
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
      }}> {data.contractName}</span>
    })
  );

  const handleSelectContract = (value: any) => {
    // When an item is selected, show the quantity input field

    const isExistItem = find(listContractItems, { value });
    const payload = {
      key: generateSlugUrl(`${value}`),
      value,
      label: value,
      quantity: isExistItem?.quantity || quantity,
      discount: isExistItem?.discount || discountContract,
    };
    isExistItem?.quantity && setQuantityContract(isExistItem?.quantity)
    isExistItem?.discount && setDiscountContract(isExistItem?.discount)
    setSelectedContractItem(value);
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
  const handleDeSelectContract = (value: string) => {
    setListContractItems(
      filter(listContractItems, (item: any) => item?.value !== value)
    );
  };

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

  const handleDeSelect = (value: string) => {
    setListItems(filter(listItems, (item: any) => item?.value !== value));
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
  const servicesArisingValue = FormAntDeisgn.useWatch("servicesArising", form);
  const nameValue = FormAntDeisgn.useWatch("contractType", form);

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

  useEffect(() => {
    if (nameValue) {
      const contractTypePrice = reduce(nameValue, (sum: any, value) => {
        const findContractType = find(listContractItems, {
          value: value,
        });
        if (findContractType) {
          return sum += +findContractType?.price * +findContractType?.quantity
        }
        return sum
      }, 0)
        form.setFieldValue(
          "contractPrice",
          `${+contractTypePrice}`
        );
        setValue("contractPrice", `${+contractTypePrice}`);
    }
    // if (servicesArisingValue?.length > 0) {
    //   const totalArisingPrice = reduce(
    //     servicesArisingValue,
    //     (total: number, item: string) => {
    //       const foundItem = find(servicesArisingData, { serviceName: item });
    //       if (foundItem) {
    //         return total + +foundItem.servicePrice;
    //       }
    //       return total;
    //     },
    //     0
    //   );
    //   form.setFieldValue("servicesArisingPrice", `${totalArisingPrice}`);
    //   setValue("servicesArisingPrice", `${totalArisingPrice}`);
    // }
  });

  useEffect(() => {
    form.setFieldValue("servicesArisingPrice", `${+servicesArisingPriceValue}`);
    setValue("servicesArisingPrice", `${+servicesArisingPriceValue}`);
    setValue("servicesArisingItems", listItems);
  });

  const contractPriceValue = FormAntDeisgn.useWatch("contractPrice", form);

  const servicesArisingPriceValue = reduce(
    listItems,
    (total: number, item: any) => {
      return total + +item?.price * item?.quantity || 0;
    },
    0
  );
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
  const discountValueValid = isUndefined(discountValue) ? 0 : +discountValue;
  const firstDepositPriceValueValid = isUndefined(firstDepositPriceValue)
    ? 0
    : +firstDepositPriceValue;
  const secondDepositPriceValueValid = isUndefined(secondDepositPriceValue)
    ? 0
    : +secondDepositPriceValue;
  const totalPrice = `${
    +contractPriceValue +
    +servicesArisingPriceValue -
    (+discountValueValid +
      +firstDepositPriceValueValid +
      +secondDepositPriceValueValid)
  }`;

  return (
    <>
      {contextHolder}
      <FormAntDeisgn
        form={form}
        name="control-contract-edit-ref"
        ref={formRef}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data: ContractModel) => {
          // const contractTypeValuePrice = map(
          //   (data as any)?.servicesArising,
          //   (service) => {
          //     const findContractType = find(servicesArisingData, {
          //       serviceName: service,
          //     });
          //     if (findContractType) {
          //       return {
          //         name: service || "",
          //         price: findContractType?.servicePrice,
          //       };
          //     }
          //     return {
          //       name: service || "",
          //       price: `${0}`,
          //     };
          //   }
          // );
          const payload: ContractModel = {
            ...data,

            contractPriceItems: listContractItems,
            servicesArisingItems: listItems,
            contractImage: fileList,
            // contractTypeValuePrice: contractTypeValuePrice as any,
            createDate: dayjs(data.createDate).toISOString(),
            dueDate: dayjs(data.dueDate).toISOString(),
            shootingDate: dayjs(data.shootingDate).toISOString(),
            firstDepositPriceDate: dayjs(
              data.firstDepositPriceDate
            ).toISOString(),
            secondDepositPriceDate: dayjs(
              data.secondDepositPriceDate
            ).toISOString(),
            notes: isArray(data?.notes) ? data?.notes : [data?.notes],
            totalPrice: `${
              +contractPriceValue +
              +servicesArisingPriceValue -
              +discountValueValid
            }`,
          };
          console.log('payload', payload)
          const docRef = doc(contractRef, defaultValues.id);
          await updateDoc(docRef, payload);
          queryClient.invalidateQueries("contract");
          setTimeout(async () => await refetch(), 300);
          setLoading(true);
          messageApi.open({
            type: "success",
            content: "Cập nhập hợp đồng thành công!",
            duration: 5,
          });
          setLoading(false);
          handleCancel?.();
          form.resetFields();
          formRef.current?.resetFields();
          reset();
        })}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6">
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
            > </Popconfirm>
          <FormItem control={control} name="contractType" label="Loại hợp đồng">
            {/* <Select>
              {dressTypeList.map((dt) => {
                return (
                  <Select.Option key={dt} value={dt}>
                    {dt}
                  </Select.Option>
                );
              })}
            </Select> */}
            
              <Select
                mode="multiple"
                // allowClear
                // value={contractTypeValue}
                defaultValue={contractTypeValue}
                showSearch
                style={{ width: "100%" }}
                placeholder="Chọn loại hợp đồng"
                options={contractTypeOptions}
                onDeselect={handleDeSelectContract}
                onSelect={handleSelectContract}
              />
          </FormItem>
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
            ></Popconfirm>
          <FormItem
            control={control}
            name="servicesArising"
            label="Danh mục phát sinh"
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
          </FormItem>
          {/* <FormItem control={control} name="dressName" label="Loại váy cưới">
            <Select>
              {dressNameList.map((dr) => {
                return (
                  <Select.Option key={dr} value={dr}>
                    {dr}
                  </Select.Option>
                );
              })}
            </Select>
          </FormItem> */}
          <FormItem control={control} name="status" label="Trạng thái">
            <Select>
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
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6">
          <FormItem control={control} name="userName" label="Tên khách hàng">
            <Input allowClear placeholder="Nhập tên khách hàng" />
          </FormItem>
          <FormItem control={control} name="phone" label="Số điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </FormItem>
          <FormItem control={control} name="address" label="Địa chỉ">
            <Input placeholder="Nhập địa chỉ" />
          </FormItem>
        </div>
        <FormItem control={control} name="contractPrice" label="Giá hợp đồng">
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Nhập giá hợp đồng"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        </FormItem>
        <div className={cn(!isAdmin && "hidden")}>
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
        </div>
        <FormItem
          control={control}
          name="discount"
          label="Tổng discount"
          valuePropName="value"
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Giá discount"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
          />
        </FormItem>
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
              {formatCurrency(`${totalPrice}`)}
            </span>
          </Space>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-6">
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
          <FormItem control={control} name="dueDate" label="Ngày dự kiến">
            <DatePicker
              format={dateFormat}
              placeholder="Vui lòng chọn ngày hoàn thành hợp đồng"
              style={{ width: "100%" }}
            />
          </FormItem>
        </div>
        <div className="py-6">
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
        </div>
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
        <div className="pb-20 ">
          <FormItem control={control} name="notes" label="Ghi chú">
            <Editor />
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
