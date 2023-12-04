import { IntroduceStudioType } from "../../models/HomePageModal";

export default function IntroduceStudio({
  title,
  subTitle,
  content,
  subContent,
  userName,
  userRole,
}: IntroduceStudioType) {
  return (
    <div className="py-16 bg-white text-center px-5">
      <h2 data-aos="fade-down" className="leading-8 uppercase font-dmserif">
        {title} <br />
        {subTitle}
      </h2>
      <div className="w-24 border-t border-gray-500 mx-auto text-center divide-x mt-3" />
      <div className="w-full flex flex-col items-center mt-5 font-sans">
        <p
          data-aos="fade-up"
          className="max-w-screen-sm font-light md:font-normal text-[#464646] italic"
        >
          {content}
        </p>
        <figure className="max-w-screen-md mt-6" data-aos="zoom-in-up">
          <blockquote>
            <p className="text-md font-semibold text-gray-900 font-dmserif">
              {subContent}
            </p>
          </blockquote>
          <figcaption className="flex justify-center mt-6 space-x-3">
            <div className="flex items-center divide-x-2 divide-gray-300">
              <cite className="pr-3 font-medium text-gray-900">{userName}</cite>
              <cite className="pl-3 text-sm text-gray-700">{userRole}</cite>
            </div>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
