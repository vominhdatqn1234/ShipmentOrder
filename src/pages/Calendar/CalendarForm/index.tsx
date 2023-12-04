// import React, { useState } from 'react'
// import { Form, Input, Modal } from 'antd'
// import { FormItem } from '../../../components/Form'

// export default function CalendarForm() {
// 	const [modalVisible, setModalVisible] = useState(false)

// 	const closeModal = () => {
// 		setModalVisible(false)
// 	}

// 	return (
// 		<Modal
// 			title="Add Notice"
// 			open={modalVisible}
// 			onCancel={closeModal}
// 		>
// <Form>
// 	<FormItem name='Date' label="Date">
// 		<Input />
// 	</FormItem>
// 	<Form.Item name="Notice" label="Notice">
// 		<Input
// 			// value={notice}
// 			// onChange={handleNoticeChange}
// 			placeholder="Enter notice here"
// 		/>
// 	</Form.Item>
// </Form>
// 		</Modal>
// 	)
// }

import React, { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Button, Modal, ModalProps, Form, FormInstance, TimePicker, DatePicker, message, Input } from 'antd'
import { FormItem } from '../../../components/Form'
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs'
import { yupResolver } from '@hookform/resolvers/yup'
import { isVietnamesePhoneNumber } from '../../../utils';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { isEmpty } from 'lodash';

interface CalendarFormRef {
	onShow: () => void
	onClose: () => void
}
const currentDate = dayjs();

const schema = yup.object({
	name: yup.string().required('Vui lòng nhập họ tên của bạn!'),
	phone: yup.string().required('Vui lòng nhập số điện thoại của bạn!').test(
		'phone', 'Số điên thoại sai định dạng', (str, context) => {
			return isVietnamesePhoneNumber(str)
		}
	),
	time: yup
		.date()
		.transform((currentValue, originalValue) => {
			// Transform the TimePicker value into a Date object
			return originalValue ? dayjs(originalValue, 'HH:mm').toDate() : null;
		})
		.nullable()
		.test('is-valid-time', 'Thời gian dự kiến phải nằm trong khung giờ từ 9:00 - 21:30', (value) => {
			if (!value) return false; // Handle null or undefined values

			const selectedTime = dayjs(value);

			const startTime = dayjs('09:00', 'HH:mm');
			const endTime = dayjs('21:30', 'HH:mm');

			return selectedTime.isAfter(startTime) && selectedTime.isBefore(endTime);
		}).required('Vui lòng chọn thời gian dự kiến!')
}).required();

const dateFormat = "DD-MM-YYYY";
dayjs.locale('vi')

interface CalendarForm extends ModalProps {
	selectedDate?: string
	handleReload?: () => void
}

const CalendarForm: ForwardRefRenderFunction<CalendarFormRef, CalendarForm> = (props, ref) => {

	const defaultValues = {
		name: '', phone: '',
		time: dayjs(currentDate.format('HH:mm'), 'HH:mm').add(1, 'hour'),
	}

	const [isOpen, setIsOpen] = useState(false)
	const formRef = useRef<FormInstance>(null);
	const [form] = Form.useForm();
	const [messageApi, contextHolder] = message.useMessage();
	const [loading, setLoading] = useState(false)
	const { control, handleSubmit, formState: { errors }, reset, getValues, setValue } = useForm<any>({
		defaultValues,
		resolver: yupResolver(schema)
	});

	const handleShow = () => {
		setIsOpen(true)
	}

	const handleClose = () => {
		setIsOpen(false)
	}

	useImperativeHandle(ref, () => ({
		onShow: handleShow,
		onClose: handleClose
	}) as CalendarFormRef)

	return (
		<Modal
			centered
			open={isOpen}
			title="Đặt hẹn"
			onCancel={handleClose}
			footer={null}
			{...props}>
			{contextHolder}
			<Form
				form={form}
				name="control-ref"
				ref={formRef}
				layout="vertical"
				initialValues={defaultValues}
				style={{ maxWidth: 600 }}
				onFinish={handleSubmit(async (data) => {
					try {
						setLoading(true)

						const newItem = {
							name: data?.name,
							phone: data?.phone,
							time: data?.time?.toISOString(),
							createTime: dayjs(props.selectedDate).toISOString()
						}

						const docRef = await addDoc(collection(firestore, 'booking'), newItem)

						if (docRef.id) {
							setTimeout(() => {
								setLoading(false)
								handleClose?.()
								form.resetFields()
								formRef.current?.resetFields()
								reset()
								messageApi.open({
									type: 'success',
									content: 'Đặt hẹn thành công',
								});
								props.handleReload?.()
							}, 1500)
						}
					} catch (error) {
						console.log('error orderTimeForm', error)
					}
				})}
			>
				<FormItem
					control={control}
					name="name"
					label="Họ và tên"
				>
					<Input allowClear className='h-[48px]' placeholder='Nhập họ và tên' />
				</FormItem>
				<FormItem control={control} name="phone" label="Số điện thoại">
					<Input allowClear className='h-[48px]' placeholder='Nhập số điện thoại' inputMode='numeric' />
				</FormItem>
				<FormItem control={control} name='time' label="Thời gian dự kiến">
					<TimePicker placeholder='Thời gian' format="HH:mm" className='h-[48px]' />
				</FormItem>
				<div className='flex justify-end pt-4'>
					<Button size='large' loading={loading} disabled={!isEmpty(errors)} type="primary" htmlType="submit">
						Đặt ngay
					</Button>
				</div>
			</Form>
		</Modal>
	)
}

export default forwardRef<CalendarFormRef, CalendarForm>(CalendarForm)

export type {
	CalendarFormRef
}