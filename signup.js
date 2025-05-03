// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Form switching logic
const roleSelect = document.getElementById('roleSelect');
const studentForm = document.getElementById('studentSignupForm');
const mentorForm = document.getElementById('mentorSignupForm');

roleSelect.addEventListener('change', () => {
    if (roleSelect.value === 'student') {
        studentForm.style.display = 'block';
        mentorForm.style.display = 'none';
    } else {
        studentForm.style.display = 'none';
        mentorForm.style.display = 'block';
    }
});

// Student signup
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    try {
        // 1. Create authentication account
        const userCredential = await auth.createUserWithEmailAndPassword(
            document.getElementById('studentEmail').value,
            document.getElementById('studentPassword').value
        );

        // 2. Get selected subjects
        const subjectsSelect = document.getElementById('studentSubjects');
        const selectedSubjects = Array.from(subjectsSelect.selectedOptions).map(option => option.value);

        // 3. Store student data in Firestore
        const userData = {
            role: 'student',
            name: document.getElementById('studentName').value,
            email: document.getElementById('studentEmail').value,
            age: parseInt(document.getElementById('studentAge').value),
            class: document.getElementById('studentClass').value,
            subjects: selectedSubjects,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Use the UID from the authenticated user
        await db.collection('users').doc(userCredential.user.uid).set(userData);

        // 4. Redirect to student dashboard
        window.location.href = 'student dashboard/Student_hyml.html';
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Sign Up as Student';
    }
});

// Mentor signup
mentorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    try {
        // 1. Create authentication account
        const userCredential = await auth.createUserWithEmailAndPassword(
            document.getElementById('mentorEmail').value,
            document.getElementById('mentorPassword').value
        );

        // 2. Get selected subjects
        const subjectsSelect = document.getElementById('mentorSubjects');
        const selectedSubjects = Array.from(subjectsSelect.selectedOptions).map(option => option.value);

        // 3. Store mentor data in Firestore
        const userData = {
            role: 'mentor',
            name: document.getElementById('mentorName').value,
            email: document.getElementById('mentorEmail').value,
            age: parseInt(document.getElementById('mentorAge').value),
            qualification: document.getElementById('mentorQualification').value,
            institute: document.getElementById('mentorInstitute').value,
            experience: parseInt(document.getElementById('mentorExperience').value),
            subjects: selectedSubjects,
            bio: document.getElementById('mentorBio').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Use the UID from the authenticated user
        await db.collection('users').doc(userCredential.user.uid).set(userData);

        // 4. Redirect to mentor dashboard
        window.location.href = 'Mentor-dashboard/project/index.html';
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Sign Up as Mentor';
    }
});

// Show student form by default
studentForm.style.display = 'block';


