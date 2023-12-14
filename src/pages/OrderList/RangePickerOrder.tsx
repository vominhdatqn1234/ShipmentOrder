import { DatePicker } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { isNil, map } from "lodash";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import { useOrdersHook } from "./useOrdersHook";
import { useOrderSlice } from "../../store/useOrderSlice";

type RangeValue = [Dayjs | null, Dayjs | null] | null;
const { RangePicker } = DatePicker;

const RangePickerOrder: React.FC = () => {
  const dateFormat = "DD/MM/YYYY";
  const defaultStartDate = dayjs().subtract(1, "week");
  const disabledDate = (current: any) => {
    return (
      current && (current < dayjs().subtract(7, "day") || current > dayjs())
    );
  };
  // const [dates, setDates] = useState<RangeValue>(null);
  // const [value, setValue] = useState<RangeValue>(null);
  const [dates, setDates] = useState<RangeValue>(null);
  const [value, setValue] = useState<any>(null);
  const { setOrders, setNewTerm, setSearch } = useOrderSlice();
  // const onOpenChange = (open: boolean) => {
  //   if (open) {
  //     setDates([null, null]);
  //   } else {
  //     setDates(null);
  //   }
  // };
  useEffect(() => {
    if (!isNil(value)) {
      const handleQuery = async () => {
        // setIsLoading(true);
        try {
          const todayStart = dayjs(value).startOf("day");
          const todayEnd = dayjs(value).endOf("day");
          const ref = query(
            collection(firestore, "orders"),
            // where("created", ">=", dayjs(value[0]).toISOString()),
            // where("created", "<=", dayjs(value[1]).toISOString())
            // where("created", ">=", dayjs(value).toISOString()),
            // where("created", "<", dayjs(value).add(1, "day").toISOString())
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
            // console.log("mapParentIdProductType", mapParentIdProductType);
            data.push(...mapParentIdProductType);
            // data.push({ id: doc.id, ...doc.data() });
          });

          setOrders(data);
        } catch (error) {
        } finally {
          // setIsLoading(false);
        }
      };
      handleQuery();
    }
  }, [value]);

  return (
    // <RangePicker
    //   disabledDate={disabledDate}
    //   defaultValue={[defaultStartDate, dayjs()]}
    //   format={dateFormat}
    //   onCalendarChange={(val) => {
    //     setDates(val);
    //   }}
    //   onChange={(val) => {
    //     setValue(val);
    //   }}
    //   onOpenChange={onOpenChange}
    //   changeOnBlur
    // />
    <DatePicker
      defaultValue={dayjs()}
      format={dateFormat}
      onChange={(val: any) => {
        setValue(val);
        setNewTerm('')
        setSearch([])
      }}
    />

    //   <DatePicker
    //   format={dateFormat}
    //   onChange={(val: any) => {
    //     setValue(val);
    //   }}
    //   onOpenChange={onOpenChange}
    //   changeOnBlur
    // />
  );
};

export default RangePickerOrder;
