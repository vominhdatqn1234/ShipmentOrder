import React from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import PreWeddingDay from "./PreWeddingDay";
import WeddingDay from "./WeddingDay";
import { StoriesType } from "../../models/HomePageModal";

export default function Stories({ stories }: { stories: StoriesType }) {
  // const items: TabsProps["items"] = [
  //   {
  //     key: "1",
  //     label: "PRE WEDDING",
  //     children: <PreWeddingDay data={stories?.preWedding || []} />,
  //   },
  //   {
  //     key: "2",
  //     label: "PHÓNG SỰ CƯỚI",
  //     children: <WeddingDay data={stories?.wedding || []} />,
  //   },
  // ];

  return (
    <div className="py-16 bg-white text-center px-5">
      <h2 data-aos="fade-down" className="leading-8 uppercase font-dmserif">
        {stories?.title}
      </h2>
      <div className="w-24 border-t border-gray-500 mx-auto text-center divide-x mt-3" />
      <div className="w-full flex flex-col items-center my-5 font-sans">
        <p
          data-aos="fade-up"
          className="max-w-screen-sm font-medium md:font-lighttext-gray-700 md:text-[#464646] italic"
        >
          {stories?.content}
        </p>
      </div>
      {/* <Tabs defaultActiveKey="1" centered items={items} /> */}
    </div>
  );
}
