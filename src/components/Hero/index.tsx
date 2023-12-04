import React from "react";
import CustomCarousel from "../CustomCarousel";
import { Image } from "antd";
import { ImageType } from "../../models/ContractModel";

export default function Hero({ data }: any) {
  const renderCarousel = () => {
    return data?.map((item: ImageType, index: number) => (
      <div key={index} className="h-auto w-full">
        <img
          alt={item?.alt || ""}
          src={item?.url}
          className="w-full h-[300px] object-cover"
        />
      </div>
    ));
  };
  return (
    <>
      <CustomCarousel autoplay>{renderCarousel()}</CustomCarousel>
    </>
  );
}
