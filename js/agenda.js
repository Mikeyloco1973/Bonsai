import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// DATOS DE LOS SERVICIOS BONSAI
// ==========================================

const servicios = {

  "corte": {
    nombre: "Corte",
    precio: "$40.000",
    precioNumero: 40000,
    precioDesde: false,
    duracionTexto: "1 h 30 min",
    duracion: 90
  },

  "corte-tratamiento": {
    nombre: "Corte + tratamiento",
    precio: "$75.000",
    precioNumero: 75000,
    precioDesde: false,
    duracionTexto: "1 h 30 min",
    duracion: 90
  },

  "tratamiento": {
    nombre: "Tratamiento",
    precio: "$45.000",
    precioNumero: 45000,
    precioDesde: false,
    duracionTexto: "1 h 30 min",
    duracion: 90
  },

  "botox": {
    nombre: "Botox",
    precio: "Desde $60.000",
    precioNumero: 60000,
    precioDesde: true,
    duracionTexto: "3 horas",
    duracion: 180
  },

  "alisado": {
    nombre: "Alisado",
    precio: "Desde $80.000",
    precioNumero: 80000,
    precioDesde: true,
    duracionTexto: "3 horas",
    duracion: 180
  },

  "color-global": {
    nombre: "Color global",
    precio: "Desde $60.000",
    precioNumero: 60000,
    precioDesde: true,
    duracionTexto: "3 horas",
    duracion: 180
  },

  "iluminaciones": {
    nombre: "Iluminaciones",
    precio: "Desde $130.000",
    precioNumero: 130000,
    precioDesde: true,
    duracionTexto: "5 horas",
    duracion: 300
  }

};


// ==========================================
// HORARIO DE JAVII
// ==========================================

const ESTILISTA_ID = "javiera";

const ESTILISTA_NOMBRE = "Javii";


// 10:30
const APERTURA = 630;


// 21:00
const CIERRE = 1260;


// Intervalos de 30 minutos
const INTERVALO = 30;


// ==========================================
// ELEMENTOS HTML
// ==========================================

const servicioSelect =
  document.getElementById("servicio");

const fechaInput =
  document.getElementById("fechaReserva");

const horasContenedor =
  document.getElementById("horasDisponibles");

const mensajeHoras =
  document.getElementById("mensajeHoras");

const detalleServicio =
  document.getElementById("detalleServicio");

const precioServicio =
  document.getElementById("precioServicio");

const duracionServicio =
  document.getElementById("duracionServicio");

const resumenReserva =
  document.getElementById("resumenReserva");

const resumenServicio =
  document.getElementById("resumenServicio");

const resumenFecha =
  document.getElementById("resumenFecha");

const resumenHora =
  document.getElementById("resumenHora");

const btnConfirmar =
  document.getElementById("btnConfirmarReserva");

const btnCerrarSesion =
  document.getElementById("btnCerrarSesion");

const formulario =
  document.getElementById("formAgenda");


// ==========================================
// VARIABLES
// ==========================================

let usuarioActual = null;

let horaSeleccionada = null;

let inicioSeleccionado = null;


// ==========================================
// PROTEGER LA PÁGINA
// ==========================================

onAuthStateChanged(
  auth,
  (usuario) => {

    if (!usuario) {

      alert(
        "Debes iniciar sesión para agendar una hora."
      );

      window.location.href =
        "login.html";

      return;
    }


    usuarioActual = usuario;

  }
);


// ==========================================
// FECHA MÍNIMA
// ==========================================

configurarFechaMinima();


function configurarFechaMinima() {

  const hoy = new Date();

  const anio =
    hoy.getFullYear();

  const mes =
    String(
      hoy.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      hoy.getDate()
    ).padStart(2, "0");


  fechaInput.min =
    `${anio}-${mes}-${dia}`;

}


// ==========================================
// CAMBIO DE SERVICIO
// ==========================================

