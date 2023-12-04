export type FileType = {
  id: string;
  name: string;
  alt: string;
  url: string
}
export type OrdersModel = {
  id: string;
  partnerOrderId: string;
  customer: string;
  phone: string;
  address: string;
  price: string;
  total: string;
  status: string;
  files: FileType[];
  created: string;
  quality: string;
};
