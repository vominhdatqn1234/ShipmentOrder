import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



// const firebaseConfig = {
//     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// const firebaseConfig = {
//     apiKey: "AIzaSyCKY8-NPT7gkk4oof0hKuLf429j_Ygwg1c",
//     authDomain: "roxanatech-studio-54805.firebaseapp.com",
//     projectId: "roxanatech-studio-54805",
//     storageBucket: "roxanatech-studio-54805.appspot.com",
//     messagingSenderId: "419705901043",
//     appId: "1:419705901043:web:1ea4de96beced676fdcc86",
//     measurementId: "G-Y1RS3QJ9G7"
//   };
const firebaseConfig = {
  apiKey: "AIzaSyDpuVkE-v1ay3_-zLCl9MCkktPn_xpUQSs",
  authDomain: "shipmentinfomation.firebaseapp.com",
  projectId: "shipmentinfomation",
  storageBucket: "shipmentinfomation.appspot.com",
  messagingSenderId: "337968647992",
  appId: "1:337968647992:web:b01ccb9f5c19042d793bcd",
  measurementId: "G-BTTHG813WD"
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app)

// export
export { firestore, storage };
