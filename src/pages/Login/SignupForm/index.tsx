import { Button, Form, Input } from "antd";
import { useState } from "react";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import { hash } from "bcryptjs";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "lib/db";
import { FormItem } from "../../../components/Form";
import { firestore } from "../../../lib/firebase";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useUser } from "../../../store/useUser";

const schema = yup
  .object({
    firstName: yup.string().required("Vui lòng nhập Họ"),
    lastName: yup.string().required("Vui lòng nhập Tên"),
    phone: yup
      .string()
      .matches(/^[0-9+ ]{9,15}$/, "Số điện thoại không hợp lệ")
      .required("Vui lòng nhập số điện thoại"),
    email: yup.string().required("Vui lòng nhập tên đăng nhập"),
    password: yup
      .string()
      .min(5, "Mật khẩu tối thiểu 5 kí tự")
      .matches(/^\S+$/, "Mật khẩu không được chứa dấu cách")
      .required("Vui lòng nhập mật khẩu"),
  })
  .required();

const label = (text: string) => (
  <span className="text-base font-semibold text-gray-900">{text}</span>
);

const TEXT = {
  vi: {
    firstName: "Họ",
    lastName: "Tên",
    phone: "Số điện thoại",
    username: "Tên Đăng Nhập",
    password: "Mật khẩu",
    submit: "Tạo Tài Khoản",
  },
  en: {
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    username: "Username",
    password: "Password",
    submit: "Create Account",
  },
};

export default function SignupForm({
  lang = "vi",
}: {
  lang?: "vi" | "en";
}) {
  const t = TEXT[lang];
  const [loading, setLoading] = useState(false);
  const [, setToken] = useLocalStorage("token", null);
  const { setUser } = useUser();
  const navigate = useNavigate();
  const accountRef = collection(firestore, "employee");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({ resolver: yupResolver(schema) });

  return (
    <Form
      layout="vertical"
      requiredMark={false}
      onFinish={handleSubmit(async (data) => {
        try {
          setLoading(true);
          // Check trùng tên đăng nhập
          const dup = await getDocs(
            query(accountRef, where("email", "==", data.email), limit(1))
          );
          if (!dup.empty) {
            toast.error("Tên đăng nhập đã tồn tại !");
            setLoading(false);
            return;
          }
          const account = {
            name: `${data.firstName} ${data.lastName}`.trim(),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            password: data.password,
            permission: "Seller",
            created: new Date().toISOString(),
          };
          const docRef = await addDoc(accountRef, account);
          // Đăng nhập luôn: tạo token và vào thẳng dashboard
          const passwordHash = await hash(
            `${data.email}-${data.password}`,
            10
          );
          await updateDoc(docRef, { token: passwordHash });
          setUser({
            id: docRef.id,
            ...account,
            password: null,
            isUserValid: true,
          });
          setToken(passwordHash);
          toast.success("Tạo tài khoản thành công !");
          navigate("/dashboard");
        } catch (e) {
          toast.error("Có lỗi xảy ra, thử lại sau");
        } finally {
          setLoading(false);
        }
      })}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormItem control={control} name="firstName" label={label(t.firstName)}>
          <Input className="h-[48px] rounded-lg" placeholder="Nguyễn" />
        </FormItem>
        <FormItem control={control} name="lastName" label={label(t.lastName)}>
          <Input className="h-[48px] rounded-lg" placeholder="Văn A" />
        </FormItem>
      </div>
      <FormItem control={control} name="phone" label={label(t.phone)}>
        <Input className="h-[48px] rounded-lg" placeholder="0912345678" />
      </FormItem>
      <FormItem control={control} name="email" label={label(t.username)}>
        <Input
          className="h-[48px] rounded-lg"
          placeholder="hello@teementpod.com"
        />
      </FormItem>
      <FormItem control={control} name="password" label={label(t.password)}>
        <Input.Password
          className="h-[48px] rounded-lg"
          placeholder="••••••••"
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </FormItem>
      <Button
        loading={loading}
        htmlType="submit"
        block
        size="large"
        className="h-[52px] rounded-xl border-0 font-semibold text-base mt-2"
        style={{
          background: "linear-gradient(90deg, #2E8FF7 0%, #22D2A0 100%)",
          color: "#fff",
        }}
      >
        {t.submit}
      </Button>
    </Form>
  );
}