servicioSelect.addEventListener(
  "change",
  async () => {

    limpiarSeleccion();


    const servicio =
      servicios[
        servicioSelect.value
        ];


    if (!servicio) {

      detalleServicio.classList.add(
        "oculto"
      );

      limpiarHoras();

      return;
    }


    precioServicio.textContent =
      servicio.precio;


    duracionServicio.textContent =
      servicio.duracionTexto;


    detalleServicio.classList.remove(
      "oculto"
    );


    await cargarHorasDisponibles();

  }
);


// ==========================================
// CAMBIO DE FECHA
// ==========================================

fechaInput.addEventListener(
  "change",
  async () => {

    limpiarSeleccion();


    if (!fechaInput.value) {

      limpiarHoras();

      return;
    }


    const fecha =
      crearFechaLocal(
        fechaInput.value
      );


    const diaSemana =
      fecha.getDay();


    // Domingo = 0
    // Lunes = 1

    if (
      diaSemana === 0 ||
      diaSemana === 1
    ) {

      alert(
        "Javii atiende solamente de martes a sábado."
      );


      fechaInput.value = "";

      limpiarHoras();

      return;
    }


    await cargarHorasDisponibles();

  }
);


// ==========================================
// CARGAR HORAS DISPONIBLES
// ==========================================

async function cargarHorasDisponibles() {

  limpiarHoras();


  const servicio =
    servicios[
      servicioSelect.value
      ];


  const fecha =
    fechaInput.value;


  if (!servicio || !fecha) {

    mensajeHoras.textContent =
      "Selecciona primero un servicio y una fecha.";

    return;
  }


  mensajeHoras.textContent =
    "Consultando disponibilidad...";


  try {

    // ==================================
    // CONSULTAR BLOQUES YA OCUPADOS
    // ==================================

    const consulta =
      query(
        collection(
          db,
          "agendaSlots"
        ),
        where(
          "fecha",
          "==",
          fecha
        )
      );


    const resultado =
      await getDocs(
        consulta
      );


    const minutosOcupados =
      new Set();


    resultado.forEach(
      (documento) => {

        const datos =
          documento.data();


        if (
          datos.estilistaId
          === ESTILISTA_ID
        ) {

          minutosOcupados.add(
            datos.minuto
          );

        }

      }
    );


    let cantidadDisponible = 0;


    // ==================================
    // CREAR POSIBLES HORAS
    // ==================================

    for (
      let inicio = APERTURA;

      inicio + servicio.duracion
      <= CIERRE;

      inicio += INTERVALO
    ) {

      // No mostrar horas pasadas
      // si la fecha seleccionada es hoy

      if (
        horaYaPaso(
          fecha,
          inicio
        )
      ) {

        continue;
      }


      const bloquesNecesarios =
        obtenerBloques(
          inicio,
          servicio.duracion
        );


      const existeChoque =
        bloquesNecesarios.some(
          (minuto) =>
            minutosOcupados.has(
              minuto
            )
        );


      if (existeChoque) {

        continue;

      }


      crearBotonHora(
        inicio
      );


      cantidadDisponible++;

    }


    if (
      cantidadDisponible === 0
    ) {

      mensajeHoras.textContent =
        "No hay horas disponibles para este servicio en la fecha seleccionada.";

    } else {

      mensajeHoras.textContent =
        "Selecciona una hora disponible:";

    }


  } catch (error) {

    console.error(
      "Error consultando disponibilidad:",
      error
    );


    mensajeHoras.textContent =
      "No fue posible consultar los horarios. Inténtalo nuevamente.";

  }

}


// ==========================================
// CREAR BOTÓN DE HORA
// ==========================================

function crearBotonHora(
  inicio
) {

  const boton =
    document.createElement(
      "button"
    );


  const horaTexto =
    minutosAHora(
      inicio
    );


  boton.type =
    "button";


  boton.classList.add(
    "hora-btn"
  );


  boton.textContent =
    horaTexto;


  boton.addEventListener(
    "click",
    () => {

      seleccionarHora(
        boton,
        inicio
      );

    }
  );


  horasContenedor.appendChild(
    boton
  );

}


// ==========================================
// SELECCIONAR HORA
// ==========================================

