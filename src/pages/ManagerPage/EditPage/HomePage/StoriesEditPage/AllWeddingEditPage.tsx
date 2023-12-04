import { Tabs, TabsProps } from "antd";
import PreWeddingEditPage from "./PreWeddingEditPage/index";
import WeddingEditPage from "./WeddingEditPage/index";

export default function AllWeddingEditPage({
  data,
  handleCancel,
  refetch,
}: {
  data: any;
  handleCancel: () => void;
  refetch: () => void;
}) {
  console.log("datadata", data);
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "PRE WEDDING",
      children: (
        <PreWeddingEditPage
          data={data}
          refetch={refetch}
          handleCancel={handleCancel}
        />
      ),
    },
    {
      key: "2",
      label: "PHÓNG SỰ CƯỚI",
      children: (
        <WeddingEditPage
          data={data}
          refetch={refetch}
          handleCancel={handleCancel}
        />
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" centered items={items} />;
}
