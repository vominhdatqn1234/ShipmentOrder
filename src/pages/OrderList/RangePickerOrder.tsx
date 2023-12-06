import { DatePicker } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { isNil } from "lodash";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import { useOrdersHook } from "./useOrdersHook";
import { useOrderSlice } from "../../store/useOrderSlice";

type RangeValue = [Dayjs | null, Dayjs | null] | null;
const { RangePicker } = DatePicker;

const RangePickerOrder: React.FC = () => {
  const dateFormat = "DD/MM/YYYY";
  const defaultStartDate = dayjs().subtract(1, "month");
  const [dates, setDates] = useState<RangeValue>(null);
  const [value, setValue] = useState<RangeValue>(null);
    const { setOrders } = useOrderSlice()
  const onOpenChange = (open: boolean) => {
    if (open) {
      setDates([null, null]);
    } else {
      setDates(null);
    }
  };
  useEffect(() => {
    if (isNil(dates) && value?.length === 2) {
      const handleQuery = async () => {
        const ref = query(
          collection(firestore, "orders"),
          where("created", ">=", dayjs(value[0]).toISOString()),
          where("created", "<=", dayjs(value[1]).toISOString())
        );
        const querySnapshot = await getDocs(ref);
        let data: any = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setOrders(data)
      };
      handleQuery();
    }
  }, [value, dates]);

  return (
    <RangePicker
      defaultValue={[defaultStartDate, dayjs()]}
      format={dateFormat}
      onCalendarChange={(val) => {
        setDates(val);
      }}
      onChange={(val) => {
        setValue(val);
      }}
      onOpenChange={onOpenChange}
      changeOnBlur
    />
  );
};

export default RangePickerOrder;
