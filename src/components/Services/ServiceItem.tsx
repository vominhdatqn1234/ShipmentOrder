// import React, { useState } from "react";
// import { ServiceModal } from "../../models";
// import { Image } from "antd";
// import { map } from "lodash";
// import { cn } from "../../lib/cs";

// interface IServiceItem extends ServiceModal {
//   showDescription?: boolean;
//   btnShowMore?: boolean;
// }

// export default function ServiceItem({
//   // image,
//   url,
//   alt,
//   title,
//   description,
//   gallery,
//   showDescription,
//   btnShowMore,
// }: IServiceItem) {
//   const [visible, setVisible] = useState(false);
//   const handleShowPreviewGroup = () => setVisible(true);
//   return (
//     <div
//       data-aos="zoom-in"
//       className="group relative cursor-pointer items-center justify-center overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/30"
//     >
//       <div className={`h-[400px] w-[288px]`}>
//         <Image.PreviewGroup
//           items={map(gallery, "url")}
//           preview={{
//             visible,
//             onVisibleChange: (value) => {
//               setVisible(value);
//             },
//           }}
//         >
//           <Image
//             src={url}
//             alt={alt}
//             className="object-cover"
//             preview={{
//               mask: null,
//             }}
//           />
//         </Image.PreviewGroup>
//       </div>
//       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 group-hover:from-black/70 group-hover:via-black/60 group-hover:to-black/70" />
//       <div
//         className={cn(
//           "absolute inset-0 flex flex-col items-center justify-center px-9 text-center transition-all duration-500 group-hover:translate-y-0",
//           showDescription ? "translate-y-[65%]" : "translate-y-[40%]"
//         )}
//       >
//         <h2 className="font-dmserif text-2xl font-bold text-white">{title}</h2>
//         {showDescription && (
//           <p className="mb-3 text-lg italic text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
//             {description}
//           </p>
//         )}
//         {btnShowMore && (
//           <button
//             onClick={handleShowPreviewGroup}
//             className="rounded-full bg-neutral-900 py-2 px-3.5 font-com text-sm capitalize text-white shadow shadow-black/60 cursor-pointer"
//           >
//             Xem thêm
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { ServiceModal } from "../../models";
import { Image } from "antd";
import { map } from "lodash";
import { cn } from "../../lib/cs";

interface IServiceItem extends ServiceModal {
  showDescription?: boolean;
  btnShowMore?: boolean;
}

export default function ServiceItem({
  // image,
  url,
  alt,
  title,
  description,
  gallery,
  showDescription,
  btnShowMore,
}: IServiceItem) {
  const [visible, setVisible] = useState(false);
  const handleShowPreviewGroup = () => setVisible(true);
  return (
    <div
      data-aos="zoom-in"
      className="group w-full h-[400px] relative cursor-pointer items-center justify-center overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/30"
    >
      <Image.PreviewGroup
        items={map(gallery, "url")}
        preview={{
          visible,
          onVisibleChange: (value) => {
            setVisible(value);
          },
        }}
      >
        <div
          className="absolute h-full w-full inset-0 bg-cover bg-no-repeat bg-center transition-transform duration-500 group-hover:rotate-3 group-hover:scale-125"
          style={{ backgroundImage: `url(${url})` }}
        />
        {/* <Image
          src={url}
          alt={alt}
          // width={288}
          // height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:rotate-3 group-hover:scale-125"
          // className="object-cover"
          preview={{
            mask: null,
          }}
        /> */}
      </Image.PreviewGroup>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 group-hover:from-black/70 group-hover:via-black/60 group-hover:to-black/70" />
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center px-9 text-center transition-all duration-500 group-hover:translate-y-0",
          showDescription ? "translate-y-[55%]" : "translate-y-[35%]"
        )}
      >
        <h2 className="font-dmserif text-2xl font-bold text-white">{title}</h2>
        {showDescription && (
          <p className="mb-3 text-lg italic text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {description}
          </p>
        )}
        {btnShowMore && (
          <button
            onClick={handleShowPreviewGroup}
            className="rounded-full bg-neutral-900 py-2 px-3.5 font-com text-sm capitalize text-white shadow shadow-black/60 cursor-pointer"
          >
            Xem thêm
          </button>
        )}
      </div>
    </div>
  );
}
