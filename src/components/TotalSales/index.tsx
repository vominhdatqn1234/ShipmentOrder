import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { colors } from "../../styles/colors";
import { Divider, Select, SelectProps } from "antd";
import dayjs from "dayjs";
import { useContract } from "../../pages/Contract/useContract";
import { findIndex, groupBy, keys, map, sumBy } from "lodash";
import { formatCurrency } from "../../utils";
import { collection, getDocs, query } from "firebase/firestore";
import { firestore } from "../../lib/firebase";

export default function TotalSales() {
  const currentYear = `${dayjs().year()}`;
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [defaultYear, setDefaultYear] = useState<string>(currentYear);

  useEffect(() => {
    const handleQuery = async () => {
      const ref = query(collection(firestore, "orders"));
      const querySnapshot = await getDocs(ref);
      let data: any = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      setOrdersData(data);
    };
    handleQuery();
  }, []);

  const groupedData = groupBy(ordersData, (item) =>
    item.created.substring(0, 4)
  );
  const labels = keys(groupedData);

  const seriesTotalSales = map(groupedData, (yearData) =>
    sumBy(yearData, (item) => +`${parseFloat(item.total)}`)
  );

  const handleChange = (value: SelectProps["onChange"]) => {
    setDefaultYear(`${value}`);
  };

  const optionsTotalSales = {
    labels,
    colors: [colors.primary, "#feb01a", "#00e396"],
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
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      y: {
        formatter: function (val: any) {
          return `${val} $`;
        },
      },
    },
  };

  return (
    <>
      <div className="flex justify-between items-center px-6">
        <h3>Tổng doanh thu</h3>
        <Select
          style={{ width: 120 }}
          defaultValue={currentYear as any}
          onChange={handleChange}
          options={map(labels, (value) => ({ value, label: value }))}
        />
      </div>
      <Divider style={{ marginTop: 8 }} />
      <div className="flex justify-between items-center px-6">
        <p className="text-base text-[rgb(119,126,137)]">Doanh thu hàng năm</p>
        <h2 className="text-xl font-bold leading-3">
          {
            +seriesTotalSales?.[
              findIndex(labels, (e) => e === defaultYear)
            ] as any
          }{" "}
          $
        </h2>
      </div>
      <div className="flex items-center justify-center">
        <Chart
          options={optionsTotalSales as any}
          series={seriesTotalSales}
          type="donut"
          height="280"
        />
      </div>
    </>
  );
}