function seleccionarHora(
  boton,
  inicio
) {

  document
    .querySelectorAll(
      ".hora-btn"
    )
    .forEach(
      (elemento) => {

        elemento.classList.remove(
          "hora-seleccionada"
        );

      }
    );


  boton.classList.add(
    "hora-seleccionada"
  );


  inicioSeleccionado =
    inicio;


  horaSeleccionada =
    minutosAHora(
      inicio
    );


  mostrarResumen();

}


// ==========================================
// MOSTRAR RESUMEN
// ==========================================

function mostrarResumen() {

  const servicio =
    servicios[
      servicioSelect.value
      ];


  if (
    !servicio ||
    !fechaInput.value ||
    inicioSeleccionado === null
  ) {

    ocultarResumen();

    return;

  }


  resumenServicio.textContent =
    servicio.nombre;


  const fecha =
    crearFechaLocal(
      fechaInput.value
    );


  resumenFecha.textContent =
    fecha.toLocaleDateString(
      "es-CL",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );


  const horaFin =
    minutosAHora(
      inicioSeleccionado
      +
      servicio.duracion
    );


  resumenHora.textContent =
    `${horaSeleccionada} - ${horaFin}`;


  resumenReserva.classList.remove(
    "oculto"
  );


  btnConfirmar.disabled =
    false;

}


// ==========================================
// CONFIRMAR RESERVA
// ==========================================

formulario.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (!usuarioActual) {

      alert(
        "Tu sesión ha expirado. Inicia sesión nuevamente."
      );

      window.location.href =
        "login.html";

      return;

    }


    const servicio =
      servicios[
        servicioSelect.value
        ];


    if (
      !servicio ||
      !fechaInput.value ||
      inicioSeleccionado === null
    ) {

      alert(
        "Selecciona servicio, fecha y hora."
      );

      return;

    }


    btnConfirmar.disabled =
      true;


    btnConfirmar.textContent =
      "Confirmando reserva...";


    try {

      await guardarReserva(
        servicio
      );


      alert(
        "¡Tu hora fue reservada correctamente!"
      );


      window.location.href =
        "mis-reservas.html";


    } catch (error) {

      console.error(
        "Error al reservar:",
        error
      );


      if (
        error.message
        === "horario-ocupado"
      ) {

        alert(
          "Lo sentimos, esa hora acaba de ser reservada por otra persona. Selecciona otra hora."
        );


        limpiarSeleccion();


        await cargarHorasDisponibles();

      } else {

        alert(
          "No fue posible guardar la reserva. Inténtalo nuevamente."
        );

      }


    } finally {

      btnConfirmar.disabled =
        false;


      btnConfirmar.textContent =
        "Confirmar reserva";

    }

  }
);


// ==========================================
// GUARDAR RESERVA EN FIRESTORE
// ==========================================

