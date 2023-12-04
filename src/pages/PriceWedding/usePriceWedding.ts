import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { query, collection } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { PriceWeddingModel } from '../../models/PriceWeddingModel';

export function usePriceWedding() {
	const ref = query(collection(firestore, 'priceWedding'));
	// Provide the query to the hook
	const queryPriceWedding = useFirestoreQuery(['priceWedding'], ref);
	const snapshot = queryPriceWedding.data;
	let data: any[] = [];
	snapshot?.forEach((docSnapshot) => {
		data.push({ id: docSnapshot.id, ...docSnapshot.data() });
	});

	const refetch = async () => {
		try {
			await queryPriceWedding.refetch(); // You can use refetch to fetch data again
		} catch (error) {
			console.error('Error refetching tea, data:', error);
		}
	};
	return {
		isError: queryPriceWedding.isError,
		isLoading: queryPriceWedding.isLoading,
		data: data as PriceWeddingModel[],
		refetch
	};
}
