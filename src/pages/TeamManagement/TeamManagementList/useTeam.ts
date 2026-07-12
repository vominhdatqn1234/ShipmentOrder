import { firestore } from '../../../lib/firebase';
import { useFirestoreQuery } from 'lib/queryHooks';
import { query, collection } from 'lib/db';

export function useTeam() {
  const ref = query(collection(firestore, 'team'));
  // Provide the query to the hook
  const queryTeam = useFirestoreQuery(['team'], ref);
  const snapshot = queryTeam.data;
  let data: any[] = [];
  snapshot?.forEach((docSnapshot) => {
    data.push({ id: docSnapshot.id, ...docSnapshot.data() });
  });

  const refetchTeam = async () => {
    try {
      await queryTeam.refetch(); // You can use refetch to fetch data again
    } catch (error) {
      console.error('Error refetching tea, data:', error);
    }
  };
  return {
    isError: queryTeam.isError,
    isLoading: queryTeam.isLoading,
    data: data,
    refetch: refetchTeam
  };
}
