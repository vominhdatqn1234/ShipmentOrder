import { Avatar, Tooltip } from "antd";
import React from "react";
import { colors } from "../../styles/colors";
import { FaDongSign } from "react-icons/fa6";
import { useContract } from "../../pages/Contract/useContract";
import { sumBy } from "lodash";
import { formatCurrency, formatNumber } from "../../utils";

export default function TotalIncome() {
  const { data: contractData } = useContract();
  const totalIncome = sumBy(contractData, (item) => +item.totalPrice - (+item?.discount + +item?.servicesArisingPrice));
  return (
    <div className="bg-[#fb9679] rounded-2xl md:rounded-3xl drop-shadow-lg p-2 md:p-6">
      <div className="flex items-center gap-3">
        <p className="text-white text-xl font-medium">Thu nhập</p>
        <Avatar
          size={40}
          style={{ backgroundColor: colors.secondary }}
          icon={<FaDongSign color="#000000" />}
        />
      </div>
      <Tooltip title={formatCurrency(`${totalIncome}`)} trigger="click">
        <p className="whitespace-nowrap overflow-hidden text-ellipsis text-white text-2xl lg:text-xl font-semibold overflow-hidden">
          {formatCurrency(`${totalIncome}`)}
        </p>
      </Tooltip>

      <p className="text-white opacity-60 text-sm">Doanh thu hàng năm</p>
    </div>
  );
}
