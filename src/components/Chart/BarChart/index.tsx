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

let index = 0;
const currentYear = dayjs();

export default function BarChartRevenue() {
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [items, setItems] = useState([`${currentYear}`]);
  const [defaultValue, setDefaultValue] = useState<any>(currentYear);
  const [name, setName] = useState("");
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
  const filteredData = useMemo(() => {
    return ordersData.filter((item) => {
      const itemYear = dayjs(item?.created).year();
      const itemMonth = dayjs(item?.created).month();
      return (
        itemYear === +dayjs(defaultValue).year() &&
        itemMonth === +dayjs(defaultValue).month()
      );
    });
  }, [ordersData, defaultValue]);

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
      if (!result[item.type]) {
        result[item.type] = Array(sortedDays.length).fill(0);
      }
      result[item.type][dataIndex] += parseFloat(item.total);
    }

    return result;
  }, {});

  console.log("datasets", datasets);

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

  useEffect(() => {
    const handleQuery = async () => {
      // const todayStart = dayjs().startOf('day');
      // // const todayEnd = dayjs().endOf('day');
      // const sixDaysAgo = dayjs().subtract(6, 'days').startOf('day');
      const startOfMonth = dayjs(defaultValue).startOf("month");
      const endOfMonth = dayjs(defaultValue).endOf("month");
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

      setOrdersData(data);
    };
    handleQuery();
  }, [defaultValue]);

  const series = Object.keys(datasets).map((type) => ({
    name: type,
    data: datasets[type],
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4>Doanh thu các ngày trong tháng hiện tại</h4>
        <DatePicker
          defaultValue={defaultValue}
          picker="month"
          onChange={(val) => setDefaultValue(val)}
        />
        {/* <Select
          defaultValue={{ value: `${currentYear}`, label: `${currentYear}` }}
          style={{ width: 200 }}
          placeholder="Filter theo năm"
          onChange={handleChange}
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: "8px 0" }} />
              <Space style={{ padding: "0 8px 4px" }}>
                <Tooltip title="Nhập năm">
                  <Input
                    placeholder="Nhập năm"
                    ref={inputRef}
                    value={name}
                    onChange={onNameChange}
                  />
                </Tooltip>
                <Button type="text" icon={<PlusOutlined />} onClick={addItem}>
                  Thêm
                </Button>
              </Space>
            </>
          )}
          options={items.map((item) => ({ label: item, value: item }))}
        /> */}
      </div>
      <Chart options={options} series={series} type="bar" />
    </div>
  );
}
