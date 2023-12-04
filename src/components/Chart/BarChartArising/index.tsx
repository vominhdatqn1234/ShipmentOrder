import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { PlusOutlined } from "@ant-design/icons";
import { formatCurrency, formatNumber } from "../../../utils";
import { Button, Divider, Input, InputRef, Select, Space, Tooltip } from "antd";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { toast } from "react-toastify";

let index = 0;
const currentYear = dayjs().year();

export default function BarChartArising() {
  const [contractData, setContractData] = useState<any[]>([]);
  const [items, setItems] = useState([`${currentYear}`]);
  const [defaultValue, setDefaultValue] = useState<number>(currentYear);
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
    return contractData.filter((item) => {
      const itemYear = dayjs(item?.dueDate).year();
      return itemYear === +defaultValue && item.status === "complete";
    });
  }, [contractData, defaultValue]);

  // Lấy danh sách tháng từ dữ liệu lọc
  const uniqueMonths = Array.from(
    new Set(
      filteredData.map((item) => {
        // return dayjs(item.createDate).month() + 1
        return item.dueDate.substring(5, 7);
      })
    )
  );

  // Sắp xếp danh sách tháng theo thứ tự
  const sortedMonths = uniqueMonths.sort((a, b) => a - b);

  // Tạo danh sách labels từ danh sách tháng
  const labels = sortedMonths.map((month) => `Tháng ${month}`);

  // Tạo datasets với tổng giá trị cho từng tháng
  const datasets = filteredData.reduce((result: any, item) => {
    const itemMonth = item.dueDate.substring(5, 7);
    // const itemMonth = dayjs(item.createDate).month() + 1;
    const dataIndex = sortedMonths.indexOf(itemMonth);

    if (dataIndex !== -1) {
      if (!result[item.contractType]) {
        result[item.contractType] = Array(sortedMonths.length).fill(0);
      }

      result[item.contractType][dataIndex] += +item.servicesArisingPrice;
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
        text: "VNĐ",
      },
      labels: {
        formatter: function (value: any) {
          return formatNumber(+value);
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
          return formatCurrency(`${val}`);
        },
      },
    },
  };

  useEffect(() => {
    const handleQuery = async () => {
      const ref = query(
        collection(firestore, "contract"),
        where(
          "createDate",
          ">=",
          dayjs(`${+defaultValue}-01-01`).toISOString()
        ),
        where(
          "createDate",
          "<",
          dayjs(`${+defaultValue + 1}-01-01`).toISOString()
        )
      );
      const querySnapshot = await getDocs(ref);
      let data: any = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setContractData(data);
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
        <h4>Chi phí phát sinh tháng trong năm</h4>
        <Select
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
        />
      </div>
      <Chart options={options} series={series} type="bar" />
    </div>
  );
}
