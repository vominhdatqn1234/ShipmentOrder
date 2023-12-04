import React, { useState } from "react";
import { PriceWeddingType } from "../../models/ServicePageModel";
import useWindowSize from "../../hooks/useWindowSize";
import CustomCarousel from "../CustomCarousel";

export default function PriceWedding({ data }: { data: PriceWeddingType }) {
  const fakeRetailWeddingDress = [
    {
      name: "ruby",
      image:
        "https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "35000000",
      fromPrice: "9000000",
      toPrice: "15000000",
    },
    {
      name: "luxury",
      image:
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "13500000",
      fromPrice: "15000000",
      toPrice: "35000000",
    },
    {
      name: "Limited",
      image:
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "13000000",
      fromPrice: "35000000",
      toPrice: "55000000",
    },
    {
      name: "Limited",
      image:
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "13000000",
      fromPrice: "35000000",
      toPrice: "55000000",
    },
    {
      name: "Premium",
      image:
        "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1600",
      price: "7500000",
      fromPrice: "65000000",
      toPrice: "90000000",
    },
  ];
  const fakeWedding = [
    {
      name: "Ruby",
      image:
        "https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "30000000",
    },
    {
      name: "Luxary",
      image:
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "35000000",
    },
    {
      name: "Ren Wedding",
      image:
        "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "45000000",
    },
    {
      name: "Premium",
      image:
        "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=1600",
      price: "7500000",
    },
    {
      name: "Tiết kiệm",
      image:
        "https://images.pexels.com/photos/3342697/pexels-photo-3342697.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      price: "20000000",
    },
  ];

  const [isPreviewVisible, setPreviewVisible] = useState<number | null>(null);
  const { width } = useWindowSize();
  const isDesktop = width >= 1280;
  const isLaptop = width <= 1024;
  const isTablet = width <= 768;
  const isMobile = width <= 640;

  const getRenderSlideCarousel = () => {
    let countSlide = 3;
    if (isDesktop) {
      countSlide = 4;
    }
    if (isLaptop) {
      countSlide = 3;
    }
    if (isTablet) {
      countSlide = 2;
    }
    if (isMobile) {
      countSlide = 1;
    }
    return countSlide;
  };
  return (
    <div className="w-full bg-white">
      {/* <div className="bg-center bg-cover h-[25rem] md:h-[52rem] bg-[url('https://firebasestorage.googleapis.com/v0/b/mardoll-studio.appspot.com/o/bang-gia-background.jpeg?alt=media&token=d98fc0f6-77a5-407e-83a3-2d6e1c2b39a5')]"> */}
      <div
        className="bg-center bg-cover h-[25rem] md:h-[52rem]"
        style={{ backgroundImage: `url(${data?.background?.[0]?.url})` }}
      >
        <div className="flex items-center justify-center w-full h-full bg-gray-900/40">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white lg:text-6xl uppercase">
              {data?.title}
            </h1>
            <p className="text-2xl lg:text-3xl text-white font-serif font-normal mt-4">
              {data?.subTitle}
            </p>
          </div>
        </div>
      </div>
      <div className="px-6">
        {/* <p className="font-bold text-gray-900 text-2xl uppercase my-8">
          GÓI THUÊ VÁY CƯỚI COMBO
        </p> */}
        {/* <CustomCarousel
                autoplay
                slidesToScroll={1}
                slidesToShow={getRenderSlideCarousel()}
              >
                {data.length > 0 &&
                  data.map((item: any, index) => {
                    return (
                      <div key={index}>
                        <Image
                          src={item?.image}
                          preview={{
                            src: isPreviewVisible
                              ? fakeRetailWeddingDress[isPreviewVisible].image
                              : item?.image,
                            visible: isPreviewVisible === index,
                            onVisibleChange: (visible, prevVisible) =>
                              setPreviewVisible(null),
                          }}
                          style={{ display: "none" }}
                        />
                        <div
                          onClick={() => setPreviewVisible(index)}
                          className="ml-2 overflow-hidden bg-cover rounded-lg cursor-pointer h-60 group"
                          style={{ backgroundImage: `url(${item.image})` }}
                        >
                          <div className="overlay">
                            <div className="border-animate">
                              <h2 className="mt-4 text-xl md:text-2xl font-semibold text-white capitalize">
                                {item?.name}
                              </h2>
                              <p className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-base tracking-wider text-white uppercase ">
                                {formatCurrency(item?.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </CustomCarousel>
              <p className="font-bold text-gray-900 text-2xl uppercase mt-8 mb-4">
                GÓI THUÊ VÁY CƯỚI LẺ
              </p>
              <CustomCarousel
                autoplay
                slidesToScroll={1}
                slidesToShow={getRenderSlideCarousel()}
              >
                {fakeRetailWeddingDress.length > 0 &&
                  fakeRetailWeddingDress.map((item: any, index) => {
                    return (
                      <div key={index}>
                        <Image
                          src={item?.image}
                          preview={{
                            src: isPreviewVisible
                              ? fakeRetailWeddingDress[isPreviewVisible].image
                              : item?.image,
                            visible: isPreviewVisible === index,
                            onVisibleChange: (visible, prevVisible) =>
                              setPreviewVisible(null),
                          }}
                          style={{ display: "none" }}
                        />
                        <div
                          onClick={() => setPreviewVisible(index)}
                          className="ml-2 overflow-hidden bg-cover rounded-lg cursor-pointer h-60 group"
                          style={{ backgroundImage: `url(${item.image})` }}
                        >
                          <div className="overlay">
                            <div className="border-animate">
                              <h2 className="mt-4 text-xl md:text-2xl font-semibold text-white capitalize">
                                {item?.name}
                              </h2>
                              <p className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-sm md:text-base tracking-wider text-white uppercase ">
                                {formatCurrency(item?.fromPrice)} -{" "}
                                {formatCurrency(item?.toPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </CustomCarousel>
              <p className="font-bold text-gray-900 text-2xl uppercase mt-8 mb-4">
                GÓI NGÀY CƯỚI
              </p>
              <CustomCarousel
                autoplay
                slidesToScroll={1}
                slidesToShow={getRenderSlideCarousel()}
              >
                {fakeWedding.length > 0 &&
                  fakeWedding.map((item: any, index) => {
                    return (
                      <div key={index}>
                        <Image
                          src={item?.image}
                          preview={{
                            src: isPreviewVisible
                              ? fakeWedding[isPreviewVisible].image
                              : item?.image,
                            visible: isPreviewVisible === index,
                            onVisibleChange: (visible, prevVisible) =>
                              setPreviewVisible(null),
                          }}
                          style={{ display: "none" }}
                        />
                        <div
                          onClick={() => setPreviewVisible(index)}
                          className="ml-2 overflow-hidden bg-cover rounded-lg cursor-pointer h-60 group"
                          style={{ backgroundImage: `url(${item.image})` }}
                        >
                          <div className="overlay">
                            <div className="border-animate">
                              <h2 className="mt-4 text-xl md:text-2xl font-semibold text-white capitalize">
                                {item?.name}
                              </h2>
                              <p className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-sm md:text-base tracking-wider text-white uppercase ">
                                {formatCurrency(item?.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </CustomCarousel> */}
      </div>
    </div>
  );
}
