import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================
// CONFIGURACIÓN DE FIREBASE
// ======================================

const firebaseConfig = {
  apiKey: "AIzaSyDSp63saYJgz50cZv4EjO_cSaWwmHltRpA",
  authDomain: "bonsai-17e32.firebaseapp.com",
  projectId: "bonsai-17e32",
  storageBucket: "bonsai-17e32.firebasestorage.app",
  messagingSenderId: "317075409301",
  appId: "1:317075409301:web:a13689cf3c59433132ce9c",
  measurementId: "G-1W2071CX0F"
};


// ======================================
// INICIALIZAR FIREBASE
// ======================================

const app = initializeApp(firebaseConfig);


// Authentication
const auth = getAuth(app);


// Firestore
const db = getFirestore(app);


// ======================================
// EXPORTAR
// ======================================

export {
  app,
  auth,
  db
};
