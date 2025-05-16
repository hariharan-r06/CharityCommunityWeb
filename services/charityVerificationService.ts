import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
import app from '../app/firebase'

const db = getFirestore(app)

interface CharityData {
  name: string;
  email: string;
  address: string;
  phone: string;
  taxId: string;
  taxStatus: string;
  mission: string;
  category: string;
  scope: string;
  documents: File[];
  verificationMethod: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Store charity data in Firestore
 * @param userId User ID
 * @param data Charity data to store
 * @returns Promise<boolean>
 */
export const storeCharityData = async (userId: string, data: Omit<CharityData, 'verificationStatus' | 'createdAt' | 'updatedAt'>) => {
  try {
    const charityData: CharityData = {
      ...data,
      verificationStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const charityRef = doc(collection(db, 'charities'), userId)
    await setDoc(charityRef, charityData)

    return true
  } catch (error) {
    console.error('Error storing charity data:', error)
    throw error
  }
}
