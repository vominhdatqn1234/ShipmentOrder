import { firestore } from '../../../lib/firebase';
import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { query, collection } from 'firebase/firestore';
import { EmployeeModel } from '../../../models';

export function useEmployee() {
	const ref = query(collection(firestore, 'employee'));
	// Provide the query to the hook
	const queryEmployee = useFirestoreQuery(['employee'], ref);
	const snapshot = queryEmployee.data;
	let data: any[] = [];
	snapshot?.forEach((docSnapshot) => {
		data.push({ id: docSnapshot.id, ...docSnapshot.data() });
	});

	const refetchTeam = async () => {
		try {
			await queryEmployee.refetch(); // You can use refetch to fetch data again
		} catch (error) {
			console.error('Error refetching tea, data:', error);
		}
	};
	return {
		isError: queryEmployee.isError,
		isLoading: queryEmployee.isLoading,
		data: data as EmployeeModel[],
		refetchTeam
	};
}
