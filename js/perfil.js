// ==================================================
// BONSAI
// PERFIL DE CLIENTA
// ==================================================

import {
  auth,
  db
} from "./firebase-config.js";

import {
  onAuthStateChanged,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// VARIABLES
// ==================================================

let usuarioActual =
  null;


// ==================================================
// ELEMENTOS
// ==================================================

const perfilAvatar =
  document.getElementById(
    "perfilAvatar"
  );


const perfilNombreTitulo =
  document.getElementById(
    "perfilNombreTitulo"
  );


const perfilCargando =
  document.getElementById(
    "perfilCargando"
  );


const formPerfil =
  document.getElementById(
    "formPerfil"
  );


const perfilNombre =
  document.getElementById(
    "perfilNombre"
  );


const perfilApellido =
  document.getElementById(
    "perfilApellido"
  );


const perfilTelefono =
  document.getElementById(
    "perfilTelefono"
  );


const perfilCorreo =
  document.getElementById(
    "perfilCorreo"
  );


const perfilMensaje =
  document.getElementById(
    "perfilMensaje"
  );


const btnGuardarPerfil =
  document.getElementById(
    "btnGuardarPerfil"
  );


const btnCerrarSesion =
  document.getElementById(
    "btnCerrarSesion"
  );


// ==================================================
// SESIÓN
// ==================================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (!usuario) {

      window.location.href =
        "login.html";

      return;

    }


    usuarioActual =
      usuario;


    await cargarPerfil();

  }
);


// ==================================================
// CARGAR PERFIL
// ==================================================

async function cargarPerfil() {

  perfilCargando.classList.remove(
    "oculto"
  );


  formPerfil.classList.add(
    "oculto"
  );


  ocultarMensaje();


  try {

    const referencia =
      doc(
        db,
        "usuarios",
        usuarioActual.uid
      );


    const documento =
      await getDoc(
        referencia
      );


    if (
      !documento.exists()
    ) {

      throw new Error(
        "perfil-no-existe"
      );

    }


    const datos =
      documento.data();


    // ==================================================
    // COMPROBAR QUE NO SEA ADMIN
    // ==================================================

    if (
      datos.rol === "admin"
    ) {

      window.location.href =
        "admin.html";

      return;

    }


    const nombre =
      String(
        datos.nombre
        ||
        usuarioActual.displayName
        ||
        ""
      ).trim();


    const apellido =
      String(
        datos.apellido
        ||
        datos.apellidos
        ||
        datos.surname
        ||
        ""
      ).trim();


    const telefono =
      String(
        datos.telefono
        ||
        datos.phone
        ||
        ""
      ).trim();


    const correo =
      String(
        datos.correo
        ||
        datos.email
        ||
        usuarioActual.email
        ||
        ""
      ).trim();


    // ==================================================
    // RELLENAR FORMULARIO
    // ==================================================

    perfilNombre.value =
      nombre;


    perfilApellido.value =
      apellido;


    perfilTelefono.value =
      formatearTelefonoVisual(
        telefono
      );


    perfilCorreo.value =
      correo;


    actualizarPresentacion(
      nombre,
      apellido
    );


    perfilCargando.classList.add(
      "oculto"
    );


    formPerfil.classList.remove(
      "oculto"
    );


  } catch (error) {

    console.error(
      "Error cargando perfil:",
      error
    );


    perfilCargando.textContent =
      "No fue posible cargar tu perfil.";

  }

}


// ==================================================
// GUARDAR CAMBIOS
// ==================================================

