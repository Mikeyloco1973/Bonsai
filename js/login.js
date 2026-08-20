import { auth, db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ==========================================
// ELEMENTOS DEL LOGIN
// ==========================================

const formulario = document.getElementById("formLogin");

const inputCorreo = document.getElementById("email");

const inputPassword = document.getElementById("password");

const recordar = document.getElementById("recordarme");

const enlaceRecuperar = document.getElementById("recuperarPassword");


// ==========================================
// INICIAR SESIÓN
// ==========================================

formulario.addEventListener("submit", async (event) => {

  event.preventDefault();


  const correo = inputCorreo.value.trim();

  const password = inputPassword.value;

  const boton = formulario.querySelector(".btn-auth");


  // ==========================================
  // VALIDACIONES
  // ==========================================

  if (correo === "" || password === "") {

    alert("Ingresa tu correo electrónico y contraseña.");

    return;
  }


  boton.disabled = true;

  boton.textContent = "Iniciando sesión...";


  try {

    // ==========================================
    // RECORDAR SESIÓN
    // ==========================================

    if (recordar.checked) {

      await setPersistence(
        auth,
        browserLocalPersistence
      );

    } else {

      await setPersistence(
        auth,
        browserSessionPersistence
      );

    }


    // ==========================================
    // INICIAR SESIÓN EN FIREBASE
    // ==========================================

    const credencial =
      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );


    const usuario = credencial.user;


    console.log(
      "Usuario conectado:",
      usuario.uid
    );


// ==========================================
// COMPROBAR ROL DEL USUARIO
// ==========================================

    const usuarioRef =
      doc(
        db,
        "usuarios",
        usuario.uid
      );


    const usuarioDoc =
      await getDoc(
        usuarioRef
      );


    if (!usuarioDoc.exists()) {

      alert(
        "No se encontraron los datos de esta cuenta."
      );

      return;

    }


    const datosUsuario =
      usuarioDoc.data();


    if (datosUsuario.rol === "admin") {

      window.location.href =
        "admin.html";

    } else {

      window.location.href =
        "index.html";

    }


  } catch (error) {

    console.error(
      "Error al iniciar sesión:",
      error
    );


    // ==========================================
    // MENSAJES DE ERROR
    // ==========================================

    switch (error.code) {

      case "auth/invalid-email":

        alert(
          "El correo electrónico no es válido."
        );

        break;


      case "auth/invalid-credential":

        alert(
          "El correo o la contraseña son incorrectos."
        );

        break;


      case "auth/user-disabled":

        alert(
          "Esta cuenta ha sido deshabilitada."
        );

        break;


      case "auth/too-many-requests":

        alert(
          "Se realizaron demasiados intentos. Espera un momento e inténtalo nuevamente."
        );

        break;


      case "auth/network-request-failed":

        alert(
          "No se pudo conectar con Firebase. Revisa tu conexión a Internet."
        );

        break;


      default:

        alert(
          "No se pudo iniciar sesión. Revisa tus datos."
        );

        break;

    }


  } finally {

    boton.disabled = false;

    boton.textContent = "Iniciar sesión";

  }

});


// ==========================================
// RECUPERAR CONTRASEÑA
// ==========================================

enlaceRecuperar.addEventListener("click", async (event) => {

  event.preventDefault();


  const correo = inputCorreo.value.trim();


  if (correo === "") {

    alert(
      "Escribe tu correo electrónico primero para recuperar tu contraseña."
    );

    inputCorreo.focus();

    return;
  }


  try {

    await sendPasswordResetEmail(
      auth,
      correo
    );


    alert(
      "Te enviamos un correo para restablecer tu contraseña."
    );


  } catch (error) {

    console.error(
      "Error al recuperar contraseña:",
      error
    );


    switch (error.code) {

      case "auth/invalid-email":

        alert(
          "El correo electrónico ingresado no es válido."
        );

        break;


      case "auth/network-request-failed":

        alert(
          "No se pudo conectar con Firebase."
        );

        break;


      default:

        alert(
          "No se pudo enviar el correo de recuperación."
        );

        break;

    }

  }

});
