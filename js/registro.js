import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// FORMULARIO DE REGISTRO
// ==========================================

const formulario = document.getElementById("formRegistro");

formulario.addEventListener("submit", async (event) => {

  // Evita que la página se recargue
  event.preventDefault();


  // ==========================================
  // OBTENER DATOS
  // ==========================================

  const nombre =
    document.getElementById("nombre").value.trim();

  const apellido =
    document.getElementById("apellido").value.trim();

  const telefono =
    document.getElementById("telefono").value.trim();

  const correo =
    document.getElementById("emailRegistro").value.trim();

  const password =
    document.getElementById("passwordRegistro").value;

  const confirmarPassword =
    document.getElementById("confirmarPassword").value;

  const aceptarTerminos =
    document.getElementById("aceptarTerminos").checked;


  // Botón Crear cuenta
  const boton = formulario.querySelector(".btn-auth");


  // ==========================================
  // VALIDACIONES
  // ==========================================

  if (
    nombre === "" ||
    apellido === "" ||
    telefono === "" ||
    correo === "" ||
    password === "" ||
    confirmarPassword === ""
  ) {

    alert("Completa todos los campos.");

    return;
  }


  if (password !== confirmarPassword) {

    alert("Las contraseñas no coinciden.");

    return;
  }


  if (password.length < 6) {

    alert(
      "La contraseña debe tener al menos 6 caracteres."
    );

    return;
  }


  if (!aceptarTerminos) {

    alert(
      "Debes confirmar que los datos ingresados son correctos."
    );

    return;
  }


  // ==========================================
  // DESACTIVAR BOTÓN
  // ==========================================

  boton.disabled = true;

  boton.textContent = "Creando cuenta...";


  let usuarioCreado = null;


  try {

    // ==========================================
    // CREAR USUARIO EN AUTHENTICATION
    // ==========================================

    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        correo,
        password
      );


    usuarioCreado = credencial.user;


    // ==========================================
    // GUARDAR NOMBRE EN AUTHENTICATION
    // ==========================================

    await updateProfile(
      usuarioCreado,
      {
        displayName: `${nombre} ${apellido}`
      }
    );


    // ==========================================
    // GUARDAR DATOS EN FIRESTORE
    // ==========================================

    await setDoc(
      doc(
        db,
        "usuarios",
        usuarioCreado.uid
      ),
      {
        nombre: nombre,

        apellido: apellido,

        telefono: telefono,

        correo: correo,

        rol: "cliente",

        fechaRegistro: serverTimestamp()
      }
    );


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    // Firebase inicia sesión automáticamente
    // después de registrar al usuario.
    // La cerramos para enviarlo al login.

    await signOut(auth);


    // ==========================================
    // REGISTRO EXITOSO
    // ==========================================

    alert(
      "Cuenta creada correctamente. Ahora puedes iniciar sesión."
    );


    window.location.href = "login.html";


  } catch (error) {

    console.error(
      "Error al crear la cuenta:",
      error
    );


    // ==========================================
    // SI FIRESTORE FALLA
    // ==========================================

    /*
     Si Authentication alcanzó a crear la cuenta,
     pero ocurrió un error guardando los datos,
     intentamos eliminar esa cuenta.
    */

    if (usuarioCreado) {

      try {

        await deleteUser(usuarioCreado);

      } catch (errorEliminar) {

        console.error(
          "No se pudo eliminar la cuenta incompleta:",
          errorEliminar
        );

      }

    }


    // ==========================================
    // ERRORES DE FIREBASE
    // ==========================================

    switch (error.code) {

      case "auth/email-already-in-use":

        alert(
          "Ya existe una cuenta registrada con este correo."
        );

        break;


      case "auth/invalid-email":

        alert(
          "El correo electrónico ingresado no es válido."
        );

        break;


      case "auth/weak-password":

        alert(
          "La contraseña es demasiado débil."
        );

        break;


      case "auth/network-request-failed":

        alert(
          "No se pudo conectar con Firebase. Revisa tu conexión a Internet."
        );

        break;


      case "permission-denied":

        alert(
          "Firestore rechazó el registro. Revisa las reglas de seguridad."
        );

        break;


      default:

        alert(
          "No se pudo crear la cuenta. Inténtalo nuevamente."
        );

        break;
    }


  } finally {

    // Volver a activar botón

    boton.disabled = false;

    boton.textContent = "Crear cuenta";

  }

});
