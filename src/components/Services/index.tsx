// import React from "react";
// import ServiceItem from "./ServiceItem";
// import { ServiceModal } from "../../models";

// export default function Services({ services }: { services: ServiceModal[] }) {
//   const data = [
//     {
//       image: [
//         {
//           id: "1",
//           name: "Trang điểm",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       gallery: [
//         {
//           id: "1",
//           name: "Trang diem",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       alt: "",
//       title: "Trang điểm",
//       description:
//         "Ngoài việc lựa chọn váy cưới thì với mỗi cô dâu lớp trang điểm cũng vô cùng quan trọng.",
//     },
//     {
//       image: [
//         {
//           id: "2",
//           name: "Trang điểm",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       gallery: [
//         {
//           id: "2",
//           name: "Trang diem",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       alt: "",
//       title: "Trước ngày cưới",
//       description:
//         "Luôn dẫn đầu với những concept ảnh cưới ấn tượng, các nhiếp ảnh gia của Mardoll Studio.",
//     },
//     {
//       image: [
//         {
//           id: "3",
//           name: "Trang điểm",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       gallery: [
//         {
//           id: "3",
//           name: "Trang diem",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       alt: "",
//       title: "Ngày cưới",
//       description:
//         "Phóng sự cưới nơi cảm xúc và những khoảnh khắc thiêng liêng được lưu giữ trọn vẹn.",
//     },
//     {
//       image: [
//         {
//           id: "4",
//           name: "Trang điểm",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       gallery: [
//         {
//           id: "4",
//           name: "Trang diem",
//           url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//         },
//       ],
//       alt: "",
//       title: "Áo cưới",
//       description:
//         "Mardoll Studio luôn mang đến những chiếc váy cưới vô cùng đắt giá để nàng tỏa sáng, lộng lẫy nơi lễ đường.",
//     },
//   ];
//   const renderServices = () => {
//     return services?.map((item: ServiceModal, index: number) => (
//       <ServiceItem key={index} showDescription btnShowMore {...item} />
//     ));
//   };
//   return (
//     <div className="flex items-center justify-center bg-white px-5">
//       <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
//         {renderServices()}
//       </div>
//     </div>
//   );
// }

import React from "react";
import ServiceItem from "./ServiceItem";
import { ServiceModal } from "../../models";
import { cn } from "../../lib/cs";

export default function Services({ services }: { services: ServiceModal[] }) {
  const data = [
    {
      image: [
        {
          id: "1",
          name: "Trang điểm",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      gallery: [
        {
          id: "1",
          name: "Trang diem",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      alt: "",
      title: "Trang điểm",
      description:
        "Ngoài việc lựa chọn váy cưới thì với mỗi cô dâu lớp trang điểm cũng vô cùng quan trọng.",
    },
    {
      image: [
        {
          id: "2",
          name: "Trang điểm",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      gallery: [
        {
          id: "2",
          name: "Trang diem",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      alt: "",
      title: "Trước ngày cưới",
      description:
        "Luôn dẫn đầu với những concept ảnh cưới ấn tượng, các nhiếp ảnh gia của Mardoll Studio.",
    },
    {
      image: [
        {
          id: "3",
          name: "Trang điểm",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      gallery: [
        {
          id: "3",
          name: "Trang diem",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      alt: "",
      title: "Ngày cưới",
      description:
        "Phóng sự cưới nơi cảm xúc và những khoảnh khắc thiêng liêng được lưu giữ trọn vẹn.",
    },
    {
      image: [
        {
          id: "4",
          name: "Trang điểm",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      gallery: [
        {
          id: "4",
          name: "Trang diem",
          url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8d2VkZGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        },
      ],
      alt: "",
      title: "Áo cưới",
      description:
        "Mardoll Studio luôn mang đến những chiếc váy cưới vô cùng đắt giá để nàng tỏa sáng, lộng lẫy nơi lễ đường.",
    },
  ];
  const renderServices = () => {
    return services?.map((item: ServiceModal, index: number) => (
      <ServiceItem key={index} showDescription btnShowMore {...item} />
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
        gridColumnNumber[services?.length] ?? "lg:grid-cols-1"
      )}
    >
      {renderServices()}
    </div>
  );
}
