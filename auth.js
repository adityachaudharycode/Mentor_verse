// Get auth and firestore instances
const auth = firebase.auth();
const db = firebase.firestore();

// Login form handling
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log('Attempting to sign in...');
        // First authenticate the user
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User authenticated:', userCredential.user.uid);
        
        // Then get their role from Firestore
        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        console.log('User document retrieved');
        
        if (!userDoc.exists) {
            throw new Error('User data not found');
        }

        const userData = userDoc.data();
        console.log('User role:', userData.role);
        
        // Direct redirect based on role
        if (userData.role === 'mentor') {
            window.location = 'Mentor-dashboard/project/index.html';
            
        
        } else if (userData.role === 'student') {
            window.location = 'student dashboard/Student_hyml.html';
        } else {
            throw new Error('Invalid user role');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Log In';
    }
});

// Google Sign In
const googleSignIn = document.getElementById('googleSignIn');
googleSignIn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        console.log('Starting Google sign in...');
        const result = await auth.signInWithPopup(provider);
        console.log('Google auth successful');
        
        const userDoc = await db.collection('users').doc(result.user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('Existing user role:', userData.role);
            
            if (userData.role === 'mentor') {
                window.location = 'mentor-dashboard.html';
            } else if (userData.role === 'student') {
                window.location = 'student-dashboard.html';
            }
        } else {
            console.log('New Google user, redirecting to signup');
            window.location = 'signup.html';
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
        alert(error.message);
    }
});

// Simplified auth state observer
auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    if (!user && !window.location.pathname.endsWith('login.html') && 
        !window.location.pathname.endsWith('signup.html') && 
        !window.location.pathname.endsWith('index.html')) {
        window.location = 'login.html';
    }
});





