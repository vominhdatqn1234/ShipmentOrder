import { isEmpty, isNil } from "lodash";

export type StatusColorType =
  | "pending"
  | "active"
  | "complete"
  | "rejected"
  | "canceled";

const getStatusColor = (color: StatusColorType = "pending") => {
  const defaultColor = {
    pending: "orange",
    active: "cyan",
    complete: "green",
    rejected: "red",
    canceled: "red",
  };
  return defaultColor[color];
};

function generateSlugUrl(str: string) {
  // Remove diacritics
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('đ', 'd');
  // Replace spaces with hyphens and convert to lowercase
  str = str.replace(/\s+/g, "-").toLowerCase();
  return str;
}

const regexPassword =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

const isVietnamesePhoneNumber = (number: string) => {
  return /((^(\+84|84|0|0084){1})(3|5|7|8|9))+([0-9]{8})$/.test(number);
};

const formatCurrency = (number: string) => {
  if (isNil(number) || isEmpty(number)) return '--'
  return parseInt(number).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const formatNumber = (num: number) => {
  if (num === 0) return `${num.toString()}`;
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(0)} tỷ`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(0)} tr`;
  } else {
    return `${(num / 1000).toFixed(0)} k`;
  }
};

function isInvalidDate(date: any) {
  // Check if the date.getTime() is NaN
  return isNaN(date?.getTime?.());
}

export {
  isVietnamesePhoneNumber,
  formatCurrency,
  getStatusColor,
  regexPassword,
  formatNumber,
  generateSlugUrl,
  isInvalidDate
};
