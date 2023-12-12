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
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { toast } from "react-toastify";
import { flatMap, map, reduce, sumBy } from "lodash";
import { useUser } from "../../../store/useUser";

let index = 0;
const currentYear = dayjs();

export default function BarChartClient() {
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [ordersMonthData, setOrdersMonthData] = useState<any[]>([]);
  const [items, setItems] = useState([`${currentYear}`]);
  const [defaultValue, setDefaultValue] = useState<any>(currentYear);
  const [defaultValueMonth, setDefaultValueMonth] = useState<any>(currentYear);
  const [name, setName] = useState("");
  const { user } = useUser();
  const inputRef = useRef<InputRef>(null);
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleChange = (value: { value: string; label: React.ReactNode }) => {
    setDefaultValue(+value);
  };

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

  // const filteredMonthData = useMemo(() => {
  //   return flatMap(ordersMonthData, "orders");
  // }, [ordersMonthData]);
  const filteredMonthData = useMemo(() => {
    return flatMap(ordersMonthData, "orders");
  }, [ordersMonthData]);

  //   const filteredMonthData = useMemo(() => {
  //   return flatMap(ordersMonthData, "orders");
  // }, [ordersMonthData]);

  const filteredDataType = useMemo(() => {
    return flatMap(ordersData, "orders");
  }, [ordersData]);

  // Lấy danh sách tháng từ dữ liệu lọc
  // const uniqueMonths = Array.from(
  //   new Set(
  //     filteredData.map((item) => {
  //       // return dayjs(item.createDate).month() + 1
  //       return item.created.substring(5, 7);
  //     })
  //   )
  // );

  const uniqueMonths = Array.from(
    new Set(
      filteredData.map((item) => {
        return dayjs(item.created).format("DD/MM");
      })
    )
  );

  const uniqueOrderMonths = Array.from(
    new Set(
      filteredMonthData.map((item) => {
        // return dayjs(item.createDate).month() + 1
        // return item.created.substring(5, 7);
        // return `${dayjs(item.created).month() + 1}` as any;
        return `${dayjs(item.created).format("DD/MM")}` as any;
      })
    )
  );

  // Sắp xếp danh sách tháng theo thứ tự
  const sortedOrderMonths = uniqueOrderMonths.sort((a, b) => a - b);

  // Tạo danh sách labels từ danh sách tháng
  const labelsMonth = sortedOrderMonths.map((month) => `${month}`);
  const datasetsMonth = ordersMonthData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = `${dayjs(item.created).month() + 1}`;
    const formatDay = dayjs(item.created).format("DD/MM");
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
      result[item.name][dataIndex] += +total;
    }

    return result;
  }, {});

  const datasetsQuantityMonth = ordersMonthData.reduce((result: any, item) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = item.created.substring(5, 7);
    // const itemMonth = `${dayjs(item.created).month() + 1}`;
    const formatDay = dayjs(item.created).format("DD/MM");
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
      result[item.name][dataIndex] += +total;
    }

    return result;
  }, {});

  const datasetQuantityMonthTypes = filteredMonthData.reduce(
    (result: any, item: any) => {
      // const itemMonth = item.created.substring(5, 7);

      // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
      // const itemMonth = item.created.substring(5, 7);
      // const itemMonth = item.created.substring(5, 7);
      // const itemMonth = `${dayjs(item.created).month() + 1}`;
      const formatDay = dayjs(item.created).format("DD/MM");
      // const itemMonth = dayjs(item.createDate).month() + 1;
      const dataIndex = sortedOrderMonths.indexOf(formatDay);
      // const formatDay = dayjs(item.created).format("DD/MM");
      //   const dataIndex = sortedDays.indexOf(formatDay);
      // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
      // console.log("tttt", dayjs(item.created).format("DD/MM"));
      // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

      if (dataIndex !== -1) {
        if (!result[item.type]) {
          result[item.type] = Array(sortedOrderMonths.length).fill(0);
        }
        result[item.type][dataIndex] += +item?.refund;
      }

      return result;
    },
    {}
  );
  const datasetTypesPaymentMonth = filteredMonthData.reduce(
    (result: any, item: any) => {
      // const itemMonth = item.created.substring(5, 7);

      // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
      // const itemMonth = item.created.substring(5, 7);
      // const itemMonth = item.created.substring(5, 7);
      const itemMonth = `${dayjs(item.created).month() + 1}`;
      // const itemMonth = dayjs(item.createDate).month() + 1;
      const dataIndex = sortedOrderMonths.indexOf(itemMonth);
      // const formatDay = dayjs(item.created).format("DD/MM");
      //   const dataIndex = sortedDays.indexOf(formatDay);
      // const dataIndex = sortedDays.indexOf(`${itemDay}/${itemMonth}`);
      // console.log("tttt", dayjs(item.created).format("DD/MM"));
      // console.log("sortedDays", sortedDays, dataIndex, `${itemDay}/${itemMonth}`);

      if (dataIndex !== -1) {
        if (!result[item.type]) {
          result[item.type] = Array(sortedOrderMonths.length).fill(0);
        }
        result[item.type][dataIndex] += parseFloat(item?.payment || 0);
      }

      return result;
    },
    {}
  );
  const datasetTypesUnPaidMonth = ordersMonthData.reduce(
    (result: any, item: any) => {
      // const itemMonth = item.created.substring(5, 7);

      // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
      // const itemMonth = item.created.substring(5, 7);
      // const itemMonth = item.created.substring(5, 7);
      const formatDay = dayjs(item.created).format("DD/MM");
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

  const sortedDays = uniqueMonths.sort((a, b) => +a - +b);
  const labels = sortedDays.map((day) => `${day}`);

  // console.log('uniqueMonths', labelsss, )

  // Sắp xếp danh sách tháng theo thứ tự
  // const sortedMonths = uniqueMonths.sort((a, b) => a - b);

  // Tạo danh sách labels từ danh sách tháng
  // const labels = sortedMonths.map((month) => `Tháng ${month}`);

  // Tạo datasets với tổng giá trị cho từng tháng
  const datasets = filteredDataType.reduce((result: any, item) => {
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

      result[item.type][dataIndex] += parseFloat(item?.total || 0);
    }

    return result;
  }, {});

  const datasetTypes = ordersMonthData.reduce((result: any, item: any) => {
    // const itemMonth = item.created.substring(5, 7);

    // const itemDay = dayjs(item.created).toISOString().substring(8, 10);
    // const itemMonth = item.created.substring(5, 7);
    const formatDay = dayjs(item.created).format("DD/MM");
    const dataIndex = sortedOrderMonths.indexOf(formatDay);
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
  }, {});
  const datasetTypesPayment = filteredDataType.reduce(
    (result: any, item: any) => {
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

        result[item.type][dataIndex] += parseFloat(item?.payment || 0);
      }

      return result;
    },
    {}
  );
  const datasetTypesUnPaid = filteredDataType.reduce(
    (result: any, item: any) => {
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

        result[item.type][dataIndex] +=
          parseFloat(item?.total || 0) -
          (parseFloat(item?.payment || 0) + parseFloat(item?.refund || 0));
      }

      return result;
    },
    {}
  );

  const datasetQuantityTypes = filteredDataType.reduce(
    (result: any, item: any) => {
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
        result[item.type][dataIndex] += +item?.quantity;
      }

      return result;
    },
    {}
  );

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

  const optionTypes = {
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
          return `refund ${parseFloat(val).toFixed(2)} $`;
        },
      },
    },
  };

  const optionsPayment = {
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
          return `pay ${parseFloat(val).toFixed(2)} $`;
        },
      },
    },
  };
  const optionsUnPaid = {
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
          return `unpaid ${parseFloat(val).toFixed(2)} $`;
        },
      },
    },
  };

  const optionQuantityTypes = {
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
        text: "SL",
      },
      labels: {
        formatter: function (value: any) {
          return `${parseInt(value).toFixed(0)}`;
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
          return `Số lượng: ${val}`;
        },
      },
    },
  };
  const optionQuantityMonthTypes = {
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
          return `${parseInt(value).toFixed(0)}`;
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
          return `refund : ${val} $`;
        },
      },
    },
  };
  const optionPaymentMonthTypes = {
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
          return `${parseInt(value).toFixed(0)}`;
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
          return `pay : ${val} $`;
        },
      },
    },
  };
  const optionUnPaidMonthTypes = {
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
          return `${parseInt(value).toFixed(0)}`;
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
          return `unpaid : ${val} $`;
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
  //       where("createdUser", "==", user?.id),
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
        where("createdUser", "==", user?.id),
        where("created", ">=", startOfMonth.toISOString()),
        where("created", "<=", endOfMonth.toISOString())
      );
      console.log('endOfMonth', user?.id)

      const querySnapshot = await getDocs(ref);
      let data: any = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setOrdersMonthData(data);
    };
    handleQuery();
  }, [defaultValueMonth]);

  const series = Object.keys(datasets).map((type) => {
    return {
      name: type,
      // name: "Total",
      data: datasets[type],
    };
  });
  const seriesType = Object.keys(datasetTypes).map((type) => {
    return {
      name: "Total refund",
      data: datasetTypes[type],
    };
  });
  const seriesTypePayment = Object.keys(datasetTypesPayment).map((type) => {
    return {
      name: type,
      data: datasetTypesPayment[type],
    };
  });
  const seriesTypePaymentMonth = Object.keys(datasetTypesPaymentMonth).map(
    (type) => {
      return {
        name: type,
        data: datasetTypesPaymentMonth[type],
      };
    }
  );
  const seriesTypeUnPaidMonth = Object.keys(datasetTypesUnPaidMonth).map(
    (type) => {
      return {
        name: type,
        data: datasetTypesUnPaidMonth[type],
      };
    }
  );
  const seriesTypeUnPaid = Object.keys(datasetTypesUnPaid).map((type) => {
    return {
      name: type,
      data: datasetTypesUnPaid[type],
    };
  });
  const seriesQuantityType = Object.keys(datasetQuantityTypes).map((type) => {
    return {
      name: type,
      data: datasetQuantityTypes[type],
    };
  });

  const seriesMonth = Object.keys(datasetsMonth).map((type) => {
    return {
      name: "Total",
      data: datasetsMonth[type],
    };
  });
  const seriesQuantityMonth = Object.keys(datasetsQuantityMonth).map((type) => {
    return {
      name: "Total",
      data: datasetsQuantityMonth[type],
    };
  });
  // const seriesQuantityMonth = Object.keys(datasetQuantityMonthTypes).map(
  //   (type) => {
  //     return {
  //       name: type,
  //       data: datasetQuantityMonthTypes[type],
  //     };
  //   }
  // );

  const optionsTotal = {
    labels: ["Tổng Order"],
    colors: ["#00e396"],
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
                    .reduce((a: any, b: any) => a + b, 0).toFixed?.(2)
                )
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

  const optionsQuantityTotal = {
    labels: ["Tổng số lượng"],
    colors: ["#31733a"],
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
              label: "Total Quantity",
              formatter: function (w: any) {
                return (
                  w.globals.seriesTotals
                    .reduce((a: any, b: any) => a + b, 0).toFixed?.(2)
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
          return `${val?.toFixed?.(2)}`;
        },
      },
    },
  };

  const optionsTotalRefund = {
    labels: ["Tổng Refund"],
    colors: ["#75631d"],
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
                    .reduce((a: any, b: any) => a + b, 0).toFixed?.(2)
                )
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
    labels: ["Tổng Unpaid"],
    colors: ["#6ca5a5"],
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
                    .reduce((a: any, b: any) => a + b, 0).toFixed?.(2)
                )
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

  return (
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
        <h4>Tổng tiền đơn hàng trong tháng</h4>
        <DatePicker
          picker="month"
          defaultValue={defaultValueMonth}
          onChange={(val) => setDefaultValueMonth(val)}
        />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Chart options={optionsMonth} series={seriesMonth} type="bar" height="280" />
        {/* <Chart
          options={optionQuantityMonthTypes}
          series={seriesQuantityMonth}
          type="bar"
        /> */}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="">
          <h4>Tổng tiền hoá đơn trong tháng</h4>
          <Chart
            options={optionsTotal as any}
            series={[
              sumBy(
                seriesMonth[0]?.data,
                (item) => +`${parseFloat(`${item || 0}`).toFixed(2)}`
              ),
            ]}
            type="donut"
            height="280"
          />
        </div>
        <div className="">
          <h4>Tổng số lương hoá đơn trong tháng</h4>
          <Chart
            options={optionsQuantityTotal as any}
            series={[
              sumBy(
                seriesQuantityMonth[0]?.data,
                (item) => +`${parseFloat(`${item || 0}`).toFixed(2)}`
              ),
            ]}
            type="donut"
            height="280"
          />
        </div>
        <div className="">
          <h4>Tổng tiền refund trong tháng</h4>
          <Chart
            options={optionsTotalRefund as any}
            series={[
              sumBy(
                seriesType[0]?.data,
                (item) => +`${parseFloat(`${item || 0}`).toFixed(2)}`
              ),
            ]}
            type="donut"
            height="280"
          />
        </div>
        <div className="">
          <h4>Tổng tiền chưa thanh toán trong tháng</h4>
          <Chart
            options={optionsTotalUnPaid as any}
            series={[
              sumBy(
                seriesTypeUnPaidMonth[0]?.data,
                (item) => +`${parseFloat(`${item || 0}`).toFixed(2)}`
              ),
            ]}
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
  );
}
