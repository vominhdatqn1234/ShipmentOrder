type ImageType = {
  id: string;
  name: string;
  url: string;
  alt?: string;
}

type ContractType = {
  id: string;
  contractName: string;
  contractType: string;
  contractPrice: string;
}

type ServicesArising = {
  id: string;
  serviceName: string;
  servicePrice: string;
  serviceType: string;
}

type contractTypeValuePriceType = {
  value: string;
  price: string;
}

type ContractModel = {
  id: string;
  contractType: string;
  dressName: string;
  status: string;
  userName: string;
  phone: string;
  address: string;
  createDate: string;
  shottingDate: string;
  dueDate: string;
  contractPrice: string;
  contractImage: ImageType[];
  discount: string;
  notes: any[];
  servicesArisingPrice: string;
  contractTypeValuePrice: contractTypeValuePriceType[];
  // contractTypeValuePrice?: contractTypeValuePriceType[];
  shootingDate: string;
  firstCheckDeposit: boolean;
  firstDepositPrice: string;
  firstDepositPriceDate: string;
  secondCheckDeposit: boolean;
  secondDepositPrice: string;
  secondDepositPriceDate: string;
  totalPrice: string;
  secondPaymentMethod: string;
  firstPaymentMethod: string;
  servicesArisingItems: any,
  contractPriceItems: any,
  totalContractPrice: string,
  // first
  // contractType: "",
  // userName: "",
  // status: "",
  // phone: "",
  // address: "",
  // discount: "",
  // firstCheckDeposit: false,
  // servicesArisingPrice: "",
  // firstDepositPrice: "",
  // firstDepositPriceDate: "",
  // secondCheckDeposit: false,
  // secondDepositPrice: "",
  // secondDepositPriceDate: "",
  // createDate: currentDate as Dayjs,
  // shootingDate: currentDate as Dayjs,
  // dueDate: dayjs(currentDate.add(3, "day")),
  // contractPrice: "",
  // contractImage: [],
  // notes: "",
};

export type { ContractModel, ImageType, ContractType, ServicesArising };
