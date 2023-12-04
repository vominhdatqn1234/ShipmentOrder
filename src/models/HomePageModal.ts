import { ImageType } from "./ContractModel";
import { ServiceModal } from "./ServiceModal";

type IntroduceStudioType = {
	title: string
	subTitle: string
	content: string
	subContent: string
	userName: string
	userRole: string
}


type StoriesType = {
	title: string
	content: string
	preWedding: ServiceModal[]
	wedding: ServiceModal[]
}

type ReviewerType =  ServiceModal & {
	userName: string
	content: string
}

type HomePageModal = {
	id: string
	hero: ImageType[]
	introduceStudio: IntroduceStudioType
	services: ServiceModal[]
	stories: StoriesType
	reviewer: ReviewerType[],
	titleReviewer: string
}

export type {
	HomePageModal,
	IntroduceStudioType,
	StoriesType,
	ReviewerType
}