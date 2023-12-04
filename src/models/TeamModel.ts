import { ImageType } from "./ContractModel";

type TeamModel = {
    id: string;
    name: string;
    title: string;
    avatar: ImageType[];
}

export type {
    TeamModel
}