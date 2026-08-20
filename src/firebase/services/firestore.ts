import { db } from "../config";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";

export { db, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where };
