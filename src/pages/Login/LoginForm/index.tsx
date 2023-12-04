import { Button, Checkbox, Form, FormInstance, Input } from "antd";
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
} from "firebase/firestore";
import * as yup from "yup";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import { regexPassword } from "../../../utils";
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
      .min(8, "Độ dài từ 8-50 kí tự")
      .max(50, "Độ dài từ 8-50 kí tự")
      .matches(
        regexPassword,
        "Chứa ít nhất một kí tự thường, một kí tự hoa, một kí tự đặc biệt và một số"
      )
      .required("Vui lòng nhập mật khẩu"),
  })
  .required();

export default function LoginForm() {
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
    email: formLogin.email,
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
        className="space-y-4 md:space-y-6"
        form={form}
        name="control-contect-ref"
        ref={formRef}
        layout="vertical"
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
        <FormItem control={control} name="email" label="Email">
          <Input
            allowClear
            className="h-[48px]"
            placeholder="Vui lòng nhập email"
          />
        </FormItem>
        <FormItem control={control} name="password" label="Mật khẩu">
          <Input.Password
            allowClear
            className="h-[48px]"
            type="password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            placeholder="Vui lòng nhập mật khẩu"
          />
        </FormItem>
        <FormItem control={control} name="remember" valuePropName="checked">
          <Checkbox>Remember me</Checkbox>
        </FormItem>
        <Button
          loading={loading}
          disabled={!isEmpty(errors)}
          type="primary"
          htmlType="submit"
          block
          size="large"
        >
          Đăng nhập
        </Button>
      </Form>
    </>
  );
}
