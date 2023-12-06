import { Avatar, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { colors } from "../../styles/colors";
import { FaDongSign } from "react-icons/fa6";
import { useContract } from "../../pages/Contract/useContract";
import { sumBy } from "lodash";
import { formatCurrency, formatNumber } from "../../utils";
import { collection, getDocs, query } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import { FaDollarSign } from "react-icons/fa";

export default function TotalIncome() {
  const { data: contractData } = useContract();
  const [total, setTotal] = useState(0);
  const totalIncome = sumBy(
    contractData,
    (item) => +item.totalPrice - (+item?.discount + +item?.servicesArisingPrice)
  );
  useEffect(() => {
    const handleQuery = async () => {
      const ref = query(collection(firestore, "orders"));
      const querySnapshot = await getDocs(ref);
      let total = 0;
      querySnapshot.forEach((doc) => {
        total += parseFloat(doc.data()["total"]);
      });
      setTotal(total);
    };
    handleQuery();
  }, []);
  return (
    <div className="bg-[#fb9679] rounded-2xl md:rounded-3xl drop-shadow-lg p-2 md:p-6">
      <div className="flex items-center gap-3">
        <p className="text-white text-xl font-medium">Doanh thu</p>
        <Avatar
          size={40}
          style={{ backgroundColor: colors.secondary }}
          icon={<FaDollarSign color="#000000" />}
        />
      </div>
      <Tooltip title={`${total} $`} trigger="click">
        <p className="whitespace-nowrap text-ellipsis text-white text-2xl lg:text-xl font-semibold overflow-hidden">
          {total} $
        </p>
      </Tooltip>

      <p className="text-white opacity-60 text-sm">Doanh thu hàng năm</p>
    </div>
  );
}
