import { Descriptions } from "antd";
import dayjs from "dayjs";
import { isNil, map, replace } from "lodash";
import React from "react";
import { BsFacebook, BsFillTelephoneFill } from "react-icons/bs";
import { cn } from "../../lib/cs";
import { formatCurrency } from "../../utils";
import Viewer from "../Editor/Viewer";

const ComponentToPrint: React.ForwardRefRenderFunction<HTMLDivElement, any> = (
  props,
  ref
) => {
  const {
    notes = {},
    servicesArisingPrice = "0",
    contractType = [],
    contractPrice = "0",
    discount = "",
    userName = "--",
    phone = "--",
    shootingDate,
    secondPaymentMethod,
    firstPaymentMethod,
    firstDepositPrice = 0,
    firstDepositDate = undefined,
    createDate,
    secondDepositPrice = 0,
    secondDepositDate = undefined,
    servicesArisingItems = [],
    contractPriceItems = [],
  } = props.getValues() || {};
  const renderNotes = () => {
    return <Viewer value={notes?.markdown || ""} />;
  };

  const formattedDate = replace(
    dayjs(createDate).format("DD-MM-YYYY"),
    /-/g,
    ""
  );
  return (
    <>
      <div
        className={cn("roxanatech-print p-6 hidden", props.loading && "block")}
        ref={ref}
      >
        <div className="flash" />
        <div className="roxanatech-introduce bg-black px-4 py-4 mb-4">
          <div className="flex justify-between">
            <img
              src="/marrdoll_studio_logo.jpeg"
              className="h-[90px] w-[120px] object-cover mb-2"
            />
            <p className="uppercase text-xl font-semibold text-white flex flex-col mb-6 justify-end m-0 p-0">
              Hợp đồng online
            </p>
          </div>
          <div className="h-[2px] w-full bg-[#ffffff]" />
          <div className="flex justify-between items-end mt-4">
            <div className="flex flex-col gap-1">
              <p className="text-white p-0 m-0">
                <BsFillTelephoneFill size={12} /> 0706.190.865 - 0388.167.546
              </p>
              <p className="text-white p-0 m-0">
                <BsFacebook size={12} /> FB/MardollStudio
              </p>
              <p className="text-white p-0 m-0 uppercase">
                49 Tú Mỡ - P.Nhơn Bình - TP.Quy Nhơn - Bình Định
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-white text-end p-0 m-0 text-lg">
                Ngày: {dayjs(createDate).format("DD-MM-YYYY")}
              </p>
              <p className="text-white text-end p-0 m-0 text-lg">
                Mã Khách Hàng: {formattedDate}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-between border-b-2 border-solid border-white border-b-teal-500 pb-4">
          <div className="roxanatech-contract-userinfo">
            <p className="uppercase font-semibold text-2xl text-gray-900 m-0 p-0">
              khách hàng
            </p>
            <p className="uppercase font-semibold text-base text-gray-900 m-0 p-0">
              {userName}
            </p>
            <p className="uppercase text-base text-gray-900 m-0 p-0">
              SĐT: {phone}
            </p>
          </div>
          <div className="roxanatech-contract-serviceinfo">
            <p className="uppercase text-end font-semibold text-2xl text-gray-900 m-0 p-0">
              mô tả dịch vụ
            </p>
            {map(contractType, (item) => {
              return (
                <p className="uppercase text-end text-base text-gray-900 m-0 p-0">
                  {item}
                </p>
              );
            })}

            <p className="uppercase text-end text-base text-gray-900 m-0 p-0">
              ngày cưới {dayjs(shootingDate).format("DD-MM-YYYY")}
            </p>
          </div>
        </div>
        <table className="mt-4 bg-white border-collapse w-full">
          <tr>
            <th className="bg-white border text-center px-10 py-4 uppercase">
              MÔ TẢ
            </th>
            <th className="bg-white border text-center px-2 py-4 uppercase">
              SỐ Lượng
            </th>
            <th className="bg-white border text-center py-4 uppercase">
              ĐƠN GIÁ
            </th>
            <th className="bg-white border text-center px-1 py-4 uppercase">
              DISCOUNT
            </th>
            <th className="bg-white border text-center px-2 py-4 uppercase">
              THÀNH TIỀN
            </th>
          </tr>
          {contractPriceItems?.map((item: any, index: number) => {
            return (
              <tr
                key={index}
                className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200"
              >
                <td className="border px-6 py-4">{item?.value}</td>
                <td className="border px-2 py-4 text-center">
                  {item?.quantity}
                </td>
                <td className="border px-2 py-4 text-center">
                  {formatCurrency(`${item?.price}`)}
                </td>
                <td className="border px-2 py-4 text-center">
                  -{formatCurrency(`${item?.discount}`)}
                </td>
                <td className="border px-2 py-4 text-center">
                  {formatCurrency(`${+item?.price * +item?.quantity}`)}
                </td>
              </tr>
            );
          })}
          {servicesArisingItems?.map((item: any, index: number) => {
            return (
              <tr
                key={index}
                className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200"
              >
                <td className="border px-6 py-4">{item?.value}</td>
                <td className="border px-2 py-4 text-center">
                  {item?.quantity}
                </td>
                <td className="border px-2 py-4 text-center">
                  {formatCurrency(`${item?.price}`)}
                </td>
                <td className="border px-2 py-4 text-center">
                  -{formatCurrency(`${item?.discount}`)}
                </td>
                <td className="border px-2 py-4 text-center">
                  {formatCurrency(`${+item?.price * +item?.quantity}`)}
                </td>
              </tr>
            );
          })}
          <tr className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200">
            <td className="border px-8" colSpan={5}>
              <p className="uppercase text-gray-900 font-semibold">Ghi chú:</p>
              {renderNotes()}
            </td>
          </tr>
          <tr className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200">
            <td className="border px-8 py-4" colSpan={2}>
              <span className="uppercase text-gray-900 font-semibold">
                Tổng giảm
              </span>
            </td>
            <td className="border px-8 py-4 text-center" colSpan={3}>
              <span className="uppercase text-gray-900 font-normal">
                -{formatCurrency(`${discount}`)}
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200">
            <td className="border px-8 py-4" colSpan={2}>
              <span className="uppercase text-gray-900 font-semibold">
                Tổng hợp đồng
              </span>
            </td>
            <td className="border px-8 py-4 text-center" colSpan={3}>
              <span className="uppercase text-gray-900 font-normal">
                {formatCurrency(`${+contractPrice + +servicesArisingPrice}`)}
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200">
            <td className="border px-8 py-4" colSpan={2}>
              <span className="uppercase text-gray-900 font-semibold">
                Cọc lần 1
              </span>
            </td>
            <td className="border px-8 py-4 text-center" colSpan={3}>
              <span className="uppercase text-gray-900 font-normal">
                {`${formatCurrency(`${firstDepositPrice}`)} ${
                  formatCurrency(`${firstDepositPrice}`) !== "--"
                    ? `- (${dayjs(firstDepositDate).format("DD.MM.YYYY")})`
                    : ""
                } ${!isNil(firstPaymentMethod) ? firstPaymentMethod : ""}`}
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200">
            <td className="border px-8 py-4" colSpan={2}>
              <span className="uppercase text-gray-900 font-semibold">
                Cọc lần 2
              </span>
            </td>
            <td className="border px-8 py-4 text-center" colSpan={3}>
              <span className="uppercase text-gray-900 font-normal">
                {`${formatCurrency(`${secondDepositPrice}`)} ${
                  formatCurrency(`${secondDepositPrice}`) !== "--"
                    ? `- (${dayjs(secondDepositDate).format("DD-MM-YYYY")})`
                    : ""
                } ${!isNil(secondPaymentMethod) ? secondPaymentMethod : ""}`}
              </span>
            </td>
          </tr>
          <tr className="hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200">
            <td className="border px-8 py-4" colSpan={2}>
              <span className="uppercase text-gray-900 font-semibold">
                Thanh toán còn lại
              </span>
            </td>
            <td className="border px-8 py-4 text-center" colSpan={3}>
              <span className="uppercase text-gray-900 font-normal">
                {formatCurrency(
                  `${
                    +contractPrice +
                    +servicesArisingPrice -
                    (+discount + +firstDepositPrice + +secondDepositPrice)
                  }`
                )}
              </span>
            </td>
          </tr>
        </table>
        <div className="flex ">
          <div className="roxanatech-condition w-1/2">
            <p className="text-base font-semibold text-gray-900 uppercase">
              điều khoản & điều kiện
            </p>
            <div className="flex flex-row ">
              <ul className="p-0 m-0 ml-4">
                <li className="text-sm">
                  Báo giá chưa bao gồm phát sinh di chuyển (nếu có)
                </li>
                <li className="text-sm">
                  Khách hàng mất cọc nếu đơn phương tự hủy hợp đồng với bất cứ
                  lý do nào
                </li>
              </ul>
              <ul className="p-0 m-0 ml-6">
                <li className="text-sm">
                  Báo giá chưa bao gồm phát sinh di chuyển (nếu có)
                </li>
                <li className="text-sm">
                  Khách hàng mất cọc nếu đơn phương tự hủy hợp đồng với bất cứ
                  lý do nào
                </li>
              </ul>
            </div>
          </div>
          <div className="signature w-1/2 h-full">
            <p className="text-base text-gray-900 text-center">
              Vui lòng xác nhận đã nhận được báo giá này
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.forwardRef<HTMLDivElement, any>(ComponentToPrint);
