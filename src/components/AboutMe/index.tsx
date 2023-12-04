import React from "react";
import CustomCarousel from "../CustomCarousel";
import { AboutMeModalPageModal } from "../../models";

export default function AboutMe({ data }: { data: AboutMeModalPageModal }) {
  return (
    <div className="w-full flex flex-col md:flex-row mt-10 justify-start md:items-center gap-9">
      <div className="max-w-none md:max-w-[36rem]">
        <h1 className="tracking-tight font-bold text-[3.75rem] leading-none text-gray-900">
          {data?.title}
        </h1>
        <p className="max-w-none text-lg mt-6 text-gray-600">{data?.content}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {data?.gallery?.map((item, index) => {
          return (
            <div key={index} className="w-[160px] h-[300px]">
              <img
                src={item?.url}
                alt={item?.alt}
                className="w-full h-full aspect-[2/3] object-cover rounded-xl shadow-xl"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
