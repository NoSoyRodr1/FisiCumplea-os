class AuthManager {
    constructor() {
        this.loginSection = document.getElementById('loginSection');
        this.registerSection = document.getElementById('registerSection');
        this.mainContent = document.getElementById('mainContent');
        this.verificationSection = document.createElement('div');
        this.setupVerificationSection();
        this.setupEventListeners();
    }

    setupVerificationSection() {
        this.verificationSection.id = 'verificationSection';
        this.verificationSection.className = 'auth-section';
        this.verificationSection.style.display = 'none';
        this.verificationSection.innerHTML = `
            <h2>Verifica tu correo electrónico</h2>
            <p>Te hemos enviado un correo de verificación.</p>
            <p>Por favor, revisa tu bandeja de entrada y sigue las instrucciones.</p>
            <button id="resendVerification" class="auth-button">Reenviar correo de verificación</button>
            <button id="refreshVerification" class="auth-button">Ya verifiqué mi correo</button>
            <button id="logoutUnverified" class="auth-button">Cerrar sesión</button>
        `;
        document.body.insertBefore(this.verificationSection, this.mainContent);
    }

    setupEventListeners() {
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForms('register');
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForms('login');
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

        // Nuevos eventos para verificación
        document.getElementById('resendVerification').addEventListener('click', () => this.resendVerificationEmail());
        document.getElementById('refreshVerification').addEventListener('click', () => this.checkVerification());
        document.getElementById('logoutUnverified').addEventListener('click', () => auth.signOut());

        // Observer de estado de autenticación
        auth.onAuthStateChanged((user) => this.handleAuthStateChange(user));
    }

    toggleForms(form) {
        this.loginSection.style.display = form === 'login' ? 'block' : 'none';
        this.registerSection.style.display = form === 'register' ? 'block' : 'none';
        this.verificationSection.style.display = 'none';
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const name = document.getElementById('registerName').value;
        const birthDate = document.getElementById('registerBirthDate').value;

        if (!email.endsWith('@unmsm.edu.pe')) {
            alert('Por favor, utiliza un correo con dominio @unmsm.edu.pe');
            return;
        }

        try {
            // Crear usuario
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Guardar datos del cumpleaños
            await db.collection('birthdays').add({
                userId: userCredential.user.uid,
                name: name,
                birthDate: birthDate,
                email: email, // Agregamos el email para referencia
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Enviar email de verificación
            await userCredential.user.sendEmailVerification({
                url: window.location.href
            });
            
            e.target.reset();
            alert('Usuario registrado. Por favor, verifica tu correo electrónico.');
        } catch (error) {
            console.error('Error en el registro:', error);
            alert('Error en el registro: ' + error.message);
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            if (user.emailVerified) {
                this.loginSection.style.display = 'none';
                this.registerSection.style.display = 'none';
                this.verificationSection.style.display = 'none';
                this.mainContent.style.display = 'block';
                // Cargar cumpleaños después de verificar el email
                birthdayManager.loadBirthdays();
            } else {
                this.loginSection.style.display = 'none';
                this.registerSection.style.display = 'none';
                this.verificationSection.style.display = 'block';
                this.mainContent.style.display = 'none';
            }
        } else {
            this.loginSection.style.display = 'block';
            this.registerSection.style.display = 'none';
            this.verificationSection.style.display = 'none';
            this.mainContent.style.display = 'none';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            e.target.reset();
        } catch (error) {
            alert('Error en el login: ' + error.message);
        }
    }

    async resendVerificationEmail() {
        try {
            const user = auth.currentUser;
            await user.sendEmailVerification({
                url: window.location.href
            });
            alert('Correo de verificación reenviado. Por favor revisa tu bandeja de entrada.');
        } catch (error) {
            alert('Error al reenviar el correo: ' + error.message);
        }
    }

    async checkVerification() {
        try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                this.handleAuthStateChange(auth.currentUser);
            } else {
                alert('Tu correo aún no ha sido verificado. Por favor, verifica tu correo e intenta nuevamente.');
            }
        } catch (error) {
            alert('Error al verificar el estado del correo: ' + error.message);
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            if (user.emailVerified) {
                // Usuario verificado - mostrar contenido principal
                this.loginSection.style.display = 'none';
                this.registerSection.style.display = 'none';
                this.verificationSection.style.display = 'none';
                this.mainContent.style.display = 'block';
                birthdayManager.loadBirthdays();
            } else {
                // Usuario no verificado - mostrar sección de verificación
                this.loginSection.style.display = 'none';
                this.registerSection.style.display = 'none';
                this.verificationSection.style.display = 'block';
                this.mainContent.style.display = 'none';
            }
        } else {
            // No hay usuario - mostrar login
            this.loginSection.style.display = 'block';
            this.registerSection.style.display = 'none';
            this.verificationSection.style.display = 'none';
            this.mainContent.style.display = 'none';
        }
    }
}