import React from "react";
import ServiceItem from "../../Services/ServiceItem";
import { ServiceModal } from "../../../models";
import { cn } from "../../../lib/cs";

export default function PreWeddingDay({ data }: { data: ServiceModal[] }) {
  // const data = [
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Phim trường",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "[Album] Phim trường",
  //     description:
  //       "Ngoài việc lựa chọn váy cưới thì với mỗi cô dâu lớp trang điểm cũng vô cùng quan trọng.",
  //   },
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Victor Vũ",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "[Album] Victor Vũ",
  //     description:
  //       "Luôn dẫn đầu với những concept ảnh cưới ấn tượng, các nhiếp ảnh gia của Mardoll Studio.",
  //   },
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Victor Vũ",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "Chụp ảnh cưới phim trường",
  //     description:
  //       "Phóng sự cưới nơi cảm xúc và những khoảnh khắc thiêng liêng được lưu giữ trọn vẹn.",
  //   },
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Victor Vũ",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "Áo cưới",
  //     description:
  //       "Mardoll Studio luôn mang đến những chiếc váy cưới vô cùng đắt giá để nàng tỏa sáng, lộng lẫy nơi lễ đường.",
  //   },
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Victor Vũ",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "[Album] Victor Vũ",
  //     description:
  //       "Luôn dẫn đầu với những concept ảnh cưới ấn tượng, các nhiếp ảnh gia của Mardoll Studio.",
  //   },
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Victor Vũ",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "Chụp ảnh cưới phim trường",
  //     description:
  //       "Phóng sự cưới nơi cảm xúc và những khoảnh khắc thiêng liêng được lưu giữ trọn vẹn.",
  //   },
  //   {
  //     // image: [
  //     //   {
  //     //     id: "1",
  //     //     name: "[Album] Phim trường",
  //     //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     //   },
  //     // ],
  //     url: "https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     gallery: [
  //       {
  //         id: "1",
  //         name: "[Album] Victor Vũ",
  //         url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  //       },
  //     ],
  //     alt: "",
  //     title: "Áo cưới",
  //     description:
  //       "Mardoll Studio luôn mang đến những chiếc váy cưới vô cùng đắt giá để nàng tỏa sáng, lộng lẫy nơi lễ đường.",
  //   },
  // ];
  const renderServices = () => {
    return data?.map((item: ServiceModal, index: number) => (
      <ServiceItem key={`album-${index}`} {...item} />
    ));
  };
  const gridColumnNumber: any = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4",
        gridColumnNumber[data?.length] ?? "lg:grid-cols-1"
      )}
    >
      {renderServices()}
    </div>
  );
}
