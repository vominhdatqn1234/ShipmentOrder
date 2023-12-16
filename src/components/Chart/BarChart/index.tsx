import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { PlusOutlined } from "@ant-design/icons";
import { formatCurrency, formatNumber } from "../../../utils";
import {
  Button,
  DatePicker,
  Divider,
  Input,
  InputRef,
  Select,
  Space,
  Tooltip,
} from "antd";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { toast } from "react-toastify";
import {
  find,
  flatMap,
  groupBy,
  isEmpty,
  keys,
  map,
  reduce,
  sumBy,
} from "lodash";
import { colors } from "../../../styles/colors";
import { useRevenue } from "./useRevenue";
import { useRevenueSlice } from "../../../store/useRevenue";

let index = 0;
const currentYear = dayjs();

export default function BarChartRevenue() {
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [ordersMonthData, setOrdersMonthData] = useState<any[]>([]);
  const [items, setItems] = useState([`${currentYear}`]);
  const [defaultValue, setDefaultValue] = useState<any>(currentYear);
  const [defaultValueMonth, setDefaultValueMonth] = useState<any>(currentYear);
  const [name, setName] = useState("");
  const inputRef = useRef<InputRef>(null);
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleChange = (value: { value: string; label: React.ReactNode }) => {
    setDefaultValue(+value);
  };
  useRevenue();
  const { revenue } = useRevenueSlice();

  const addItem = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    e.preventDefault();
    if (!items.includes(name)) {
      setItems((prev) => [...prev, name || `New item ${index++}`]);
      setName("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return;
    }
    toast.error(
      "Số năm đã tồn tại trọng danh sách vui lòng nhập số năm khác !",
      {
        position: toast.POSITION.TOP_RIGHT,
      }
    );
  };
  // Lọc dữ liệu chỉ trong năm 2023
  // const filteredData = useMemo(() => {
  //   return ordersData.filter((item) => {
  //     const itemYear = dayjs(item?.created).year();
  //     const itemMonth = dayjs(item?.created).month();
  //     return (
  //       itemYear === +dayjs(defaultValue).year() &&
  //       itemMonth === +dayjs(defaultValue).month()
  //     );
  //   });
  // }, [ordersData, defaultValue]);

  const filteredData = useMemo(() => {
    return ordersData;
  }, [ordersData]);

  const filteredMonthData = useMemo(() => {
    return ordersMonthData;
  }, [ordersMonthData]);

  const filteredTypeData = useMemo(() => {
    return flatMap(ordersData, "orders");
  }, [ordersData]);

  const filteredTypeMonthData = useMemo(() => {
    return flatMap(ordersMonthData, "orders");
  }, [ordersMonthData]);

  // Lấy danh sách tháng từ dữ liệu lọc
  const uniqueMonths = Array.from(
    new Set(
      ordersMonthData.map((item) => {
        // return dayjs(item.createDate).month() + 1
        return dayjs(item.created).format("DD/MM") as any;
      })
    )
  );
  // const uniqueOrderMonths = Array.from(
  //   new Set(
  //     filteredMonthData.map((item) => {
  //       // return dayjs(item.createDate).month() + 1
  //       // return item.created.substring(5, 7);
  //       return `${dayjs(item.created).month() + 1}` as any;
  //     })
  //   )
  // );

  const sortedOrderMonths = uniqueMonths.sort((a, b) => a - b);
  const labelsMonth = sortedOrderMonths.map((month) => `${month}`);
  const datasetsMonth = ordersMonthData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = `${dayjs(item.created).month() + 1}`;
    const formatDay = dayjs(item.created).format("DD/MM");
    // const itemMonth = dayjs(item.created).format("DD/MM/YYYY").substring(5, 7);
    // const itemMonth = dayjs(item.createDate).month() + 1;
    const dataIndex = sortedOrderMonths.indexOf(formatDay);
    // const formatDay = dayjs(item.created).format("DD/MM");
    //   const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedOrderMonths.length).fill(0);
      }
      const total = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el?.total || 0);
          return res;
        },
        0
      );
      // const totalRefund = reduce(
      //   item.orders,
      //   (res, el) => {
      //     res += parseFloat(el?.refund || 0);
      //     return res;
      //   },
      //   0
      // );
      result[item.name][dataIndex] += total;
    }

    return result;
  }, {});

  const datasetsQuantityMonth = ordersMonthData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = `${dayjs(item.created).month() + 1}`;
    const formatDay = dayjs(item.created).format("DD/MM");
    // const itemMonth = dayjs(item.created).format("DD/MM/YYYY").substring(5, 7);
    // const itemMonth = dayjs(item.createDate).month() + 1;
    const dataIndex = sortedOrderMonths.indexOf(formatDay);
    // const formatDay = dayjs(item.created).format("DD/MM");
    //   const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedOrderMonths.length).fill(0);
      }
      const total = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el?.quantity || 0);
          return res;
        },
        0
      );
      // const totalRefund = reduce(
      //   item.orders,
      //   (res, el) => {
      //     res += parseFloat(el?.refund || 0);
      //     return res;
      //   },
      //   0
      // );
      result[item.name][dataIndex] += total;
    }

    return result;
  }, {});

  const datasetsTypeMonth = ordersMonthData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedOrderMonths.indexOf(formatDay);
    // const itemMonth = dayjs(item.createDate).month() + 1;
    // const formatDay = dayjs(item.created).format("DD/MM");
    //   const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedOrderMonths.length).fill(0);
      }
      // const total = reduce(
      //   item.orders,
      //   (res, el) => {
      //     res += parseFloat(el.total);
      //     return res;
      //   },
      //   0
      // );
      const totalRefund = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el?.refund || 0);
          return res;
        },
        0
      );
      result[item.name][dataIndex] += totalRefund;
    }

    return result;
  }, {});

  // const uniqueMonths = Array.from(
  //   new Set(
  //     filteredData.map((item) => {
  //       return dayjs(item.created).format("DD/MM");
  //     })
  //   )
  // );
  // console.log('uniqueMonths', uniqueDaysOnly)

  const sortedDays = uniqueMonths.sort((a, b) => +a - +b);
  const labels = sortedDays.map((day) => `${day}`);

  // console.log('uniqueMonths', labelsss, )

  // Sắp xếp danh sách tháng theo thứ tự
  // const sortedMonths = uniqueMonths.sort((a, b) => a - b);

  // Tạo danh sách labels từ danh sách tháng
  // const labels = sortedMonths.map((month) => `Tháng ${month}`);

  // Tạo datasets với tổng giá trị cho từng tháng
  const datasets = filteredData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedDays.length).fill(0);
      }
      const total = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el.total);
          return res;
        },
        0
      );
      // const totalRefund = reduce(
      //   item.orders,
      //   (res, el) => {
      //     res += parseFloat(el?.refund || 0);
      //     return res;
      //   },
      //   0
      // );
      result[item.name][dataIndex] += total;
    }

    return result;
  }, {});

  const datasetsPayment = filteredData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedDays.length).fill(0);
      }
      const total = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el.payment || 0);
          return res;
        },
        0
      );
      result[item.name][dataIndex] += total;
    }

    return result;
  }, {});
  const datasetsUnPaid = filteredData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedDays.length).fill(0);
      }
      const total = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el.total || 0);
          return res;
        },
        0
      );
      const totalRefund = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el.refund || 0);
          return res;
        },
        0
      );
      const totalPayment = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el.payment || 0);
          return res;
        },
        0
      );
      result[item.name][dataIndex] += +total - (+totalPayment + +totalRefund);
    }

    return result;
  }, {});

  const datasetsEmployeeMonthPayment = filteredMonthData.reduce(
    (result: any, item) => {
      // const itemMonth = item.created.substring(5, 7);

      // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
      // const itemMonth = item.created.substring(5, 7);
      const itemMonth = `${dayjs(item.created).month() + 1}`;
      // const itemMonth = dayjs(item.createDate).month() + 1;
      const dataIndex = sortedOrderMonths.indexOf(itemMonth);
      // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
      // console.log("tttt", dayjs(item.created).format("DD/MM"));
      // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

      if (dataIndex !== -1) {
        if (!result[item.name]) {
          result[item.name] = Array(sortedOrderMonths.length).fill(0);
        }
        const totalPayment = reduce(
          item.orders,
          (res, el) => {
            res += parseFloat(el?.payment || 0);
            return res;
          },
          0
        );

        result[item.name][dataIndex] += totalPayment;
      }

      return result;
    },
    {}
  );
  const datasetsEmployeeMonthUnPaid = ordersMonthData.reduce(
    (result: any, item) => {
      // const itemMonth = item.created.substring(5, 7);

      // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
      // const itemMonth = item.created.substring(5, 7);
      // const itemMonth = `${dayjs(item.created).month() + 1}`;
      // // const itemMonth = dayjs(item.createDate).month() + 1;
      // const dataIndex = sortedOrderMonths.indexOf(itemMonth);
      const formatDay = dayjs(item.created).format("DD/MM");
      const dataIndex = sortedDays.indexOf(formatDay);
      // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
      // console.log("tttt", dayjs(item.created).format("DD/MM"));
      // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

      if (dataIndex !== -1) {
        if (!result[item.name]) {
          result[item.name] = Array(sortedOrderMonths.length).fill(0);
        }
        const total = reduce(
          item.orders,
          (res, el) => {
            res += parseFloat(el?.total || 0);
            return res;
          },
          0
        );
        const totalRefund = reduce(
          item.orders,
          (res, el) => {
            res += parseFloat(el?.refund || 0);
            return res;
          },
          0
        );
        const totalPayment = reduce(
          item.orders,
          (res, el) => {
            res += parseFloat(el?.payment || 0);
            return res;
          },
          0
        );

        result[item.name][dataIndex] += +total - (+totalPayment + +totalRefund);
      }

      return result;
    },
    {}
  );

  const datasetsEmployeeRefund = filteredData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.name]) {
        result[item.name] = Array(sortedDays.length).fill(0);
      }
      const totalRefund = reduce(
        item.orders,
        (res, el) => {
          res += parseFloat(el?.refund || 0);
          return res;
        },
        0
      );
      result[item.name][dataIndex] += totalRefund;
    }

    return result;
  }, {});

  const datasetsEmployeeMonthRefund = ordersMonthData.reduce(
    (result: any, item) => {
      // const itemMonth = item.created.substring(5, 7);

      // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
      // const itemMonth = item.created.substring(5, 7);
      // const itemMonth = `${dayjs(item.created).month() + 1}`;
      // // const itemMonth = dayjs(item.createDate).month() + 1;
      // const dataIndex = sortedOrderMonths.indexOf(itemMonth);
      const formatDay = dayjs(item.created).format("DD/MM");
      const dataIndex = sortedDays.indexOf(formatDay);
      // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
      // console.log("tttt", dayjs(item.created).format("DD/MM"));
      // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

      if (dataIndex !== -1) {
        if (!result[item.name]) {
          result[item.name] = Array(sortedOrderMonths.length).fill(0);
        }
        const totalRefund = reduce(
          item.orders,
          (res, el) => {
            res += parseFloat(el?.refund || 0);
            return res;
          },
          0
        );

        result[item.name][dataIndex] += totalRefund;
      }

      return result;
    },
    {}
  );

  const datasetsType = filteredTypeData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedDays.indexOf(formatDay);
    // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
    // console.log("tttt", dayjs(item.created).format("DD/MM"));
    // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

    if (dataIndex !== -1) {
      if (!result[item.type]) {
        result[item.type] = Array(sortedDays.length).fill(0);
      }
      // const totalRefund = reduce(
      //   item.orders,
      //   (res, el) => {
      //     res += parseFloat(el?.refund || 0);
      //     return res;
      //   },
      //   0
      // );
      result[item.type][dataIndex] += +item?.total;
    }

    return result;
  }, {});

  const options = {
    chart: {
      stacked: true,
    },
    plotOptions: {
      bar: {
        // borderRadius: 8,
        horizontal: false,
        columnWidth: "55%",
        // endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: labels,
    },
    yaxis: {
      title: {
        text: "Dollar",
      },
      labels: {
        formatter: function (value: any) {
          return `${parseFloat(value)}`;
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function (val: any) {
          return `${parseFloat(val).toFixed(2)} $`;
        },
      },
    },
  };
  const optionsMonth = {
    chart: {
      stacked: true,
    },
    plotOptions: {
      bar: {
        // borderRadius: 8,
        horizontal: false,
        columnWidth: "55%",
        // endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: labelsMonth,
    },
    yaxis: {
      title: {
        text: "Dollar",
      },
      labels: {
        formatter: function (value: any) {
          return `${parseFloat(value)}`;
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function (val: any) {
          return `${parseFloat(val).toFixed(2)} $`;
        },
      },
    },
  };

  // useEffect(() => {
  //   const handleQuery = async () => {
  //     const todayStart = dayjs(defaultValue).startOf("day");
  //     const todayEnd = dayjs(defaultValue).endOf("day");
  //     // const sixDaysAgo = dayjs().subtract(6, 'days').startOf('day');
  //     // const startOfMonth = dayjs(defaultValue).startOf("month");
  //     // const endOfMonth = dayjs(defaultValue).endOf("month");
  //     const ref = query(
  //       collection(firestore, "orders"),
  //       where("created", ">=", todayStart.toISOString()),
  //       where("created", "<=", todayEnd.toISOString())
  //     );
  //     const querySnapshot = await getDocs(ref);
  //     let data: any = [];
  //     querySnapshot.forEach((doc) => {
  //       data.push({ id: doc.id, ...doc.data() });
  //     });
  //     setOrdersData(data);
  //   };
  //   handleQuery();
  // }, [defaultValue]);

  useEffect(() => {
    const handleQuery = async () => {
      // const sixDaysAgo = dayjs().subtract(6, 'days').startOf('day');
      const startOfMonth = dayjs(defaultValueMonth).startOf("month");
      const endOfMonth = dayjs(defaultValueMonth).endOf("month");
      const ref = query(
        collection(firestore, "orders"),
        where("created", ">=", startOfMonth.toISOString()),
        where("created", "<=", endOfMonth.toISOString())
      );
      const querySnapshot = await getDocs(ref);
      let data: any = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setOrdersMonthData(data);
    };
    handleQuery();
  }, [defaultValueMonth]);

  const series = Object.keys(datasets).map((type) => ({
    name: type,
    data: datasets[type],
  }));
  const seriesPayment = Object.keys(datasetsPayment).map((type) => ({
    name: type,
    data: datasetsPayment[type],
  }));
  const seriesUnPaid = Object.keys(datasetsUnPaid).map((type) => ({
    name: type,
    data: datasetsUnPaid[type],
  }));
  const seriesPaymentMonth = Object.keys(datasetsEmployeeMonthPayment).map(
    (type) => ({
      name: type,
      data: datasetsEmployeeMonthPayment[type],
    })
  );
  const seriesUnPaidMonth = Object.keys(datasetsEmployeeMonthUnPaid).map(
    (type) => ({
      name: type,
      data: datasetsEmployeeMonthUnPaid[type],
    })
  );
  const seriresEmployee = Object.keys(datasetsEmployeeRefund).map((type) => ({
    name: type,
    data: datasetsEmployeeRefund[type],
  }));

  const seriresEmployeeMonth = Object.keys(datasetsEmployeeMonthRefund).map(
    (type) => ({
      name: type,
      data: datasetsEmployeeMonthRefund[type],
    })
  );

  const seriesMonth = Object.keys(datasetsMonth).map((type) => {
    return {
      name: type,
      data: datasetsMonth[type],
    };
  });
  const seriesQuantityMonth = Object.keys(datasetsQuantityMonth).map((type) => {
    return {
      name: type,
      data: datasetsQuantityMonth[type],
    };
  });

  const seriresType = Object.keys(datasetsType).map((type) => {
    return {
      name: type,
      data: datasetsType[type],
    };
  });

  const seriresTypeMonth = Object.keys(datasetsTypeMonth).map((type) => {
    return {
      name: type,
      data: datasetsTypeMonth[type],
    };
  });

  const groupedData = groupBy(seriesMonth, (item) => item.name);
  const labelsTotal = keys(groupedData);
  const groupedRefundData = groupBy(seriresEmployeeMonth, (item) => item.name);
  const labelsRefundTotal = keys(groupedRefundData);
  const groupedUnPaidData = groupBy(seriesUnPaidMonth, (item) => item.name);
  const labelsUnPaidTotal = keys(groupedUnPaidData);
  const groupedUnQuantityData = groupBy(
    seriesQuantityMonth,
    (item) => item.name
  );
  const labelsQuantityTotal = keys(groupedUnQuantityData);

  const seriesTotal = map(seriesMonth, (item, index) => {
    if (item.name === labelsTotal[index]) {
      return reduce(
        item.data,
        (rel, val) => {
          return (rel += val);
        },
        0
      );
    }
    return 0;
  });
  const isExistExpense = find(revenue, {
    month: dayjs(defaultValueMonth).month() + 1,
    year: dayjs(defaultValueMonth).year(),
  });
  const seriesTotalRevenue =
    reduce(
      seriesTotal,
      (rel, item) => {
        return (rel += item);
      },
      0
    ) - parseFloat(`${isExistExpense?.expense || 0}`);

  const seriesRefundTotal = map(seriresEmployeeMonth, (item, index) => {
    if (item.name === labelsRefundTotal[index]) {
      return reduce(
        item.data,
        (rel, val) => {
          return (rel += val);
        },
        0
      );
    }
    return 0;
  });
  const seriesUnPaidTotal = map(seriesUnPaidMonth, (item, index) => {
    if (item.name === labelsUnPaidTotal[index]) {
      return reduce(
        item.data,
        (rel, val) => {
          return (rel += val);
        },
        0
      );
    }
    return 0;
  });
  const seriesQuantityTotal = map(seriesQuantityMonth, (item, index) => {
    if (item.name === labelsQuantityTotal[index]) {
      return reduce(
        item.data,
        (rel, val) => {
          return (rel += val);
        },
        0
      );
    }
    return 0;
  });

  const optionsQuantityTotal = {
    labels: labelsQuantityTotal,
    colors: [
      colors.primary,
      "#feb01a",
      "#00e396",
      "#ff0000",
      "#1677ff",
      "#eb2f96",
      "#6ca5a5",
      "#b414e5",
      "#75631d",
      "#1d5c75",
      "#31733a",
      "#503e57",
    ],
    chart: {
      width: 380,
      height: 280,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: "DM sans",
    },
    dataLabels: {
      enabled: true,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 240,
          },
          legend: {
            show: true,
          },
        },
      },
    ],
    legend: {
      position: "right",
      offsetY: 0,
      height: 230,
    },
    plotOptions: {
      pie: {
        customScale: 0.8, // Adjust the size of the donut
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Quantity",
              formatter: function (w: any) {
                return w.globals.seriesTotals
                  .reduce((a: any, b: any) => a + b, 0)
                  .toFixed?.(2);
              },
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      y: {
        formatter: function (val: any) {
          return `${val?.toFixed?.(2)}`;
        },
      },
    },
  };

  const optionsTotal = {
    labels: labelsTotal,
    colors: [
      colors.primary,
      "#feb01a",
      "#00e396",
      "#ff0000",
      "#1677ff",
      "#eb2f96",
      "#6ca5a5",
      "#b414e5",
      "#75631d",
      "#1d5c75",
      "#31733a",
      "#503e57",
    ],
    chart: {
      width: 380,
      height: 280,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: "DM sans",
    },
    dataLabels: {
      enabled: true,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 240,
          },
          legend: {
            show: true,
          },
        },
      },
    ],
    legend: {
      position: "right",
      offsetY: 0,
      height: 230,
    },
    plotOptions: {
      pie: {
        customScale: 0.8, // Adjust the size of the donut
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: function (w: any) {
                return (
                  w.globals.seriesTotals
                    .reduce((a: any, b: any) => a + b, 0)
                    .toFixed(2) + " $"
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      y: {
        formatter: function (val: any) {
          return `${val?.toFixed?.(2)} $`;
        },
      },
    },
  };

  const optionsTotalRevenue = {
    labels: ["Total Revenue"],
    colors: ["#75631d"],
    chart: {
      width: 380,
      height: 280,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: "DM sans",
    },
    dataLabels: {
      enabled: true,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 240,
          },
          legend: {
            show: true,
          },
        },
      },
    ],
    legend: {
      position: "right",
      offsetY: 0,
      height: 230,
    },
    plotOptions: {
      pie: {
        customScale: 0.8, // Adjust the size of the donut
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Revenue",
              formatter: function (w: any) {
                return (
                  w.globals.seriesTotals
                    .reduce((a: any, b: any) => a + b, 0)
                    .toFixed(2) + " $"
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      y: {
        formatter: function (val: any) {
          return `${val?.toFixed?.(2)} $`;
        },
      },
    },
  };

  const optionsTotalRefund = {
    labels: labelsRefundTotal,
    colors: [
      colors.primary,
      "#feb01a",
      "#00e396",
      "#ff0000",
      "#1677ff",
      "#eb2f96",
      "#6ca5a5",
      "#b414e5",
      "#75631d",
      "#1d5c75",
      "#31733a",
      "#503e57",
    ],
    // chart: {
    //     height: 280,
    //     type: 'donut',
    //     foreColor: '#adb0bb',
    //     fontFamily: 'DM sans',
    // },
    chart: {
      width: 380,
      height: 280,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: "DM sans",
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 240,
          },
          legend: {
            show: false,
          },
        },
      },
    ],
    legend: {
      position: "right",
      offsetY: 0,
      height: 230,
    },
    plotOptions: {
      pie: {
        customScale: 0.8, // Adjust the size of the donut
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: function (w: any) {
                return (
                  w.globals.seriesTotals
                    .reduce((a: any, b: any) => a + b, 0)
                    .toFixed(2) + " $"
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      y: {
        formatter: function (val: any) {
          return `${val?.toFixed?.(2)} $`;
        },
      },
    },
  };
  const optionsTotalUnPaid = {
    labels: labelsUnPaidTotal,
    colors: [
      colors.primary,
      "#feb01a",
      "#00e396",
      "#ff0000",
      "#1677ff",
      "#eb2f96",
      "#6ca5a5",
      "#b414e5",
      "#75631d",
      "#1d5c75",
      "#31733a",
      "#503e57",
    ],
    chart: {
      width: 380,
      height: 280,
      type: "donut",
      foreColor: "#adb0bb",
      fontFamily: "DM sans",
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 240,
          },
          legend: {
            show: false,
          },
        },
      },
    ],
    legend: {
      position: "right",
      offsetY: 0,
      height: 230,
    },
    plotOptions: {
      pie: {
        customScale: 0.8, // Adjust the size of the donut
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: function (w: any) {
                return (
                  w.globals.seriesTotals
                    .reduce((a: any, b: any) => a + b, 0)
                    .toFixed(2) + " $"
                );
              },
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      y: {
        formatter: function (val: any) {
          return `${val?.toFixed?.(2)} $`;
        },
      },
    },
  };

  // console.log('groupedData', labelsGroupp, map(seriesMonth, (item, index) => {
  //   if (item.name === labelsGroupp[index]) {
  //     return reduce(item.data, (rel, val) => {
  //       return rel += val
  //     }, 0)
  //   }
  //   return 0
  //   // return
  // }))

  // const seriesTotalSales = map(datasetsTypeMonth, (yearData) => );
  //   console.log('datasetsTypeMonth', groupedData)

  return (
    <>
      <div>
        {/* <div className="flex items-center justify-between">
        <h4>
          Tổng tiền đơn hàng, tổng refund, tổng đã và chưa thanh toán trong ngày
        </h4>
        <DatePicker
          defaultValue={defaultValue}
          picker="date"
          onChange={(val) => setDefaultValue(val)}
        />
      </div> */}

        {/* <div className="grid grid-cols-2">
        <Chart options={options} series={series} type="bar" />
        <Chart options={optionTypes} series={seriesType} type="bar" />
      </div>
      <div className="grid grid-cols-2">
        <Chart options={optionsPayment} series={seriesTypePayment} type="bar" />
        <Chart options={optionsUnPaid} series={seriesTypeUnPaid} type="bar" />
      </div> */}

        <div className="flex items-center justify-between">
          <h4>Tổng tiền đơn hàng các ngày trong tháng</h4>
          <DatePicker
            picker="month"
            defaultValue={defaultValueMonth}
            onChange={(val) => setDefaultValueMonth(val)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Chart
            options={optionsMonth}
            series={seriesMonth}
            type="bar"
            height="280"
          />
          {/* <Chart
          options={optionQuantityMonthTypes}
          series={seriesQuantityMonth}
          type="bar"
        /> */}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="">
            <h4>Tổng thu nhâp hoá đơn trong tháng</h4>
            <Chart
              options={optionsTotalRevenue as any}
              series={[seriesTotalRevenue]}
              type="donut"
              height="280"
            />
          </div>
          <div className="">
            <h4>Tổng tiền hoá đơn trong tháng</h4>
            <Chart
              options={optionsTotal as any}
              series={seriesTotal}
              type="donut"
              height="280"
            />
          </div>
          <div className="">
            <h4>Tổng số lượng hoá đơn trong tháng</h4>
            <Chart
              options={optionsQuantityTotal as any}
              series={seriesQuantityTotal}
              type="donut"
              height="280"
            />
          </div>
          <div className="">
            <h4>Tổng tiền refund trong tháng</h4>
            <Chart
              options={optionsTotalRefund as any}
              series={seriesRefundTotal}
              type="donut"
              height="280"
            />
          </div>
          <div className="">
            <h4>Tổng tiền chưa thanh toán trong tháng</h4>
            <Chart
              options={optionsTotalUnPaid as any}
              series={seriesUnPaidTotal}
              type="donut"
              height="280"
            />
          </div>
        </div>

        {/* <div className="grid grid-cols-2 gap-2">
        <Chart
          options={optionPaymentMonthTypes}
          series={seriesTypePaymentMonth}
          type="bar"
        />
        <Chart
          options={optionUnPaidMonthTypes}
          series={seriesTypeUnPaidMonth}
          type="bar"
        />
      </div> */}
      </div>
    </>
    // <div>
    //   <div className="grid grid-cols-2 gap-4">
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Doanh thu nhân viên trong ngày</h4>
    //         <DatePicker
    //           defaultValue={defaultValue}
    //           picker="date"
    //           onChange={(val) => setDefaultValue(val)}
    //         />
    //       </div>
    //       <Chart options={options} series={series} type="bar" />
    //     </div>
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Doanh thu nhân viên trong tháng</h4>
    //         <DatePicker
    //           defaultValue={defaultValueMonth}
    //           picker="month"
    //           onChange={(val) => setDefaultValueMonth(val)}
    //         />
    //       </div>
    //       <Chart options={optionsMonth} series={seriesMonth} type="bar" />
    //     </div>
    //   </div>

    //   <div className="grid grid-cols-2 gap-4">
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Doanh thu loại sản phẩm trong ngày</h4>
    //       </div>
    //       <Chart options={options} series={seriresType} type="bar" />
    //     </div>
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Doanh thu loại sản phẩm trong tháng</h4>
    //       </div>
    //       <Chart options={optionsMonth} series={seriresTypeMonth} type="bar" />
    //     </div>
    //   </div>

    //   <div className="grid grid-cols-2 gap-4">
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Tổng refund nhân viên trong ngày</h4>
    //       </div>
    //       <Chart options={options} series={seriresEmployee} type="bar" />
    //     </div>
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Tổng refund nhân viên trong tháng</h4>
    //       </div>
    //       <Chart
    //         options={optionsMonth}
    //         series={seriresEmployeeMonth}
    //         type="bar"
    //       />
    //     </div>
    //   </div>
    //   <div className="grid grid-cols-2 gap-4">
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Tổng tiền nhân viên đã thanh toán trong ngày</h4>
    //       </div>
    //       <Chart options={options} series={seriesPayment} type="bar" />
    //     </div>
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Tổng tiền nhân viên đã thanh toán trong tháng</h4>
    //       </div>
    //       <Chart
    //         options={optionsMonth}
    //         series={seriesPaymentMonth}
    //         type="bar"
    //       />
    //     </div>
    //   </div>
    //   <div className="grid grid-cols-2 gap-4">
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Tổng tiền còn lại chưa thanh toán trong ngày</h4>
    //       </div>
    //       <Chart options={options} series={seriesUnPaid} type="bar" />
    //     </div>
    //     <div>
    //       <div className="flex items-center justify-between">
    //         <h4>Tổng tiền còn lại chưa thanh toán trong tháng</h4>
    //       </div>
    //       <Chart options={optionsMonth} series={seriesUnPaidMonth} type="bar" />
    //     </div>
    //   </div>
    // </div>
  );
}
