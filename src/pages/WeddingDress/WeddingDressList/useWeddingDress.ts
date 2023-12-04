import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { query, collection } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { WeddingDressModel } from '../../../models';

export function useWeddingDress() {
	const ref = query(collection(firestore, 'weddingDress'));
	// Provide the query to the hook
	const queryWeddingDress = useFirestoreQuery(['weddingDress'], ref);
	const snapshot = queryWeddingDress.data;
	let data: any[] = [];
	snapshot?.forEach((docSnapshot) => {
		data.push({ id: docSnapshot.id, ...docSnapshot.data() });
	});

	const refetchWeddingDress = async () => {
		try {
			await queryWeddingDress.refetch(); // You can use refetch to fetch data again
		} catch (error) {
			console.error('Error refetching wedding dress data:', error);
		}
	};

	return {
		isError: queryWeddingDress.isError,
		isLoading: queryWeddingDress.isLoading,
		data: data as WeddingDressModel[],
		refetch: refetchWeddingDress
	};
}
