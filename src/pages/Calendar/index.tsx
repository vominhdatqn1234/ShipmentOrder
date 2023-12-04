import React, { useState, useRef } from "react";
import {
  Calendar,
  Badge,
  List,
  Modal,
  CalendarProps,
  Breadcrumb,
  Space,
  Button,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useQueryClient } from "react-query";
import { useContactInfo } from "../ContactInfo/useContactInfo";
import { groupBy, map } from "lodash";
import CalendarForm, { CalendarFormRef } from "./CalendarForm";
import { MdAddCircleOutline } from "react-icons/md";

// const customNoticeData: any = {
// 	'2023-09-15': [
// 		{ time: '10:00 AM', notice: 'Meeting with Team' },
// 		{ time: '2:30 PM', notice: 'Review Project Progress' },
// 	],
// 	'2023-09-20': [
// 		{ time: '9:30 AM', notice: 'Client Presentation' },
// 	],
// };
const today = dayjs();

function CustomCalendar() {
  const {
    data: contactInfoData,
    isLoading,
    refetchContactInfo,
  } = useContactInfo();
  const [modalDetailVisible, setModalDetailVisible] = useState(false);
  // const [modalVisible, setModalDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const calendarRef = useRef<CalendarFormRef>(null);
  const queryClient = useQueryClient();

  const formatISODate = (isoDate: any) => {
    return dayjs(isoDate).format("YYYY-MM-DD");
  };

  const formatTimeISODate = (isoDate: any) => {
    return dayjs(isoDate).format("HH:mm");
  };

  const formattedData = map(contactInfoData, (item) => {
    return {
      ...item,
      createTime: formatISODate(item.createTime),
    };
  });

  const customNoticeData = groupBy(formattedData, "createTime");

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setModalDetailVisible(true);
    calendarRef.current?.onClose();
  };

  const handleReload = () => {
    queryClient.invalidateQueries("booking");
    setTimeout(async () => await refetchContactInfo(), 300);
  };

  const handleDateClick = (value: any) => {
    const selectedDateString = value.format("YYYY-MM-DD");
    const formattedCurrentDate = today.format("YYYY-MM-DD");
    const date1 = dayjs(formattedCurrentDate);
    const date2 = dayjs(selectedDateString);

    if (date1.isSame(date2) || date1.isBefore(date2)) {
      calendarRef.current?.onShow();
      setSelectedDate(selectedDateString);
    }
  };

  const closeModal = () => {
    setModalDetailVisible(false);
  };

  const dateCellRender = (value: any) => {
    const dateString = value.format("YYYY-MM-DD");
    const selectedDateString = value.format("YYYY-MM-DD");
    const formattedCurrentDate = today.format("YYYY-MM-DD");
    const date1 = dayjs(formattedCurrentDate);
    const date2 = dayjs(selectedDateString);

    const validationDate = date1.isSame(date2) || date1.isBefore(date2);

    if (customNoticeData[dateString]) {
      return (
        <>
          {validationDate && (
            <div className="absolute left-0 top-1">
              <Button
                onClick={() => handleDateClick(value)}
                type="default"
                size="small"
                icon={<MdAddCircleOutline />}
              />
            </div>
          )}
          <List
            dataSource={customNoticeData[dateString]}
            renderItem={(item, index) => (
              <List.Item key={index} onClick={() => handleItemClick(item)}>
                <Space direction="vertical">
                  <Badge status="warning" text={formatTimeISODate(item.time)} />
                  {item.name}
                  {item.phone}
                </Space>
              </List.Item>
            )}
          />
        </>
      );
    }

    if (validationDate) {
      return (
        <div className="absolute left-0 top-1">
          <Button
            onClick={() => handleDateClick(value)}
            type="default"
            size="small"
            icon={<MdAddCircleOutline />}
          />
        </div>
      );
    }
    return null;
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  const handleMonthChange = (value: any) => {
    // Reset the selectedDate when changing months
    setModalDetailVisible(false);
  };

  return (
    <div className="m-2 p-2 md:p-10 bg-white rounded-3xl">
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              href: "/",
              title: "Trang chủ",
            },
            {
              title: "Lịch đặt của khách hàng",
            },
          ]}
        />
      </div>
      <Calendar onPanelChange={handleMonthChange} cellRender={cellRender} />
      <Modal
        centered
        title="Thông tin liên hệ khách hàng"
        open={modalDetailVisible}
        onOk={closeModal}
        footer={null}
        onCancel={closeModal}
      >
        {selectedItem && (
          <div>
            <p>Thời gian: {formatTimeISODate(selectedItem.time)}</p>
            <p>Tên khách hàng: {selectedItem.name}</p>
            <p>Số điện thoại: {selectedItem.phone}</p>
            <p>Email: {selectedItem.email || "--"}</p>
            <p>Ghi chú: {selectedItem.description || "--"}</p>
          </div>
        )}
      </Modal>
      <CalendarForm
        ref={calendarRef}
        selectedDate={selectedDate}
        handleReload={handleReload}
      />
    </div>
  );
}

export default CustomCalendar;
