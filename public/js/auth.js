// Referencias a elementos DOM
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const mainContent = document.getElementById('mainContent');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Alternar entre formularios de login y registro
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// Registro de usuarios
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        registerForm.reset();
        alert('Usuario registrado exitosamente');
    } catch (error) {
        alert('Error en el registro: ' + error.message);
    }
});

// Login de usuarios
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        loginForm.reset();
    } catch (error) {
        alert('Error en el login: ' + error.message);
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Observer de estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuario está logueado
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        mainContent.style.display = 'block';
        loadBirthdays(); // Cargar cumpleaños al iniciar sesión
    } else {
        // Usuario no está logueado
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        mainContent.style.display = 'none';
    }
});