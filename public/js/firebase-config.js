const firebaseConfig = {
    // Reemplaza esto con tu configuración de Firebase
    apiKey: "AIzaSyDS3pu46uu9dZsO_YanlROPia5vpiYIcZA",
    authDomain: "fisicumpleanos.firebaseapp.com",
    projectId: "fisicumpleanos",
    storageBucket: "fisicumpleanos.firebasestorage.app",
    messagingSenderId: "995378178157",
    appId: "1:995378178157:web:93dc5a5ad23cc424133764"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias útiles
const auth = firebase.auth();
const db = firebase.firestore();