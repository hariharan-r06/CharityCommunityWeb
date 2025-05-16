import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    sendPasswordResetEmail,
    signOut,
    updateProfile
  } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
  import { auth } from '../app/firebase';

// Initialize Firestore
const db = getFirestore();
  
  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  
  // Github Auth Provider
  const githubProvider = new GithubAuthProvider();
  
  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User's display name
   * @returns {Promise} Firebase user credential
   */
  /**
 * Verify organization details against the NGO database
 * @param {string} organizationName - Name of the organization
 * @param {string} email - Email from Google sign-in
 * @returns {Promise<boolean>} Whether the organization is verified
 */
export const verifyOrganization = async (organizationName, email) => {
  try {
    const ngoRef = collection(db, 'ngo_data');
    const q = query(
      ngoRef,
      where('Charity Name', '==', organizationName),
      where('Email', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error verifying organization:', error);
    throw error;
  }
};

export const registerWithEmailAndPassword = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Firebase user credential
   */
  export const loginWithEmailAndPassword = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Sign in with Google
   * @returns {Promise} Firebase user credential
   */
  export const signInWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Sign in with Github
   * @returns {Promise} Firebase user credential
   */
  export const signInWithGithub = async () => {
    try {
      return await signInWithPopup(auth, githubProvider);
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise} Success or error
   */
  export const resetPassword = async (email) => {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Sign out the current user
   * @returns {Promise} Success or error
   */
  export const logout = async () => {
    try {
      return await signOut(auth);
    } catch (error) {
      throw error;
    }
  };
  
  /**
   * Get the current user
   * @returns {Object|null} Current Firebase user or null
   */
  export const getCurrentUser = () => {
    return auth.currentUser;
  };
  
  /**
   * Create an auth state listener to track user authentication state
   * @param {Function} callback - Callback function to run when auth state changes
   * @returns {Function} Unsubscribe function
   */
  export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
  };