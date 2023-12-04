import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { query, collection } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { HomePageModal } from '../../../models';

export function useHomePage() {
	const ref = query(collection(firestore, 'homePage'));
	// Provide the query to the hook
	const queryContract = useFirestoreQuery(['homePage'], ref);
	const snapshot = queryContract.data;
	let data: any[] = [];
	snapshot?.forEach((docSnapshot) => {
		data.push({ id: docSnapshot.id, ...docSnapshot.data() });
	});

	const refetch = async () => {
		try {
			await queryContract.refetch(); // You can use refetch to fetch data again
		} catch (error) {
			console.error('Error refetching wedding dress data:', error);
		}
	};

	return {
		isError: queryContract.isError,
		isLoading: queryContract.isLoading,
		data: data as HomePageModal[],
		refetch
	};
}
