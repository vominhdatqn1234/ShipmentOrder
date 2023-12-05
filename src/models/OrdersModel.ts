export type FileType = {
  id: string;
  name: string;
  alt: string;
  url: string
}
export type OrdersModel = {
  id: string;
  partnerOrderId: string;
  name: string;
  phone: string;
  address: string;
  price: string;
  total: string;
  status: string;
  files: FileType[];
  created: string;
  quantity: string;
  size: string;
  type: string;
  userId: string;
};
