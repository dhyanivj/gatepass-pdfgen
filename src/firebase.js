import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBrusUhpn5xGHV9vneJ_GCesXcemNuIOGs",
  authDomain: "gatepass-pdf.firebaseapp.com",
  projectId: "gatepass-pdf",
  storageBucket: "gatepass-pdf.appspot.com",
  messagingSenderId: "560021379655",
  appId: "1:560021379655:web:c28d2a411563dde86e6f62",
  measurementId: "G-PXR4Z9WY7Z",
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

const db = firebase.firestore();

export { db, storage };
