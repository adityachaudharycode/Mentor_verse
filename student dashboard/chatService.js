import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    limit,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Get Firebase services from global variables
const db = window.firebaseDb;
const auth = window.firebaseAuth;

export const chatService = {
    // Get current user ID
    getCurrentUserId() {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        console.log('STUDENT DASHBOARD - getCurrentUserId called, returning:', userId);
        console.log('STUDENT DASHBOARD - auth.currentUser:', auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName
        } : 'null');
        return userId;
    },

    // Get current user role
    async getCurrentUserRole() {
        const userId = this.getCurrentUserId();
        console.log('getCurrentUserRole called for userId:', userId);
        if (!userId) {
            console.error('No user ID available');
            return null;
        }

        try {
            // Check user role in the users collection
            console.log('Checking user role in users collection');
            const userDoc = await getDoc(doc(db, 'users', userId));
            console.log('User document exists:', userDoc.exists());
            if (userDoc.exists() && userDoc.data().role) {
                const role = userDoc.data().role;
                console.log('Found role in users collection:', role);
                return role;
            }

            // Fallback: Check if user exists in students or mentors collection
            console.log('Checking if user exists in students collection');
            const studentDoc = await getDoc(doc(db, 'students', userId));
            if (studentDoc.exists()) {
                console.log('User found in students collection');
                return 'student';
            }

            console.log('Checking if user exists in mentors collection');
            const mentorDoc = await getDoc(doc(db, 'mentors', userId));
            if (mentorDoc.exists()) {
                console.log('User found in mentors collection');
                return 'mentor';
            }

            console.error('User role not found in any collection');
            return null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    },

    // Create or get conversation ID
    getConversationId(studentId, mentorId) {
        // Sort IDs to ensure consistent conversation ID regardless of who initiates
        return [studentId, mentorId].sort().join('_');
    },

    // Send message
    async sendMessage(studentId, mentorId, message) {
        try {
            const conversationId = this.getConversationId(studentId, mentorId);
            const currentUserId = this.getCurrentUserId();

            if (!currentUserId) throw new Error('User not authenticated');

            // Determine sender role
            const isStudent = currentUserId === studentId;
            const isMentor = currentUserId === mentorId;

            console.log('Student dashboard - Sending message:', {
                conversationId,
                studentId,
                mentorId,
                currentUserId,
                isStudent,
                isMentor,
                message
            });

            if (!isStudent && !isMentor) {
                throw new Error('Unauthorized to send message in this conversation');
            }

            // Add message to messages collection
            const messageRef = await addDoc(collection(db, 'messages'), {
                conversationId,
                studentId,
                mentorId,
                senderId: currentUserId,
                senderRole: isStudent ? 'student' : 'mentor',
                content: message,
                timestamp: serverTimestamp(),
                read: false
            });

            // Update or create conversation document
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (conversationDoc.exists()) {
                // Update existing conversation
                await updateDoc(conversationRef, {
                    lastMessage: message,
                    lastMessageTimestamp: serverTimestamp(),
                    lastSenderId: currentUserId,
                    [`unreadCount_${isStudent ? mentorId : studentId}`]:
                        (conversationDoc.data()[`unreadCount_${isStudent ? mentorId : studentId}`] || 0) + 1
                });
            } else {
                // Create new conversation
                await setDoc(conversationRef, {
                    conversationId,
                    studentId,
                    mentorId,
                    createdAt: serverTimestamp(),
                    lastMessage: message,
                    lastMessageTimestamp: serverTimestamp(),
                    lastSenderId: currentUserId,
                    [`unreadCount_${studentId}`]: isStudent ? 0 : 1,
                    [`unreadCount_${mentorId}`]: isMentor ? 0 : 1
                });
            }

            return messageRef.id;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Mark messages as read
    async markMessagesAsRead(conversationId) {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            // Get conversation to verify user is a participant
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            // Verify user is a participant
            if (currentUserId !== conversationData.studentId && currentUserId !== conversationData.mentorId) {
                throw new Error('Unauthorized to access this conversation');
            }

            // Reset unread count for current user
            await updateDoc(conversationRef, {
                [`unreadCount_${currentUserId}`]: 0
            });

            // Mark messages as read
            const q = query(
                collection(db, 'messages'),
                where('conversationId', '==', conversationId),
                where('senderId', '!=', currentUserId),
                where('read', '==', false)
            );

            const querySnapshot = await getDocs(q);

            // Update each unread message
            const batch = [];
            querySnapshot.forEach((doc) => {
                batch.push(updateDoc(doc.ref, { read: true }));
            });

            await Promise.all(batch);

            return querySnapshot.size; // Return number of messages marked as read
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    },

    // Get all conversations for current user
    async getConversations() {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            const userRole = await this.getCurrentUserRole();
            if (!userRole) throw new Error('User role not found');

            // Query conversations where user is a participant
            const q = query(
                collection(db, 'conversations'),
                userRole === 'student'
                    ? where('studentId', '==', currentUserId)
                    : where('mentorId', '==', currentUserId)
            );

            const querySnapshot = await getDocs(q);

            // Get other participant details for each conversation
            const conversations = [];

            for (const docSnapshot of querySnapshot.docs) {
                const conversationData = docSnapshot.data();
                const otherUserId = userRole === 'student'
                    ? conversationData.mentorId
                    : conversationData.studentId;

                // Get other user's profile - first try users collection
                let otherUserDoc = await getDoc(doc(db, 'users', otherUserId));

                // If not found or missing data, try role-specific collection
                if (!otherUserDoc.exists() || !otherUserDoc.data().name) {
                    otherUserDoc = await getDoc(
                        doc(db, userRole === 'student' ? 'mentors' : 'students', otherUserId)
                    );
                }

                if (otherUserDoc.exists()) {
                    conversations.push({
                        id: docSnapshot.id,
                        ...conversationData,
                        otherUser: {
                            id: otherUserId,
                            ...otherUserDoc.data()
                        },
                        unreadCount: conversationData[`unreadCount_${currentUserId}`] || 0
                    });
                }
            }

            return conversations;
        } catch (error) {
            console.error('Error getting conversations:', error);
            throw error;
        }
    },

    // Listen to chat messages
    subscribeToChat(conversationId, callback) {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            console.log('Student dashboard - Subscribing to chat:', conversationId);
            console.log('Current user ID:', currentUserId);

            const q = query(
                collection(db, 'messages'),
                where('conversationId', '==', conversationId),
                orderBy('timestamp', 'asc')
            );

            return onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(docSnapshot => {
                    const data = docSnapshot.data();
                    const isCurrentUser = data.senderId === currentUserId;

                    console.log('Message data:', {
                        ...data,
                        currentUserId,
                        messageSenderId: data.senderId,
                        isCurrentUser,
                        senderRole: data.senderRole
                    });

                    return {
                        id: docSnapshot.id,
                        ...data,
                        isCurrentUser
                    };
                });

                console.log('Student dashboard - Messages from subscription:',
                    messages.map(m => ({
                        content: m.content,
                        senderId: m.senderId,
                        isCurrentUser: m.isCurrentUser,
                        senderRole: m.senderRole
                    }))
                );

                callback(messages);

                // Mark messages as read automatically
                this.markMessagesAsRead(conversationId).catch(console.error);
            });
        } catch (error) {
            console.error('Error subscribing to chat:', error);
            throw error;
        }
    },

    // Listen to conversations updates
    subscribeToConversations(callback) {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            // We need to determine user role first
            this.getCurrentUserRole().then(userRole => {
                if (!userRole) throw new Error('User role not found');

                const q = query(
                    collection(db, 'conversations'),
                    userRole === 'student'
                        ? where('studentId', '==', currentUserId)
                        : where('mentorId', '==', currentUserId)
                );

                return onSnapshot(q, async (snapshot) => {
                    const conversations = [];

                    for (const docSnapshot of snapshot.docs) {
                        const conversationData = docSnapshot.data();
                        const otherUserId = userRole === 'student'
                            ? conversationData.mentorId
                            : conversationData.studentId;

                        // Get other user's profile - first try users collection
                        let otherUserDoc = await getDoc(doc(db, 'users', otherUserId));

                        // If not found or missing data, try role-specific collection
                        if (!otherUserDoc.exists() || !otherUserDoc.data().name) {
                            otherUserDoc = await getDoc(
                                doc(db, userRole === 'student' ? 'mentors' : 'students', otherUserId)
                            );
                        }

                        if (otherUserDoc.exists()) {
                            conversations.push({
                                id: docSnapshot.id,
                                ...conversationData,
                                otherUser: {
                                    id: otherUserId,
                                    ...otherUserDoc.data()
                                },
                                unreadCount: conversationData[`unreadCount_${currentUserId}`] || 0
                            });
                        }
                    }

                    callback(conversations);
                });
            }).catch(error => {
                console.error('Error in subscribeToConversations:', error);
                throw error;
            });
        } catch (error) {
            console.error('Error subscribing to conversations:', error);
            throw error;
        }
    },

    // Delete a conversation (for testing or admin purposes)
    async deleteConversation(conversationId) {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            // Get conversation to verify user is a participant
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            // Verify user is a participant
            if (currentUserId !== conversationData.studentId && currentUserId !== conversationData.mentorId) {
                throw new Error('Unauthorized to delete this conversation');
            }

            // Delete all messages in the conversation
            const q = query(
                collection(db, 'messages'),
                where('conversationId', '==', conversationId)
            );

            const querySnapshot = await getDocs(q);

            // Delete each message
            const batch = [];
            querySnapshot.forEach((docSnapshot) => {
                batch.push(deleteDoc(docSnapshot.ref));
            });

            await Promise.all(batch);

            // Delete the conversation document
            await deleteDoc(conversationRef);

            return true;
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }
};