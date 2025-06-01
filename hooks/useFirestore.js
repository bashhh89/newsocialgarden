import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { app } from "../lib/firebase";

// Initialize Firestore
const db = getFirestore(app);

/**
 * Hook for accessing Firestore functionality
 * @returns {Object} Firestore operations
 */
export function useFirestore() {
  /**
   * Get a document reference
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @returns {Object} Document reference
   */
  const getDocRef = (collectionName, docId) => {
    return doc(db, collectionName, docId);
  };

  /**
   * Fetch a document by ID
   * @param {Object} docRef - Document reference
   * @returns {Promise<Object>} Document snapshot
   */
  const fetchDoc = async (docRef) => {
    try {
      return await getDoc(docRef);
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  };

  /**
   * Update a document
   * @param {Object} docRef - Document reference
   * @param {Object} data - Data to update
   * @returns {Promise<void>}
   */
  const updateDocument = async (docRef, data) => {
    try {
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  /**
   * Create or overwrite a document
   * @param {Object} docRef - Document reference
   * @param {Object} data - Document data
   * @returns {Promise<void>}
   */
  const setDocument = async (docRef, data) => {
    try {
      await setDoc(docRef, data);
    } catch (error) {
      console.error("Error setting document:", error);
      throw error;
    }
  };

  /**
   * Get all documents in a collection
   * @param {string} collectionName - Collection name
   * @returns {Promise<Array>} Array of document snapshots
   */
  const getCollection = async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs;
    } catch (error) {
      console.error("Error getting collection:", error);
      throw error;
    }
  };

  return {
    db,
    doc: getDocRef,
    getDoc: fetchDoc,
    updateDoc: updateDocument,
    setDoc: setDocument,
    collection,
    getCollection,
  };
}

export default useFirestore; 