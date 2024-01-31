import { DatePicker } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { isNil, map } from "lodash";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
// import { useOrdersHook } from "./useOrdersHook";
import { useOrderSlice } from "../../../store/useOrderSlice";

type RangeValue = [Dayjs | null, Dayjs | null] | null;
const { RangePicker } = DatePicker;

type RangePickerOrderEmployee = {
  userId: string
}

const RangePickerOrderEmployee: React.FC<RangePickerOrderEmployee> = ({ userId }) => {
  const dateFormat = "DD/MM/YYYY";
  // const [dates, setDates] = useState<RangeValue>(null);
  // const [value, setValue] = useState<RangeValue>(null);
  const [dates] = useState<RangeValue>(null);
  const [value, setValue] = useState<any>(null);
  const { setOrders, setNewTerm, setSearch, setIsLoading } = useOrderSlice();
  
  useEffect(() => {
    if (!isNil(value)) {
      const handleQuery = async () => {
        setIsLoading(true);
        try {
          const todayStart = dayjs(value).startOf("month");
          const todayEnd = dayjs(value).endOf("month");
          const ref = query(
            collection(firestore, "orders"),
            where("createdUser", "==", userId),
            where("created", ">=", todayStart.toISOString()),
            where("created", "<=", todayEnd.toISOString())
          );
          const querySnapshot = await getDocs(ref);
          let data: any = [];
          querySnapshot.forEach((doc) => {
            const mapParentIdProductType = map(doc.data()?.orders, (order) => {
              return {
                ...order,
                orders: doc.data()?.orders,
                parentId: doc.id,
              };
            });
            data.push(...mapParentIdProductType);
          });

          setOrders(data);
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      };
      handleQuery();
    }
  }, [value, userId]);

  return (
    <DatePicker
      // defaultValue={dayjs()}
      // format={dateFormat}
      picker="month"
      onChange={(val: any) => {
        setValue(val);
        setNewTerm('')
        setSearch([])
      }}
    />
  );
};

export default RangePickerOrderEmployee;
