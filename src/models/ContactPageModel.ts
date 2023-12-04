import { ServiceModal } from "./ServiceModal";

type ContactInfoType = {
    title: string
    content: string
    address: string
    phone: string
    email: string
    workingHours: string
}
type ContactPageModel = {
    title: string
    content: string
    background: ServiceModal[]
    info: ContactInfoType
} 

export type {
    ContactPageModel
}