formPerfil.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    if (!usuarioActual) {

      return;

    }


    ocultarMensaje();


    const nombre =
      perfilNombre.value
        .trim();


    const apellido =
      perfilApellido.value
        .trim();


    const telefono =
      normalizarTelefonoChile(
        perfilTelefono.value
      );


    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (
      nombre.length < 2
    ) {

      mostrarMensaje(
        "Ingresa un nombre válido.",
        "error"
      );


      perfilNombre.focus();


      return;

    }


    if (
      apellido.length < 2
    ) {

      mostrarMensaje(
        "Ingresa un apellido válido.",
        "error"
      );


      perfilApellido.focus();


      return;

    }


    if (!telefono) {

      mostrarMensaje(
        "Ingresa un número de WhatsApp chileno válido. Ejemplo: +56 9 1234 5678.",
        "error"
      );


      perfilTelefono.focus();


      return;

    }


    btnGuardarPerfil.disabled =
      true;


    btnGuardarPerfil.textContent =
      "Guardando...";


    try {

      // ==================================================
      // FIRESTORE
      // ==================================================

      await updateDoc(
        doc(
          db,
          "usuarios",
          usuarioActual.uid
        ),
        {

          nombre:
          nombre,

          apellido:
          apellido,

          telefono:
          telefono,

          fechaActualizacion:
            serverTimestamp()

        }
      );


      // ==================================================
      // FIREBASE AUTH
      // ==================================================

      await updateProfile(
        usuarioActual,
        {

          displayName:
          nombre

        }
      );


      // ==================================================
      // INTERFAZ
      // ==================================================

      perfilTelefono.value =
        formatearTelefonoVisual(
          telefono
        );


      actualizarPresentacion(
        nombre,
        apellido
      );


      mostrarMensaje(
        "Tus datos fueron actualizados correctamente.",
        "exito"
      );


    } catch (error) {

      console.error(
        "Error guardando perfil:",
        error
      );


      mostrarMensaje(
        "No fue posible guardar los cambios.",
        "error"
      );


    } finally {

      btnGuardarPerfil.disabled =
        false;


      btnGuardarPerfil.textContent =
        "Guardar cambios";

    }

  }
);


// ==================================================
// ACTUALIZAR PRESENTACIÓN
// ==================================================

function actualizarPresentacion(
  nombre,
  apellido
) {

  const nombreCompleto =
    `${nombre} ${apellido}`
      .trim();


  perfilNombreTitulo.textContent =
    nombreCompleto
    ||
    "Mi perfil";


  perfilAvatar.textContent =
    obtenerIniciales(
      nombreCompleto
    );

}


// ==================================================
// NORMALIZAR TELÉFONO CHILE
// ==================================================

function normalizarTelefonoChile(
  telefono
) {

  let numero =
    String(
      telefono || ""
    ).replace(
      /\D/g,
      ""
    );


  // ==================================================
  // 9 1234 5678
  // ==================================================

  if (
    numero.length === 9
    &&
    numero.startsWith("9")
  ) {

    return `+56${numero}`;

  }


  // ==================================================
  // 09 1234 5678
  // ==================================================

  if (
    numero.length === 10
    &&
    numero.startsWith("09")
  ) {

    numero =
      numero.substring(1);


    return `+56${numero}`;

  }


  // ==================================================
  // 56 9 1234 5678
  // ==================================================

  if (
    numero.length === 11
    &&
    numero.startsWith("569")
  ) {

    return `+${numero}`;

  }


  return "";

}


// ==================================================
// MOSTRAR TELÉFONO BONITO
// ==================================================

function formatearTelefonoVisual(
  telefono
) {

  const normalizado =
    normalizarTelefonoChile(
      telefono
    );


  if (!normalizado) {

    return telefono || "";

  }


  const numero =
    normalizado.replace(
      /\D/g,
      ""
    );


  // 56912345678

  return (
    `+56 9 `
    +
    `${numero.substring(3, 7)} `
    +
    `${numero.substring(7, 11)}`
  );

}


// ==================================================
// INICIALES
// ==================================================

function obtenerIniciales(
  nombre
) {

  const partes =
    String(
      nombre || ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (
    partes.length === 0
  ) {

    return "B";

  }


  if (
    partes.length === 1
  ) {

    return partes[0]
      .charAt(0)
      .toUpperCase();

  }


  return (
    partes[0].charAt(0)
    +
    partes[1].charAt(0)
  ).toUpperCase();

}


// ==================================================
// MENSAJES
// ==================================================

function mostrarMensaje(
  texto,
  tipo
) {

  perfilMensaje.textContent =
    texto;


  perfilMensaje.classList.remove(
    "oculto",
    "perfil-mensaje-error",
    "perfil-mensaje-exito"
  );


  perfilMensaje.classList.add(
    tipo === "exito"
      ? "perfil-mensaje-exito"
      : "perfil-mensaje-error"
  );

}


function ocultarMensaje() {

  perfilMensaje.classList.add(
    "oculto"
  );


  perfilMensaje.classList.remove(
    "perfil-mensaje-error",
    "perfil-mensaje-exito"
  );

}


// ==================================================
// CERRAR SESIÓN
// ==================================================

btnCerrarSesion.addEventListener(
  "click",
  async () => {

    try {

      await signOut(
        auth
      );


      window.location.href =
        "login.html";


    } catch (error) {

      console.error(
        "Error cerrando sesión:",
        error
      );


      alert(
        "No fue posible cerrar la sesión."
      );

    }

  }
);
