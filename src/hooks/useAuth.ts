import { useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { collection, query, where, limit, getDocs } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { useUser } from '../store/useUser'

export const useAuth = () => {
	const [isUserValid, setIsUserValid] = useState(false)
	const [token] = useLocalStorage('token', null)
	const { user, setUser } = useUser()
	const accountRef = collection(firestore, 'employee');
	useEffect(() => {
		const getInfoToken = async () => {
			const accountQuery = query(
				accountRef,
				where('token', '==', token),
				limit(1)
			)
			const docSnap = await getDocs(accountQuery);
			if (!docSnap.empty) {
				let payload: any = [];
				docSnap.forEach((doc) => {
					payload.push({ id: doc.id, ...doc.data() });
				});
				setIsUserValid(true)
				setUser({ ...payload[0], password: null, isUserValid: true })
			}
		}
		getInfoToken()
	}, [])

	return {
		isUserValid,
		user
	}
}
