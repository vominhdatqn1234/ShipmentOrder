import { CloseOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Drawer, DrawerProps, Menu, Tag } from "antd";
import { FaFileContract, FaRegListAlt } from "react-icons/fa";
import { FcCalendar, FcSalesPerformance } from "react-icons/fc";
import { GiAmpleDress, GiSaddle, GiTeamIdea } from "react-icons/gi";
import { HiNewspaper, HiUser, HiUserGroup, HiUserPlus } from "react-icons/hi2";
import {
  MdAssignmentAdd,
  MdOutlineContactPhone,
  MdOutlinePlaylistAdd,
  MdViewKanban,
} from "react-icons/md";

// const SubMenu = Menu.SubMenu;
// const MenuItemGroup = Menu.ItemGroup;
import React, {
  ForwardRefRenderFunction,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../../store/useUser";

type DrawerMenuRef = {
  onShow: () => void;
  onClose: () => void;
};

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group",
  disabled?: boolean
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
    disabled,
  } as MenuItem;
}

const DrawerMenu: ForwardRefRenderFunction<DrawerMenuRef, DrawerProps> = (
  props,
  ref
) => {
  // states
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  const isAdmin = user?.permission === "Admin";
  const isManager = user?.permission === "Manager";

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const onClick: MenuProps["onClick"] = (e) => {
    setOpen(false);
    if (e.key === "manager-page/news-page") {
      return window.open("https://mardoll-sanity.sanity.studio", "_blank");
    }
    navigate(`/${e.key}`);
  };

  useImperativeHandle(
    ref,
    () =>
      ({
        onShow: showDrawer,
        onClose,
      } as DrawerMenuRef),
    []
  );

  const renderExtraDrawerHeader = () => {
    return <Button onClick={onClose} icon={<CloseOutlined />}></Button>;
  };
  const itemDashBoard =
    // user?.permission === "Admin"
    //   ?
    getItem(
      "Dashboard",
      "dashboard",
      null,
      [getItem("Thống kê doanh thu", "ecommerce", <FcSalesPerformance />)],
      "group"
    );
  // : null;

  const employeesItem = isAdmin
    ? getItem("Employees", "employees", <HiUser />, [
        getItem("Danh sách nhân viên", "employees-list", <HiUserGroup />),
        getItem("Tạo nhân viên", "create-employees", <HiUserPlus />),
      ])
    : null;

  const contractItem =
    // isAdmin || isManager
    //   ?
    getItem("Orders", "contract", <FaFileContract />, [
      getItem("Danh sách đơn hàng", "contract-list", <FaRegListAlt />),
      getItem("Tạo đơn hàng", "create-contract", <MdOutlinePlaylistAdd />),
      !isAdmin
        ? getItem(
            "Danh sách loại sản phẩm",
            "contract-type-list",
            <FaRegListAlt />
          )
        : null,
      isAdmin
        ? getItem(
            "Tạo loại sản phẩm",
            "create-contract-type",
            <MdOutlinePlaylistAdd />
          )
        : null,
      // getItem("Create Order", "create-contract", <MdOutlinePlaylistAdd />),
      // isAdmin ? getItem("Danh sách loại hợp đồng", "contract-type-list", <FaRegListAlt />) : null,
      // isAdmin ? getItem("Tạo loại hợp đồng", "create-contract-type", <MdOutlinePlaylistAdd />) : null,
      // isAdmin ? getItem("Danh sách danh mục phát", "services-arising-list", <FaRegListAlt />) : null,
      // isAdmin ? getItem("Tạo danh mục phát", "create-services-arising", <MdOutlinePlaylistAdd />) : null,
    ]);
  // : null;

  const items: MenuItem[] = [
    // getItem(
    //   <Link
    //     to="/"
    //     className="items-center gap-3 ml-3 flex text-xl font-extrabold tracking-tight text-slate-900"
    //   >
    //     {/* <SiShopware /> */}
    //     <img
    //       src="/roxanatech_logo.png"
    //       className="object-cover w-[60px] h-[60px]"
    //     />
    //     <span>RoxanaTech Studio</span>
    //   </Link>,
    //   "home",
    //   null
    // ),
    itemDashBoard,
    getItem(
      "Pages",
      "pages",
      null,
      [
        isAdmin ?  getItem("Chi Phí", "revenue", <GiTeamIdea />, [
          getItem(
            "Danh sách chi phí",
            "total-revenue-list",
            <GiTeamIdea />
          ),
          getItem("Tạo chi phí", "create-total-revenue", <HiUserPlus />),
        ]) : null,
        employeesItem,
        contractItem,
      
        // getItem(
        //   <div className="flex justify-between items-center">
        //     <p>Khách hàng</p>
        //     <Tag color="#f50">Sắp ra mắt</Tag>
        //   </div>,
        //   "customers",
        //   <FcCustomerSupport />,
        //   undefined,
        //   undefined,
        //   true
        // ),
        // getItem("Váy Cưới", "wedding-dress", <GiAmpleDress />, [
        //   getItem("Danh sách váy cưới", "wedding-dress-list", <GiSaddle />),
        //   getItem("Tạo váy cưới", "create-wedding-dress", <MdAssignmentAdd />),
        //   getItem(
        //     "Danh sách tên loại váy cưới",
        //     "wedding-dress-type-list",
        //     <MdAssignmentAdd />
        //   ),
        //   getItem(
        //     "Tạo loại váy cưới",
        //     "create-wedding-dress-type",
        //     <MdAssignmentAdd />
        //   ),
        // ]),
        // getItem("Quản lý thành viên", "manage-team", <GiTeamIdea />, [
        //   getItem(
        //     "Danh sách thành viên",
        //     "team-management-list",
        //     <GiTeamIdea />
        //   ),
        //   getItem("Tạo thành viên", "create-team-management", <HiUserPlus />),
        // ]),
        // getItem("Bảng giá", "price-wedding", <GiAmpleDress />, [
        //   getItem("Danh sách bảng giá", "price-wedding-list", <GiSaddle />),
        //   getItem("Tạo bảng giá", "create-price-wedding", <MdAssignmentAdd />),
        // ]),
        // getItem("Quản lý Trang", "manager-pages", <GiTeamIdea />, [
        //   getItem("Trang chủ", "manager-page/home-page", <GiTeamIdea />),
        //   getItem("Về chúng tôi", "manager-page/about-me-page", <HiUserPlus />),
        //   getItem("Dịch vụ", "manager-page/services-page", <HiUserPlus />, [
        //     getItem("Bảng giá", "manager-page/price-page", <HiUserPlus />),
        //     getItem(
        //       "Chụp album cưới",
        //       "manager-page/wedding-album-page",
        //       <HiUserPlus />
        //     ),
        //     getItem(
        //       "Phóng sự ngày cưới",
        //       "manager-page/wedding-day-reportage-page",
        //       <HiUserPlus />
        //     ),
        //   ]),
        //   // getItem(
        //   //   "Váy cưới",
        //   //   "manager-page/wedding-dress-page",
        //   //   <HiUserPlus />
        //   // ),
        //   getItem("Liên hệ", "manager-page/contact-page", <HiUserPlus />),
        //   getItem("Tin tức", "manager-page/news-page", <HiNewspaper />),
        // ]),
        // getItem(
        //   "Thông tin liên hệ khách hàng",
        //   "contacts-information",
        //   <MdOutlineContactPhone />
        // ),
      ],
      "group"
    ),
    // getItem(
    //   "Apps",
    //   "apps",
    //   null,
    //   [
    //     getItem("Lịch đặt của khách hàng", "calendar", <FcCalendar />),
    //     getItem(
    //       <div className="flex justify-between items-center">
    //         <p>Kanban</p>
    //         <Tag color="#f50">Sắp ra mắt</Tag>
    //       </div>,
    //       "kanban",
    //       <MdViewKanban />,
    //       undefined,
    //       undefined,
    //       true
    //     ),
    //   ],
    //   "group"
    // ),
    // getItem(
    //   "Charts",
    //   "chart",
    //   null,
    //   [
    //     getItem("Bar Chart", "bar-chart", <PieChartOutlined />),
    //     getItem("Line Chart", "line-chart", <PieChartOutlined />),
    //   ],
    //   "group"
    // ),
  ];

  // const renderTitleDrawerHeader = () => {
  // 	return (
  // 		<a className="flex title-font font-medium items-center text-gray-900">
  // 			<Image
  // 				src="/assets/marrdoll_studio_logo.jpeg"
  // 				alt="Mardoll Studio Logo"
  // 				className="w-21 h-12 object-cover"
  // 				width={90}
  // 				height={48}
  // 				priority
  // 			/>
  // 		</a>
  // 	)
  // }

  return (
    <>
      <Drawer
        className="drawer-menu"
        width={300}
        closeIcon={false}
        extra={renderExtraDrawerHeader()}
        placement="left"
        onClose={onClose}
        open={open}
      >
        <Link
          to="/"
          className="items-center justify-center gap-3 ml-3 flex text-xl font-extrabold tracking-tight text-slate-900"
        >
          Teement
        </Link>
        <Menu
          onClick={onClick}
          mode="inline"
          selectedKeys={["1"]}
          items={items}
        ></Menu>
      </Drawer>
    </>
  );
};

export default forwardRef<DrawerMenuRef, DrawerProps>(DrawerMenu);

export type { DrawerMenuRef };
