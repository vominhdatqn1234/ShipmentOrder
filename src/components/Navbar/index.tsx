import React, { useEffect, useRef } from "react";
import { BsChatLeft } from "react-icons/bs";
import { AiOutlineMenu } from "react-icons/ai";
import { MdKeyboardArrowDown } from "react-icons/md";
import { RiNotification3Line } from "react-icons/ri";
import {
  Avatar,
  Button,
  Dropdown,
  MenuProps,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { colors } from "../../styles/colors";
import { useUser } from "../../store/useUser";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import DrawerMenu, { DrawerMenuRef } from "../SideBar/DrawerMenu";
import useWindowSize from "../../hooks/useWindowSize";
import { useWindowSizeMenu } from "../../store/useWindowSizeMenu";
import { cn } from "../../lib/cs";
import { useOrders } from "../../pages/OrderList/useOrders";

const Navbar = () => {
  const { user, setUser } = useUser();
  const { refetch } = useOrders();
  const [token, setToken] = useLocalStorage("token", null);
  const { name, avatar } = user || {};
  const navigate = useNavigate();
  const drawerMenuRef = useRef<DrawerMenuRef>(null);
  const { width } = useWindowSize();
  const { isActiveMenu, setIsActiveMenu } = useWindowSizeMenu();

  const handleLogout = () => {
    setUser({});
    setToken(null);
    navigate("/login");
    refetch?.();
  };
  const items: MenuProps["items"] = [
    {
      label: <Typography.Text type="danger">Đăng xuất</Typography.Text>,
      key: "0",
      onClick: handleLogout,
    },
  ];

  const handleShowDrawerMenu = () => {
    if (width < 1280) {
      drawerMenuRef.current?.onShow();
    }
    if (isActiveMenu) {
      setIsActiveMenu(false);
    } else {
      setIsActiveMenu(true);
    }
  };

  useEffect(() => {
    if (width < 1280) {
      setIsActiveMenu(false);
    } else {
      setIsActiveMenu(true);
    }
  }, [width, setIsActiveMenu]);

  return (
    <div
      className={cn(
        "flex z-50 w-full fixed items-center justify-between p-2 bg-white ",
        isActiveMenu && "xl:ml-72 xl:w-[calc(100%_-_296px)]"
      )}
    >
      <DrawerMenu ref={drawerMenuRef} />
      <AiOutlineMenu
        className="cursor-pointer"
        onClick={handleShowDrawerMenu}
        color={colors.primary}
        size={25}
      />
      <div className="flex items-center cursor-pointer p-1 gap-3 rounded-lg">
        {/* <Tooltip title="Chat">
          <BsChatLeft color={colors.primary} size={25} />
        </Tooltip>

        <Tooltip title="Notification">
          <RiNotification3Line color={colors.primary} size={25} />
        </Tooltip> */}
        <Avatar
          src={
            <img
              className="rounded-full w-8 h-8"
              src={avatar}
              alt="user-profile"
            />
          }
        />
        <Dropdown menu={{ items }} trigger={["hover"]}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <span className="text-gray-900 font-bold ml-1 text-14">
                Hi, {name}
              </span>
              <MdKeyboardArrowDown className="mr-2 text-gray-400 text-14" />
            </Space>
          </a>
        </Dropdown>
      </div>
    </div>
  );
};

export default Navbar;