async function guardarReserva(
  servicio
) {

  const fecha =
    fechaInput.value;


  const inicio =
    inicioSeleccionado;


  const fin =
    inicio
    +
    servicio.duracion;


  // Crear ID de reserva antes
  // de iniciar la transacción

  const reservaRef =
    doc(
      collection(
        db,
        "reservas"
      )
    );


  const bloques =
    obtenerBloques(
      inicio,
      servicio.duracion
    );


  const slotRefs =
    bloques.map(
      (minuto) => {

        const idSlot =
          `${fecha}_${ESTILISTA_ID}_${minuto}`;


        return doc(
          db,
          "agendaSlots",
          idSlot
        );

      }
    );


  // ======================================
  // TRANSACCIÓN
  // ======================================

  await runTransaction(
    db,
    async (transaction) => {

      /*
       Primero se leen TODOS
       los bloques necesarios.
      */

      const documentosSlots = [];


      for (
        const slotRef
        of slotRefs
        ) {

        const slotDoc =
          await transaction.get(
            slotRef
          );


        documentosSlots.push(
          slotDoc
        );

      }


      /*
       Si cualquiera ya existe,
       otra persona ocupó esa hora.
      */

      for (
        const slotDoc
        of documentosSlots
        ) {

        if (
          slotDoc.exists()
        ) {

          throw new Error(
            "horario-ocupado"
          );

        }

      }


      // ==================================
      // CREAR RESERVA
      // ==================================

      transaction.set(
        reservaRef,
        {

          usuarioId:
          usuarioActual.uid,

          usuarioCorreo:
          usuarioActual.email,

          servicioId:
          servicioSelect.value,

          servicioNombre:
          servicio.nombre,

          precio:
          servicio.precioNumero,

          precioDesde:
          servicio.precioDesde,

          duracionMinutos:
          servicio.duracion,

          estilistaId:
          ESTILISTA_ID,

          estilistaNombre:
          ESTILISTA_NOMBRE,

          fecha:
          fecha,

          horaInicio:
            minutosAHora(
              inicio
            ),

          horaFin:
            minutosAHora(
              fin
            ),

          inicioMinutos:
          inicio,

          finMinutos:
          fin,

          estado:
            "confirmada",

          fechaCreacion:
            serverTimestamp()

        }
      );


      // ==================================
      // BLOQUEAR TRAMOS DE 30 MINUTOS
      // ==================================

      bloques.forEach(
        (minuto, indice) => {

          transaction.set(
            slotRefs[indice],
            {

              fecha:
              fecha,

              estilistaId:
              ESTILISTA_ID,

              minuto:
              minuto,

              reservaId:
              reservaRef.id

            }
          );

        }
      );

    }
  );

}


// ==========================================
// OBTENER BLOQUES DE UNA RESERVA
// ==========================================

function obtenerBloques(
  inicio,
  duracion
) {

  const bloques = [];


  const fin =
    inicio + duracion;


  for (
    let minuto = inicio;

    minuto < fin;

    minuto += INTERVALO
  ) {

    bloques.push(
      minuto
    );

  }


  return bloques;

}


// ==========================================
// COMPROBAR SI LA HORA YA PASÓ
// ==========================================

function horaYaPaso(
  fechaTexto,
  inicioMinutos
) {

  const hoy =
    new Date();


  const fecha =
    crearFechaLocal(
      fechaTexto
    );


  const esHoy =
    fecha.getFullYear()
    === hoy.getFullYear()

    &&
    fecha.getMonth()
    === hoy.getMonth()

    &&
    fecha.getDate()
    === hoy.getDate();


  if (!esHoy) {

    return false;

  }


  const minutosActuales =
    hoy.getHours() * 60
    +
    hoy.getMinutes();


  return (
    inicioMinutos
    <= minutosActuales
  );

}


// ==========================================
// LIMPIAR SELECCIÓN
// ==========================================

function limpiarSeleccion() {

  horaSeleccionada =
    null;


  inicioSeleccionado =
    null;


  ocultarResumen();

}


// ==========================================
// LIMPIAR HORARIOS
// ==========================================

function limpiarHoras() {

  horasContenedor.innerHTML =
    "";

}


// ==========================================
// OCULTAR RESUMEN
// ==========================================

function ocultarResumen() {

  resumenReserva.classList.add(
    "oculto"
  );


  btnConfirmar.disabled =
    true;

}


// ==========================================
// MINUTOS -> HORA
// ==========================================

function minutosAHora(
  minutosTotales
) {

  const horas =
    Math.floor(
      minutosTotales / 60
    );


  const minutos =
    minutosTotales % 60;


  return (
    String(horas)
      .padStart(2, "0")

    +

    ":"

    +

    String(minutos)
      .padStart(2, "0")
  );

}


// ==========================================
// FECHA LOCAL
// ==========================================

function crearFechaLocal(
  fechaTexto
) {

  const partes =
    fechaTexto.split("-");


  return new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

}


// ==========================================
// CERRAR SESIÓN
// ==========================================

btnCerrarSesion.addEventListener(
  "click",
  async () => {

    try {

      await signOut(
        auth
      );


      window.location.href =
        "index.html";


    } catch (error) {

      console.error(
        "Error cerrando sesión:",
        error
      );

    }

  }
);
