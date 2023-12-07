import { Avatar, Tooltip } from "antd";
import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaDollarSign } from "react-icons/fa";
import { firestore } from "../../lib/firebase";
import { useContract } from "../../pages/Contract/useContract";
import { colors } from "../../styles/colors";

export default function TotalIncome() {
  const { data: contractData } = useContract();
  const [total, setTotal] = useState(0);

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
          {total.toFixed(2)} $
        </p>
      </Tooltip>

      <p className="text-white opacity-60 text-sm">Doanh thu hàng năm</p>
    </div>
  );
}
