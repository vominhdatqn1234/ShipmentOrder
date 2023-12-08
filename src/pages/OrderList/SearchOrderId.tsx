import Search from "antd/es/input/Search";
import React, { useState } from "react";
import { debounce, find, map } from "lodash";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { firestore } from "../../lib/firebase";
import { useOrderSlice } from "../../store/useOrderSlice";

export default function SearchOrderId() {
  // const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { setNewTerm, setSearch, orders } = useOrderSlice();

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
        where("partnerOrderId", ">=", parseInt(keyword)),
        limit(1)
      );
      const querySnapshot = await getDocs(ref);
      querySnapshot.forEach(async (doc) => {
        const itemName = doc.data().partnerOrderId;
        if (isCloseEnough(`${itemName}`, `${keyword}`)) {
          const orderRef = query(
            collection(firestore, "orders"),
            where("createdUser", "==", doc.data()?.userId),
            where("created", "==", doc.data()?.created),
            limit(1)
          );
          const queryOrderSnapshot = await getDocs(orderRef);
          queryOrderSnapshot.forEach((orderDoc) => {
            const isExistOrderId = find(orderDoc.data()?.orders, {
              partnerOrderId: +keyword,
            });

            setSearch([
              {
                ...isExistOrderId,
                orders: orderDoc.data()?.orders,
                parentId: orderDoc.id,
              },
            ]);
          });
        }
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
    // You can dispatch an action or update state with the search results
  }, 300); // Adjust the debounce delay as needed

  const handleChangeValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setNewTerm(newSearchTerm);
    // setSearchTerm(newSearchTerm);
    // if (newSearchTerm.length === 0) {
    //   setSearch(orders);
    // }
    if (newSearchTerm.length >= 6) {
      debouncedSearch(newSearchTerm);
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
      />
    </div>
  );
}
