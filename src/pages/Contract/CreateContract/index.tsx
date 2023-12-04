import React from 'react';
import { Breadcrumb } from 'antd';
import CreateContractForm from './CreateContractForm';

const CreateContract = () => {
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
							title: 'Tạo hợp đồng',
						},
					]}
				/>
			</div>
			<CreateContractForm />
		</div>
	);
};
export default CreateContract;
