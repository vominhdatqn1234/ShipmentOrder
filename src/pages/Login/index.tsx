import React from "react";
import LoginForm from "./LoginForm";
import { Alert } from "antd";

export default function Login() {
  return (
    <section className="bg-gray-5 bg-cover bg-[50%] bg-[rgb(55_65_81_/_0.6)] bg-blend-multiply bg-[url(https://flowbite.s3.amazonaws.com/blocks/marketing-ui/authentication/background.jpg)]">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0 h-screen">
        <a
          href="#"
          className="flex items-center mb-6 text-2xl font-semibold text-white"
        >
          <img
            className="w-8 h-8 mr-2"
            src="/output-onlinepngtools (3).png"
            alt="logo"
          />
          RoxanaTech Studio
        </a>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Đăng nhập vào tài khoản của bạn
            </h1>
            <LoginForm />
          </div>
        </div>
      </div>
    </section>
  );
}
