import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc,
    updateDoc,
    getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export const mentorService = {
    // Create or update mentor profile
    async updateMentorProfile(mentorId, profileData, profileImage) {
        try {
            const mentorRef = doc(db, 'mentors', mentorId);
            
            // Upload profile image if provided
            if (profileImage) {
                const imageRef = ref(storage, `mentors/${mentorId}/profile`);
                await uploadBytes(imageRef, profileImage);
                profileData.image = await getDownloadURL(imageRef);
            }
            
            await updateDoc(mentorRef, {
                ...profileData,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            throw error;
        }
    },

    // Search mentors
    async searchMentors(searchParams) {
        try {
            let q = collection(db, 'mentors');
            
            if (searchParams.expertise) {
                q = query(q, where('expertise', '==', searchParams.expertise));
            }
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw error;
        }
    },

    // Get mentor by ID
    async getMentorById(mentorId) {
        try {
            const mentorDoc = await getDoc(doc(db, 'mentors', mentorId));
            if (mentorDoc.exists()) {
                return { id: mentorDoc.id, ...mentorDoc.data() };
            }
            return null;
        } catch (error) {
            throw error;
        }
    }
};