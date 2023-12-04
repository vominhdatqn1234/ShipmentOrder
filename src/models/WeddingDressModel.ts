import { ImageType } from "./ContractModel";

type WeddingDressModel = {
	id: string;
	dressCode: string;
	dressName: string;
	dressPrice: string;
	dressPriceSale: string;
	dressImage: ImageType[];
	dressQuantity: number;
	dressShape: string;
	sizes?: string[];
	description?: string;
}

type WeddingDressTypeModel = {
	id: string;
	dressCode: string
	dressCodeName: string
}

export type {
	WeddingDressModel,
	WeddingDressTypeModel
}