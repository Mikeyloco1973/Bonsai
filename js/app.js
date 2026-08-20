// ==========================================
// FIREBASE
// ==========================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// ELEMENTOS DE LA PÁGINA
// ==========================================

const btnLogin =
  document.getElementById("btnLogin");

const sesionActiva =
  document.getElementById("sesionActiva");

const saludoUsuario =
  document.getElementById("saludoUsuario");

const btnCerrarSesion =
  document.getElementById("btnCerrarSesion");

const btnAgendar =
  document.getElementById("btnAgendar");


// Usuario actualmente conectado
let usuarioActual = null;


// ==========================================
// DETECTAR SESIÓN
// ==========================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    usuarioActual = usuario;


    // ======================================
    // USUARIO CON SESIÓN
    // ======================================

    if (usuario) {

      console.log(
        "Usuario conectado:",
        usuario.uid
      );


      // Ocultar iniciar sesión
      if (btnLogin) {

        btnLogin.classList.add(
          "oculto"
        );

      }


      // Mostrar menú de usuario
      if (sesionActiva) {

        sesionActiva.classList.remove(
          "oculto"
        );

      }


      // ======================================
      // BUSCAR NOMBRE EN FIRESTORE
      // ======================================

      try {

        const referenciaUsuario =
          doc(
            db,
            "usuarios",
            usuario.uid
          );


        const documentoUsuario =
          await getDoc(
            referenciaUsuario
          );


        if (documentoUsuario.exists()) {

          const datos =
            documentoUsuario.data();


          console.log(
            "Datos del cliente:",
            datos
          );


          // Mostrar nombre real

          if (saludoUsuario) {

            saludoUsuario.textContent =
              `Hola, ${datos.nombre}`;

          }


        } else {

          // Si por alguna razón no existe
          // el documento en Firestore

          if (
            usuario.displayName &&
            saludoUsuario
          ) {

            const nombre =
              usuario.displayName
                .split(" ")[0];


            saludoUsuario.textContent =
              `Hola, ${nombre}`;

          } else if (saludoUsuario) {

            saludoUsuario.textContent =
              "Hola";

          }

        }


      } catch (error) {

        console.error(
          "Error obteniendo el nombre del usuario:",
          error
        );


        // Usar Authentication como respaldo

        if (
          usuario.displayName &&
          saludoUsuario
        ) {

          const nombre =
            usuario.displayName
              .split(" ")[0];


          saludoUsuario.textContent =
            `Hola, ${nombre}`;

        }

      }


    } else {

      // ======================================
      // SIN SESIÓN
      // ======================================

      console.log(
        "No hay una sesión iniciada."
      );


      if (btnLogin) {

        btnLogin.classList.remove(
          "oculto"
        );

      }


      if (sesionActiva) {

        sesionActiva.classList.add(
          "oculto"
        );

      }

    }

  }
);


// ==========================================
// CERRAR SESIÓN
// ==========================================

if (btnCerrarSesion) {

  btnCerrarSesion.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);


        window.location.href =
          "index.html";


      } catch (error) {

        console.error(
          "Error al cerrar sesión:",
          error
        );


        alert(
          "No se pudo cerrar la sesión."
        );

      }

    }
  );

}


// ==========================================
// BOTÓN AGENDAR
// ==========================================

if (btnAgendar) {

  btnAgendar.addEventListener(
    "click",
    (event) => {

      event.preventDefault();


      // Sin sesión

      if (!usuarioActual) {

        alert(
          "Debes iniciar sesión para agendar una hora."
        );


        window.location.href =
          "login.html";


        return;

      }


      // Con sesión

      window.location.href =
        "agenda.html";

    }
  );

}
