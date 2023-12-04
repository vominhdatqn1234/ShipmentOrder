import { CarouselProps, CarouselRef } from "antd/es/carousel";
import React, { useRef } from "react";
import { Button, Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { colors } from "../../styles/colors";

interface CustomCarouselProps extends CarouselProps {}

export default function CustomCarousel({
  children,
  ...others
}: CustomCarouselProps) {
  const carouselRef = useRef<CarouselRef>(null);
  const handleNextPage = () => {
    carouselRef.current?.next();
  };
  const handlePrevPage = () => {
    carouselRef.current?.prev();
  };
  return (
    <div className="relative w-full">
      <Carousel autoplay ref={carouselRef} {...others}>
        {children}
      </Carousel>
      <div className="absolute left-6 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Button
          onClick={handlePrevPage}
          shape="circle"
          icon={<LeftOutlined size={32} color={colors.primary} />}
        ></Button>
      </div>
      <div className="absolute -right-[16px] top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Button
          onClick={handleNextPage}
          shape="circle"
          icon={<RightOutlined color={colors.primary} size={32} />}
        ></Button>
      </div>
    </div>
  );
}
