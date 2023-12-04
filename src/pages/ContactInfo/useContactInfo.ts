import { firestore } from '../../lib/firebase';
import { useFirestoreQuery } from '@react-query-firebase/firestore';
import { query, collection } from 'firebase/firestore';

export function useContactInfo() {
  const ref = query(collection(firestore, 'booking'));
  // Provide the query to the hook
  const queryContactInfo = useFirestoreQuery(['booking'], ref);
  const snapshot = queryContactInfo.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });
  const refetchContactInfo = async () => {
    try {
      await queryContactInfo.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error('Error refetching tea, data:', error);
    }
  };
  return {
    isError: queryContactInfo.isError,
    isLoading: queryContactInfo.isLoading,
    data: data,
    refetchContactInfo
  };
}
