import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { colors } from "../../../styles/colors";
import { useContract } from "../../../pages/Contract/useContract";
import dayjs from "dayjs";
import { groupBy, keys, map, sumBy } from "lodash";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { formatCurrency, formatNumber } from "../../../utils";
import { Avatar } from "antd";
import { FiShoppingBag } from "react-icons/fi";

export default function AreaChart() {
  const currentYear = dayjs().year();
  const [contractData, setContractData] = useState<any[]>([]);
  const [defaultValue, setDefaultValue] = useState<number>(currentYear);

  const filteredData = useMemo(() => {
    return contractData.filter((item) => {
      const itemYear = dayjs(item.createDate).year();
      return itemYear === +currentYear && item.status === "complete";
    });
  }, [contractData, currentYear]);
  const groupedData = groupBy(filteredData, (item) =>
    item.createDate.substring(5, 7)
  );
  const labels = keys(groupedData);

  const seriestotalsales = map(groupedData, (yearData) =>
    sumBy(yearData, (item) => +item.totalPrice)
  );

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

  const options = {
    labels: labels,
    grid: {
      show: true,
      borderColor: "transparent",
      strokeDashArray: 2,
      padding: {
        left: 0,
        right: 0,
        bottom: 0,
      },
    },
    colors: [colors.primary],
    chart: {
      toolbar: {
        show: false,
      },
      foreColor: "#adb0bb",
      fontFamily: "'DM Sans',sans-serif",
      sparkline: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 0,
    },
    legend: {
      show: false,
    },
    stroke: {
      show: true,
      width: 2,
      curve: "smooth",
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
  const series = [
    {
      name: "Monthly Sales",
      data: seriestotalsales,
    },
  ];
  const total = sumBy(seriestotalsales);
  return (
    <div className="bg-white rounded-2xl md:rounded-3xl drop-shadow-lg overflow-hidden flex flex-col justify-between">
      <div className="flex gap-3 items-center px-3 md:px-6 md:mt-6">
        <div>
          <p>Tháng Sales</p>
          <p>{formatNumber(total)}</p>
        </div>
        <Avatar
          size={40}
          style={{ backgroundColor: colors.primary }}
          icon={<FiShoppingBag />}
        />
      </div>
      <Chart
        options={options as any}
        series={series}
        type="area"
        height="90px"
      />
    </div>
  );
}
