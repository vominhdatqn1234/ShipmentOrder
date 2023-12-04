import React, { useState } from "react";
import { AlbumPhotoType } from "../../models/ServicePageModel";
import { Divider, Image } from "antd";
import { map } from "lodash";

export default function WeddingAlbum({ data }: { data: AlbumPhotoType }) {
  const [visible, setVisible] = useState(false);
  const handleShowPreviewGroup = () => setVisible(true);
  return (
    <div>
      <div
        className="bg-center bg-cover h-[25rem] md:h-[42rem]"
        style={{
          backgroundImage: `url(${data?.background?.[0]?.url})`,
        }}
      >
        <div className="flex items-center justify-center w-full h-full bg-gray-900/40">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white lg:text-6xl uppercase">
              {data?.title}
            </h1>
            <p className="text-2xl lg:text-3xl text-white font-serif font-normal mt-4 uppercase">
              {data?.subTitle}
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 md:px-24 flex flex-col items-center justify-center mt-6">
        <p className="font-semibold text-2xl uppercase text-gray-900">
          {data?.content}
        </p>
        <span className="text-base font-sans my-4">{data?.subContent}</span>
        <Divider />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 w-full">
          {data?.gallery?.map((item, index) => {
            return (
              <Image.PreviewGroup
                key={index}
                items={map(item?.gallery, "url")}
                preview={{
                  visible,
                  onVisibleChange: (value) => {
                    setVisible(value);
                  },
                }}
              >
                <div
                  onClick={handleShowPreviewGroup}
                  className="overflow-hidden bg-cover bg-center rounded-lg cursor-pointer h-60 group"
                  style={{ backgroundImage: `url(${item?.url})` }}
                >
                  <div className="overlay" onClick={handleShowPreviewGroup}>
                    <div className="border-animate">
                      <h2 className="mt-4 text-xl md:text-2xl text-center font-semibold text-white capitalize">
                        {item?.title}
                      </h2>
                    </div>
                  </div>
                </div>
              </Image.PreviewGroup>
            );
          })}
        </div>
        <p className="font-semibold text-2xl uppercase text-gray-900 my-8">
          VIDEO FILM
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-6">
          <div className="relative overflow-hidden pt-[56.25%] w-full h-full">
            <iframe
              title="Video film facebook"
              className="absolute w-full h-full border-0 left-0 top-0"
              src={data?.videoOne}
              allow="encrypted-media"
              allowFullScreen
            />
          </div>
          <div className="relative overflow-hidden pt-[56.25%] w-full h-full">
            {/* <iframe
              title="Video film facebook"
              src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FMardollStudio%2Fvideos%2F218799524186281&width=1600&show_text=false&appId=626080131062806&height=900"
              width="1600"
              height="900"
              className="absolute w-full h-full border-0 left-0 top-0"
              // className="h-full w-full absolute left-0 top-0"
              // scrolling="no"
              // allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              // allowFullScreen
            /> */}
            <iframe
              title="Video film facebook"
              className="absolute w-full h-full border-0 left-0 top-0"
              src={data?.videoOne}
              allow="encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
