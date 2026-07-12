import { Button, Form, FormInstance, Input } from "antd";
import React, { useRef, useState } from "react";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { FormItem } from "../../../components/Form";
import { useForm } from "react-hook-form";
import {
  query,
  collection,
  where,
  limit,
  getDocs,
  doc,
  updateDoc,
} from "lib/db";
import * as yup from "yup";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import { isEmpty } from "lodash";
import { hash } from "bcryptjs";
import { firestore } from "../../../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useUser } from "../../../store/useUser";

const schema = yup
  .object({
    email: yup.string().required("Vui lòng nhập email"),
    password: yup
      .string()
      .min(5, "Mật khẩu tối thiểu 5 kí tự")
      .matches(/^\S+$/, "Mật khẩu không được chứa dấu cách")
      .required("Vui lòng nhập mật khẩu"),
  })
  .required();

const TEXT = {
  vi: {
    email: "Email/ Tên đăng nhập",
    emailPh: "Nhập email của bạn",
    password: "Mật khẩu",
    passwordPh: "Nhập mật khẩu",
    submit: "Đăng Nhập",
    noAccount: "Chưa có tài khoản?",
    signup: "Đăng ký",
  },
  en: {
    email: "Email/ Username",
    emailPh: "Enter your email",
    password: "Password",
    passwordPh: "Enter your password",
    submit: "Login",
    noAccount: "Don’t have account?",
    signup: "Register",
  },
};

export default function LoginForm({
  onSignUp,
  prefillEmail,
  lang = "vi",
}: {
  onSignUp?: () => void;
  prefillEmail?: string;
  lang?: "vi" | "en";
}) {
  const t = TEXT[lang];
  const [token, setToken] = useLocalStorage("token", null);
  const [remember, setRemember] = useLocalStorage("remember", false);
  const [formLogin, setFormLogin] = useLocalStorage("formLogin", {
    email: "",
    password: "",
  });
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormInstance>(null);
  const accountRef = collection(firestore, "employee");
  const { setUser } = useUser();
  const navigate = useNavigate();

  const defaultValues = {
    email: prefillEmail || formLogin.email,
    password: formLogin.password,
    remember,
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  return (
    <>
      <Form
        form={form}
        name="control-contect-ref"
        ref={formRef}
        layout="vertical"
        requiredMark={false}
        initialValues={defaultValues}
        onFinish={handleSubmit(async (data) => {
          try {
            setLoading(true);
            if (data.remember) {
              setRemember(data.remember);
              setFormLogin({ email: data.email, password: data.password });
            } else {
              setRemember(false);
              setFormLogin({ email: "", password: "" });
            }
            const accountQuery = query(
              accountRef,
              where("email", "==", data.email),
              where("password", "==", data.password),
              limit(1)
            );
            const docSnap = await getDocs(accountQuery);
            if (!docSnap.empty) {
              let payload: any = [];
              docSnap.forEach((doc) => {
                payload.push({ id: doc.id, ...doc.data() });
              });
              const passwordHash = await hash(
                `${data.email}-${data.password}`,
                10
              );
              setUser({ ...payload[0], password: null, isUserValid: true });
              const docRef = doc(accountRef, payload[0].id);
              await updateDoc(docRef, { ...payload[0], token: passwordHash });
              setToken(passwordHash);
              form.resetFields();
              formRef.current?.resetFields();
              reset();
              toast.success("Đăng nhập thành công !", {
                position: toast.POSITION.TOP_RIGHT,
              });
              navigate("/");
            } else {
              toast.error("Sai email hoặc mật khẩu !", {
                position: toast.POSITION.TOP_RIGHT,
              });
            }
            setLoading(false);
          } catch (error) {
            console.log(error, "error firebase");
          }
        })}
      >
        <FormItem
          control={control}
          name="email"
          label={
            <span className="text-base font-semibold text-gray-900">
              {t.email}
            </span>
          }
        >
          <Input
            allowClear
            className="h-[48px] rounded-lg"
            placeholder={t.emailPh}
          />
        </FormItem>
        <FormItem
          control={control}
          name="password"
          label={
            <span className="text-base font-semibold text-gray-900">
              {t.password}
            </span>
          }
          className="!mb-6"
        >
          <Input.Password
            allowClear
            className="h-[48px] rounded-lg"
            type="password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            placeholder={t.passwordPh}
          />
        </FormItem>
        <Button
          loading={loading}
          disabled={!isEmpty(errors)}
          htmlType="submit"
          block
          size="large"
          className="h-[52px] rounded-xl border-0 font-semibold text-base"
          style={{
            background: "linear-gradient(90deg, #2E8FF7 0%, #22D2A0 100%)",
            color: "#fff",
          }}
        >
          {t.submit}
        </Button>
      </Form>

      <p className="text-center text-gray-700 mt-8 mb-2">
        {t.noAccount}{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSignUp?.();
          }}
          className="text-[#2563EB] font-semibold hover:underline"
        >
          {t.signup}
        </a>
      </p>
    </>
  );
}
