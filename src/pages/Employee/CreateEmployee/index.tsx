import React from 'react';
import { Breadcrumb } from 'antd';
import CreateEmployeeForm from './CreateEmployeeForm';

const CreateEmployee = () => {
	return (
		<div className='m-2 p-2 md:p-10 bg-white rounded-3xl'>
			<div className='mb-4'>
				<Breadcrumb
					items={[
						{
							href: '/',
							title: 'Trang chủ',
						},
						{
							title: 'Tạo nhân viên',
						},
					]}
				/>
			</div>
			<CreateEmployeeForm />
		</div>
	);
};
export default CreateEmployee;
