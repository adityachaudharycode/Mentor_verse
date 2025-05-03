import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc } from 'firebase/firestore';

export const authService = {
    // Register new user (student or mentor)
    async register(email, password, name, role) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile with name
            await updateProfile(user, { displayName: name });
            
            // Create user document in Firestore
            await setDoc(doc(db, role === 'mentor' ? 'mentors' : 'students', user.uid), {
                name,
                email,
                role,
                createdAt: new Date().toISOString()
            });
            
            return user;
        } catch (error) {
            throw error;
        }
    },

    // Login
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            throw error;
        }
    }
};