import Search from "antd/es/input/Search";
import React, { useState } from "react";
import { debounce, filter, find, isEmpty } from "lodash";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import { useOrderSlice } from "../../store/useOrderSlice";

export default function SearchOrderId() {
  const [loading, setLoading] = useState(false);
  const { setNewTerm, setSearch, newTerm } = useOrderSlice();
  const [errorMessage, setErrorMessage] = useState('')

  const isCloseEnough = (str1: string, str2: string) => {
    return str1?.includes?.(str2) || str2?.includes?.(str1);
  };

  // Create a debounced version of the search function
  const debouncedSearch = debounce(async (keyword) => {
    // Perform your search operation here
    setLoading(true);
    try {
      const ref = query(
        collection(firestore, "searchOrders"),
        where("partnerOrderId", ">=", keyword),
        where("partnerOrderId", "<", keyword + "\uf8ff"),
        limit(10)
      );

      const querySnapshot = await getDocs(ref);
      let resultSearch: any = [];
      let resultSearchOrder: any = [];
      let promiseOrder: any = [];
      querySnapshot.forEach(async (doc) => {
        resultSearch.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      resultSearch.forEach((order: any, index: number) => {
        promiseOrder.push(
          new Promise(async (resolve, reject) => {
            try {
              const orderRef = query(
                collection(firestore, "orders"),
                where("createdUser", "==", order?.userId),
                where("created", "==", order.created),
                limit(1)
              );
              const queryOrderSnapshot = await getDocs(orderRef);
              queryOrderSnapshot.forEach((orderDoc) => {
                const isExistOrderId = find(orderDoc.data()?.orders, {
                  partnerOrderId: order?.partnerOrderId,
                });
                if (isExistOrderId) {
                  const payload = {
                    ...isExistOrderId,
                    orders: orderDoc.data()?.orders,
                    parentId: orderDoc.id,
                  };
                  resultSearchOrder.push(payload);
                  resolve(payload);
                } else {
                  resolve({});
                }
              });
            } catch (error) {
              reject(error);
            }
          })
        );
      });
      const orderPromiseAll = await Promise.all(promiseOrder);
      const results = filter(orderPromiseAll, item => !isEmpty(item))
      setSearch(results);
    } catch (error) {
    } finally {
      setLoading(false);
    }
    // You can dispatch an action or update state with the search results
  }, 300); // Adjust the debounce delay as needed

  const handleChangeValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setNewTerm(newSearchTerm);
    setErrorMessage('Vui lòng nhập 7 ký tự trở lên')
    if (newSearchTerm.length >= 7) {
      debouncedSearch(newSearchTerm);
      setErrorMessage('')
    }
  };

  return (
    <div>
      <Search
        onChange={handleChangeValue}
        placeholder="Tìm kiếm OrderId"
        enterButton
        allowClear
        loading={loading}
        status={errorMessage.length > 0 && newTerm.length > 0 ? 'error' : undefined}
      />
      {errorMessage.length > 0 && newTerm.length > 0 && <div className="mt-2 text-base text-red-600">{errorMessage}</div>}
    </div>
  );
}
