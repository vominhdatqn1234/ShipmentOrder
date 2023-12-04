import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { query, collection } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { AboutMeModalPageModal } from '../../../models';

export function useAboutMePage() {
	const ref = query(collection(firestore, 'aboutMePage'));
	// Provide the query to the hook
	const queryAboutMe = useFirestoreQuery(['aboutMePage'], ref);
	const snapshot = queryAboutMe.data;
	let data: any[] = [];
	snapshot?.forEach((docSnapshot) => {
		data.push({ id: docSnapshot.id, ...docSnapshot.data() });
	});

	const refetch = async () => {
		try {
			await queryAboutMe.refetch(); // You can use refetch to fetch data again
		} catch (error) {
			console.error('Error refetching wedding dress data:', error);
		}
	};

	return {
		isError: queryAboutMe.isError,
		isLoading: queryAboutMe.isLoading,
		data: data as AboutMeModalPageModal[],
		refetch
	};
}
