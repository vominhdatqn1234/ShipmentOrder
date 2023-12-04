import React from "react";
import useWindowSize from "../../hooks/useWindowSize";
import CustomCarousel from "../CustomCarousel";

export default function ComboPriceWedding({ data }: { data: any }) {
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

  const { width } = useWindowSize();
  const isDesktop = width >= 1275;
  const isLaptop = width <= 1275 && width >= 1024;
  const isTablet = width <= 1024 && width >= 768;
  const isMobile = width <= 768 && width >= 360;

  const getRenderSlideCarousel = (numberSlide: number) => {
    let countSlide = numberSlide === 2 ? 1 : 3;

    if (isDesktop) {
      countSlide = numberSlide === 2 ? 2 : numberSlide - 1;
    }
    if (isLaptop) {
      countSlide = numberSlide === 2 ? 1 : numberSlide === 3 ? 2 : 3;
    }
    if (isTablet) {
      countSlide = numberSlide <= 2 ? 1 : 2;
    }
    if (isMobile) {
      countSlide = 1;
    }
    return countSlide;
  };
  const renderCarouselList = () => {
    return data?.map((item: any, index: number) => {
      return (
        <div key={index}>
          <p className="font-bold text-gray-900 text-2xl uppercase my-8">
            {item?.title}
          </p>
          <CustomCarousel
            autoplay
            className="flex flex-row"
            slidesToShow={
              item?.gallery?.length === 1
                ? 1
                : getRenderSlideCarousel(item?.gallery?.length)
            }
          >
            {item?.gallery?.map((gl: any, position: number) => {
              console.log(gl, "gl", position);
              return (
                <div key={position}>
                  <div
                    className="ml-2 overflow-hidden bg-cover rounded-lg cursor-pointer h-60 group"
                    style={{ backgroundImage: `url(${gl?.url})` }}
                  >
                    <div className="overlay">
                      <div className="border-animate">
                        <h2 className="mt-4 text-xl md:text-2xl font-semibold text-white capitalize">
                          {gl?.title}
                        </h2>
                        <p className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-base tracking-wider text-white uppercase ">
                          {gl?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CustomCarousel>
        </div>
      );
    });
  };
  return (
    <div className="w-full bg-white">
      <div className="px-6">
        {renderCarouselList()}
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
