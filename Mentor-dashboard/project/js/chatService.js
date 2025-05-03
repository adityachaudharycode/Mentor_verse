// Use Firebase from global scope (initialized in index.html)
const auth = firebase.auth();
const db = firebase.firestore();

export const chatService = {
    // Get current user ID
    getCurrentUserId() {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        console.log('MENTOR DASHBOARD - getCurrentUserId called, returning:', userId);
        console.log('MENTOR DASHBOARD - auth.currentUser:', auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName
        } : 'null');
        return userId;
    },

    // Create or get conversation ID
    getConversationId(studentId, mentorId) {
        // Sort IDs to ensure consistent conversation ID regardless of who initiates
        return [studentId, mentorId].sort().join('_');
    },

    // Get current user role
    async getCurrentUserRole() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;

        try {
            // Check user role in the users collection
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists && userDoc.data().role) {
                    return userDoc.data().role;
                }
            } catch (error) {
                console.warn('Error checking user role in users collection:', error);
            }

            // Fallback: Check if user exists in mentors collection
            try {
                const mentorDoc = await db.collection('mentors').doc(userId).get();
                if (mentorDoc.exists) return 'mentor';
            } catch (error) {
                console.warn('Error checking user in mentors collection:', error);
            }

            // Fallback: Check if user exists in students collection
            try {
                const studentDoc = await db.collection('students').doc(userId).get();
                if (studentDoc.exists) return 'student';
            } catch (error) {
                console.warn('Error checking user in students collection:', error);
            }

            // Default to mentor for the mentor dashboard
            console.warn('User role not found, defaulting to mentor');
            return 'mentor';
        } catch (error) {
            console.error('Error getting user role:', error);
            return 'mentor'; // Default to mentor for the mentor dashboard
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
            const isMentor = currentUserId === mentorId;
            const isStudent = currentUserId === studentId;

            console.log('Sending message:', {
                conversationId,
                studentId,
                mentorId,
                currentUserId,
                isMentor,
                isStudent,
                message
            });

            if (!isStudent && !isMentor) {
                throw new Error('Unauthorized to send message in this conversation');
            }

            // Add message to messages collection
            const messageData = {
                conversationId,
                studentId,
                mentorId,
                senderId: currentUserId,
                senderRole: isMentor ? 'mentor' : 'student',
                content: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            };

            const messageRef = await db.collection('messages').add(messageData);

            // Update or create conversation document
            const conversationRef = db.collection('conversations').doc(conversationId);
            const conversationDoc = await conversationRef.get();

            if (conversationDoc.exists) {
                // Update existing conversation
                const conversationData = conversationDoc.data();
                const updateData = {
                    lastMessage: message,
                    lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    lastSenderId: currentUserId,
                    [`unreadCount_${isMentor ? studentId : mentorId}`]:
                        (conversationData[`unreadCount_${isMentor ? studentId : mentorId}`] || 0) + 1
                };
                await conversationRef.update(updateData);
            } else {
                // Create new conversation
                const newConversationData = {
                    conversationId,
                    studentId,
                    mentorId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastMessage: message,
                    lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    lastSenderId: currentUserId,
                    [`unreadCount_${studentId}`]: isMentor ? 1 : 0,
                    [`unreadCount_${mentorId}`]: isMentor ? 0 : 1
                };
                await conversationRef.set(newConversationData);
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
            const conversationRef = db.collection('conversations').doc(conversationId);
            const conversationDoc = await conversationRef.get();

            if (!conversationDoc.exists) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            // Verify user is a participant
            if (currentUserId !== conversationData.studentId && currentUserId !== conversationData.mentorId) {
                throw new Error('Unauthorized to access this conversation');
            }

            // Reset unread count for current user
            const updateData = {
                [`unreadCount_${currentUserId}`]: 0
            };
            await conversationRef.update(updateData);

            // Mark messages as read
            const messagesQuery = db.collection('messages')
                .where('conversationId', '==', conversationId)
                .where('senderId', '!=', currentUserId)
                .where('read', '==', false);

            const querySnapshot = await messagesQuery.get();

            // Update each unread message
            const batch = db.batch();
            querySnapshot.forEach((docSnapshot) => {
                const messageRef = db.collection('messages').doc(docSnapshot.id);
                batch.update(messageRef, { read: true });
            });

            if (querySnapshot.size > 0) {
                await batch.commit();
            }

            return querySnapshot.size; // Return number of messages marked as read
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    },

    // Get all conversations for current user (mentor)
    async getConversations() {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            const userRole = await this.getCurrentUserRole();
            if (!userRole) throw new Error('User role not found');

            if (userRole !== 'mentor') {
                throw new Error('Only mentors can access this function');
            }

            // Query conversations where user is a mentor
            const conversationsQuery = db.collection('conversations').where('mentorId', '==', currentUserId);
            const querySnapshot = await conversationsQuery.get();

            // Get student details for each conversation
            const conversations = [];

            for (const docSnapshot of querySnapshot.docs) {
                const conversationData = docSnapshot.data();
                const studentId = conversationData.studentId;
                let studentData = null;

                // Get student profile - first try users collection
                try {
                    const userDoc = await db.collection('users').doc(studentId).get();
                    if (userDoc.exists && userDoc.data().name) {
                        studentData = userDoc.data();
                    }
                } catch (error) {
                    console.warn('Error getting user data:', error);
                }

                // If not found or missing data, try students collection
                if (!studentData || !studentData.name) {
                    try {
                        const studentDoc = await db.collection('students').doc(studentId).get();
                        if (studentDoc.exists) {
                            studentData = studentDoc.data();
                        }
                    } catch (error) {
                        console.warn('Error getting student data:', error);
                    }
                }

                // If still no data, use a placeholder
                if (!studentData) {
                    studentData = {
                        name: 'Unknown Student',
                        role: 'student'
                    };
                }

                conversations.push({
                    id: docSnapshot.id,
                    ...conversationData,
                    student: {
                        id: studentId,
                        ...studentData
                    },
                    unreadCount: conversationData[`unreadCount_${currentUserId}`] || 0
                });
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

            console.log('MENTOR DASHBOARD - Subscribing to chat:', conversationId);
            console.log('MENTOR DASHBOARD - Current user ID:', currentUserId);

            // Query messages for the conversation
            const messagesQuery = db.collection('messages')
                .where('conversationId', '==', conversationId)
                .orderBy('timestamp', 'asc');

            return messagesQuery.onSnapshot((snapshot) => {
                const messages = snapshot.docs.map(docSnapshot => {
                    const data = docSnapshot.data();
                    const isCurrentUser = data.senderId === currentUserId;

                    console.log('MENTOR DASHBOARD - Message data:', {
                        id: docSnapshot.id,
                        content: data.content.substring(0, 20) + (data.content.length > 20 ? '...' : ''),
                        senderId: data.senderId,
                        currentUserId: currentUserId,
                        senderRole: data.senderRole,
                        isCurrentUser: isCurrentUser
                    });

                    return {
                        id: docSnapshot.id,
                        ...data,
                        isCurrentUser: isCurrentUser
                    };
                });

                console.log('MENTOR DASHBOARD - Messages from subscription:',
                    messages.map(m => ({
                        content: m.content.substring(0, 20) + (m.content.length > 20 ? '...' : ''),
                        senderId: m.senderId,
                        isCurrentUser: m.isCurrentUser,
                        senderRole: m.senderRole
                    }))
                );

                callback(messages);

                // Mark messages as read automatically
                this.markMessagesAsRead(conversationId).catch(console.error);
            }, error => {
                console.error('Error in messages onSnapshot:', error);
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

                if (userRole !== 'mentor') {
                    throw new Error('Only mentors can access this function');
                }

                // Query conversations where user is a mentor
                const conversationsQuery = db.collection('conversations').where('mentorId', '==', currentUserId);

                return conversationsQuery.onSnapshot(async (snapshot) => {
                    const conversations = [];

                    for (const docSnapshot of snapshot.docs) {
                        const conversationData = docSnapshot.data();
                        const studentId = conversationData.studentId;
                        let studentData = null;

                        // Get student profile - first try users collection
                        try {
                            const userDoc = await db.collection('users').doc(studentId).get();
                            if (userDoc.exists && userDoc.data().name) {
                                studentData = userDoc.data();
                            }
                        } catch (error) {
                            console.warn('Error getting user data:', error);
                        }

                        // If not found or missing data, try students collection
                        if (!studentData || !studentData.name) {
                            try {
                                const studentDoc = await db.collection('students').doc(studentId).get();
                                if (studentDoc.exists) {
                                    studentData = studentDoc.data();
                                }
                            } catch (error) {
                                console.warn('Error getting student data:', error);
                            }
                        }

                        // If still no data, use a placeholder
                        if (!studentData) {
                            studentData = {
                                name: 'Unknown Student',
                                role: 'student'
                            };
                        }

                        conversations.push({
                            id: docSnapshot.id,
                            ...conversationData,
                            student: {
                                id: studentId,
                                ...studentData
                            },
                            unreadCount: conversationData[`unreadCount_${currentUserId}`] || 0
                        });
                    }

                    callback(conversations);
                }, error => {
                    console.error('Error in onSnapshot:', error);
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

    // Get all students (for starting new conversations)
    async getStudents() {
        try {
            const currentUserId = this.getCurrentUserId();
            if (!currentUserId) throw new Error('User not authenticated');

            // Query users collection for students - simplified to avoid index requirements
            const studentsArray = [];

            // First try the users collection
            try {
                const usersQuery = db.collection('users').where('role', '==', 'student').limit(50);
                const usersSnapshot = await usersQuery.get();

                if (!usersSnapshot.empty) {
                    usersSnapshot.forEach(doc => {
                        studentsArray.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                }
            } catch (userError) {
                console.warn('Error querying users collection:', userError);
            }

            // If no students found in users collection or there was an error, try the students collection
            if (studentsArray.length === 0) {
                try {
                    const studentsQuery = db.collection('students');
                    const studentsSnapshot = await studentsQuery.get();

                    studentsSnapshot.forEach(doc => {
                        const data = doc.data();
                        studentsArray.push({
                            id: doc.id,
                            name: data.name || 'Unknown Student',
                            role: 'student',
                            ...data
                        });
                    });
                } catch (studentError) {
                    console.warn('Error querying students collection:', studentError);
                }
            }

            // Add some dummy data if no students found
            if (studentsArray.length === 0) {
                studentsArray.push(
                    { id: 'student1', name: 'Priya Malhotra', role: 'student', program: 'Computer Science' },
                    { id: 'student2', name: 'Rahul Singh', role: 'student', program: 'Data Science' },
                    { id: 'student3', name: 'Neha Gupta', role: 'student', program: 'Web Development' }
                );
            }

            return studentsArray;
        } catch (error) {
            console.error('Error getting students:', error);
            throw error;
        }
    }
};
