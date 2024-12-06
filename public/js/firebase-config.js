const firebaseConfig = {
    apiKey: "AIzaSyDS3pu46uu9dZsO_YanlROPia5vpiYIcZA",
    authDomain: "fisicumpleanos.firebaseapp.com",
    projectId: "fisicumpleanos",
    storageBucket: "fisicumpleanos.firebasestorage.app",
    messagingSenderId: "995378178157",
    appId: "1:995378178157:web:93dc5a5ad23cc424133764"
};

firebase.initializeApp(firebaseConfig);
console.log('Firebase inicializado correctamente');
const auth = firebase.auth();
console.log('Auth inicializado:', !!auth);
const db = firebase.firestore();