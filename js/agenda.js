// ==================================================
// BONSAI
// AGENDA CLIENTAS
// ==================================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// CONFIGURACIÓN
// ==================================================

const ESTILISTA_ID =
  "javiera";

const ESTILISTA_NOMBRE =
  "Javii";

const APERTURA =
  630; // 10:30

const CIERRE =
  1260; // 21:00

const INTERVALO =
  30;


// ==================================================
// VARIABLES
// ==================================================

let usuarioActual =
  null;


let servicios =
  {};


let horaSeleccionada =
  null;


let reservaEnProceso =
  false;


// ==================================================
// ELEMENTOS
// ==================================================

const formAgenda =
  document.getElementById(
    "formAgenda"
  );


const servicioSelect =
  document.getElementById(
    "servicio"
  );


const fechaReserva =
  document.getElementById(
    "fechaReserva"
  );


const horasDisponibles =
  document.getElementById(
    "horasDisponibles"
  );


const mensajeHoras =
  document.getElementById(
    "mensajeHoras"
  );


const detalleServicio =
  document.getElementById(
    "detalleServicio"
  );


const precioServicio =
  document.getElementById(
    "precioServicio"
  );


const duracionServicio =
  document.getElementById(
    "duracionServicio"
  );


const resumenReserva =
  document.getElementById(
    "resumenReserva"
  );


const resumenServicio =
  document.getElementById(
    "resumenServicio"
  );


const resumenFecha =
  document.getElementById(
    "resumenFecha"
  );


const resumenHora =
  document.getElementById(
    "resumenHora"
  );


const btnConfirmarReserva =
  document.getElementById(
    "btnConfirmarReserva"
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


    iniciarAgenda();


    await cargarServicios();

  }
);


// ==================================================
// INICIAR
// ==================================================

function iniciarAgenda() {

  fechaReserva.min =
    obtenerFechaHoy();


  btnConfirmarReserva.disabled =
    true;


  detalleServicio.classList.add(
    "oculto"
  );


  resumenReserva.classList.add(
    "oculto"
  );


  horasDisponibles.innerHTML =
    "";


  mensajeHoras.textContent =
    "Selecciona un servicio y una fecha.";


  servicioSelect.innerHTML = `

        <option value="">
            Selecciona un servicio
        </option>

    `;

}


// ==================================================
// CARGAR SERVICIOS FIRESTORE
// ==================================================

async function cargarServicios() {

  servicioSelect.disabled =
    true;


  try {

    const resultado =
      await getDocs(
        collection(
          db,
          "servicios"
        )
      );


    const lista =
      [];


    resultado.forEach(
      (documento) => {

        const datos =
          documento.data();


        if (
          datos.activo
          !== true
        ) {

          return;

        }


        lista.push({

          id:
          documento.id,

          ...datos

        });

      }
    );


    lista.sort(
      (a, b) =>

        Number(
          a.orden || 999
        )

        -

        Number(
          b.orden || 999
        )
    );


    servicios =
      {};


    lista.forEach(
      (servicio) => {

        servicios[
          servicio.id
          ] = servicio;


        const opcion =
          document.createElement(
            "option"
          );


        opcion.value =
          servicio.id;


        opcion.textContent =
          servicio.nombre;


        servicioSelect.appendChild(
          opcion
        );

      }
    );

    // ==================================================
// SERVICIO RECIBIDO DESDE LA PÁGINA PRINCIPAL
// ==================================================

    const parametros =
      new URLSearchParams(
        window.location.search
      );


    const servicioURL =
      parametros.get(
        "servicio"
      );


    if (
      servicioURL
      &&
      servicios[
        servicioURL
        ]
    ) {

      servicioSelect.value =
        servicioURL;


      mostrarDetalleServicio(
        servicios[
          servicioURL
          ]
      );


      mensajeHoras.textContent =
        "Ahora selecciona una fecha.";

    }

    if (
      lista.length === 0
    ) {

      mensajeHoras.textContent =
        "No hay servicios disponibles en este momento.";

    }


  } catch (error) {

    console.error(
      "Error cargando servicios:",
      error
    );


    mensajeHoras.textContent =
      "No fue posible cargar los servicios.";

  } finally {

    servicioSelect.disabled =
      false;

  }

}


// ==================================================
// CAMBIO SERVICIO
// ==================================================

servicioSelect.addEventListener(
  "change",
  async () => {

    horaSeleccionada =
      null;


    ocultarResumen();


    const servicio =
      obtenerServicioSeleccionado();


    if (!servicio) {

      detalleServicio.classList.add(
        "oculto"
      );


      limpiarHoras(
        "Selecciona un servicio."
      );


      return;

    }


    mostrarDetalleServicio(
      servicio
    );


    if (
      fechaReserva.value
      &&
      fechaEsValida(
        fechaReserva.value
      )
    ) {

      await cargarHorasDisponibles();

    } else {

      limpiarHoras(
        "Selecciona una fecha."
      );

    }

  }
);


// ==================================================
// CAMBIO FECHA
// ==================================================

fechaReserva.addEventListener(
  "change",
  async () => {

    horaSeleccionada =
      null;


    ocultarResumen();


    const fecha =
      fechaReserva.value;


    if (!fecha) {

      limpiarHoras(
        "Selecciona una fecha."
      );


      return;

    }


    if (
      fecha <
      obtenerFechaHoy()
    ) {

      alert(
        "No puedes seleccionar una fecha anterior a hoy."
      );


      fechaReserva.value =
        "";


      limpiarHoras(
        "Selecciona una fecha válida."
      );


      return;

    }


    if (
      !fechaAtencionValida(
        fecha
      )
    ) {

      alert(
        "Javii atiende de martes a sábado."
      );


      fechaReserva.value =
        "";


      limpiarHoras(
        "Selecciona una fecha entre martes y sábado."
      );


      return;

    }


    if (
      !obtenerServicioSeleccionado()
    ) {

      limpiarHoras(
        "Selecciona primero un servicio."
      );


      return;

    }


    await cargarHorasDisponibles();

  }
);


// ==================================================
// OBTENER SERVICIO
// ==================================================

function obtenerServicioSeleccionado() {

  const id =
    servicioSelect.value;


  if (
    !id
    ||
    !servicios[id]
  ) {

    return null;

  }


  return {

    id:
    id,

    ...servicios[id]

  };

}


// ==================================================
// DETALLE SERVICIO
// ==================================================

function mostrarDetalleServicio(
  servicio
) {

  precioServicio.textContent =
    formatearPrecio(
      servicio.precio,
      servicio.precioDesde
    );


  duracionServicio.textContent =
    formatearDuracion(
      servicio.duracionMinutos
    );


  detalleServicio.classList.remove(
    "oculto"
  );

}


// ==================================================
// HORAS DISPONIBLES
// ==================================================

async function cargarHorasDisponibles() {

  const servicio =
    obtenerServicioSeleccionado();


  const fecha =
    fechaReserva.value;


  horaSeleccionada =
    null;


  ocultarResumen();


  horasDisponibles.innerHTML =
    "";


  btnConfirmarReserva.disabled =
    true;


  if (
    !servicio
    ||
    !fecha
  ) {

    return;

  }


  mensajeHoras.textContent =
    "Consultando horarios disponibles...";


  try {

    const [
      slotsOcupados,
      bloqueos
    ] = await Promise.all([

      obtenerSlotsOcupados(
        fecha
      ),

      obtenerBloqueosFecha(
        fecha
      )

    ]);


    let disponibles =
      0;


    for (
      let inicio = APERTURA;

      inicio
      +
      servicio.duracionMinutos
      <=
      CIERRE;

      inicio += INTERVALO
    ) {

      const fin =
        inicio
        +
        servicio.duracionMinutos;


      if (
        horaYaPaso(
          fecha,
          inicio
        )
      ) {

        continue;

      }


      const bloques =
        obtenerBloques(
          inicio,
          servicio.duracionMinutos
        );


      const ocupado =
        bloques.some(
          (minuto) =>
            slotsOcupados.has(
              minuto
            )
        );


      if (ocupado) {

        continue;

      }


      if (
        hayChoqueConBloqueo(
          inicio,
          fin,
          bloqueos
        )
      ) {

        continue;

      }


      crearBotonHora(
        inicio,
        fin,
        servicio
      );


      disponibles++;

    }


    mensajeHoras.textContent =
      disponibles === 0

        ? "No hay horarios disponibles para este servicio en esa fecha."

        : "Selecciona una hora disponible:";


  } catch (error) {

    console.error(
      "Error cargando horarios:",
      error
    );


    mensajeHoras.textContent =
      "No fue posible consultar los horarios.";

  }

}


// ==================================================
// SLOTS OCUPADOS
// ==================================================

async function obtenerSlotsOcupados(
  fecha
) {

  const resultado =
    await getDocs(
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
      )
    );


  const ocupados =
    new Set();


  resultado.forEach(
    (documento) => {

      const datos =
        documento.data();


      if (
        datos.estilistaId
        === ESTILISTA_ID
      ) {

        ocupados.add(
          Number(
            datos.minuto
          )
        );

      }

    }
  );


  return ocupados;

}


// ==================================================
// BLOQUEOS
// ==================================================

async function obtenerBloqueosFecha(
  fecha
) {

  const resultado =
    await getDocs(
      query(
        collection(
          db,
          "bloqueos"
        ),
        where(
          "fecha",
          "==",
          fecha
        )
      )
    );


  const bloqueos =
    [];


  resultado.forEach(
    (documento) => {

      const datos =
        documento.data();


      if (
        datos.estilistaId
        === ESTILISTA_ID
      ) {

        bloqueos.push(
          datos
        );

      }

    }
  );


  return bloqueos;

}


// ==================================================
// CHOQUE BLOQUEO
// ==================================================

function hayChoqueConBloqueo(
  inicio,
  fin,
  bloqueos
) {

  return bloqueos.some(
    (bloqueo) => {

      if (
        bloqueo.diaCompleto
        === true
      ) {

        return true;

      }


      return (

        inicio
        <
        Number(
          bloqueo.finMinutos
        )

        &&

        fin
        >
        Number(
          bloqueo.inicioMinutos
        )

      );

    }
  );

}


// ==================================================
// BOTÓN HORA
// ==================================================

function crearBotonHora(
  inicio,
  fin,
  servicio
) {

  const boton =
    document.createElement(
      "button"
    );


  boton.type =
    "button";


  boton.classList.add(
    "hora-btn"
  );


  boton.textContent =
    minutosAHora(
      inicio
    );


  boton.addEventListener(
    "click",
    () => {

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


      horaSeleccionada =
        inicio;


      mostrarResumen(
        servicio,
        inicio,
        fin
      );

    }
  );


  horasDisponibles.appendChild(
    boton
  );

}


// ==================================================
// RESUMEN
// ==================================================

function mostrarResumen(
  servicio,
  inicio,
  fin
) {

  resumenServicio.textContent =
    servicio.nombre;


  resumenFecha.textContent =
    formatearFecha(
      fechaReserva.value
    );


  resumenHora.textContent =
    `${minutosAHora(inicio)} - ${minutosAHora(fin)}`;


  resumenReserva.classList.remove(
    "oculto"
  );


  btnConfirmarReserva.disabled =
    false;

}


function ocultarResumen() {

  resumenReserva.classList.add(
    "oculto"
  );


  btnConfirmarReserva.disabled =
    true;


  horaSeleccionada =
    null;

}


function limpiarHoras(
  mensaje
) {

  horasDisponibles.innerHTML =
    "";


  mensajeHoras.textContent =
    mensaje;


  horaSeleccionada =
    null;


  btnConfirmarReserva.disabled =
    true;

}


// ==================================================
// CREAR SOLICITUD
// ==================================================

formAgenda.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    if (reservaEnProceso) {

      return;

    }


    const servicio =
      obtenerServicioSeleccionado();


    const fecha =
      fechaReserva.value;


    if (
      !usuarioActual
      ||
      !servicio
      ||
      !fecha
      ||
      horaSeleccionada === null
    ) {

      alert(
        "Completa todos los datos de la reserva."
      );


      return;

    }


    // ==================================================
    // VOLVER A LEER EL SERVICIO DESDE FIRESTORE
    // ==================================================
    //
    // Así no confiamos solamente en la información que
    // quedó cargada anteriormente en el navegador.
    // ==================================================

    try {

      reservaEnProceso =
        true;


      btnConfirmarReserva.disabled =
        true;


      btnConfirmarReserva.textContent =
        "Enviando solicitud...";


      const servicioDoc =
        await getDoc(
          doc(
            db,
            "servicios",
            servicio.id
          )
        );


      if (
        !servicioDoc.exists()
        ||
        servicioDoc.data().activo
        !== true
      ) {

        alert(
          "Este servicio ya no está disponible."
        );


        await cargarServicios();


        return;

      }


      const servicioActual =
        {

          id:
          servicio.id,

          ...servicioDoc.data()

        };


      const fin =
        horaSeleccionada
        +
        servicioActual
          .duracionMinutos;


      if (
        horaSeleccionada
        +
        servicioActual.duracionMinutos
        >
        CIERRE
      ) {

        alert(
          "La duración del servicio cambió. Selecciona nuevamente un horario."
        );


        await cargarHorasDisponibles();


        return;

      }


      const bloqueos =
        await obtenerBloqueosFecha(
          fecha
        );


      if (
        hayChoqueConBloqueo(
          horaSeleccionada,
          fin,
          bloqueos
        )
      ) {

        alert(
          "Ese horario ya no está disponible."
        );


        await cargarHorasDisponibles();


        return;

      }


      await crearReserva(
        servicioActual,
        fecha,
        horaSeleccionada
      );


      alert(
        "Tu solicitud fue enviada correctamente. Javii debe aceptar tu hora."
      );


      window.location.href =
        "mis-reservas.html";


    } catch (error) {

      console.error(
        "Error creando reserva:",
        error
      );


      if (
        error.message
        === "horario-ocupado"
      ) {

        alert(
          "Ese horario acaba de ser reservado. Selecciona otra hora."
        );


        await cargarHorasDisponibles();

      } else {

        alert(
          "No fue posible enviar tu solicitud."
        );

      }


    } finally {

      reservaEnProceso =
        false;


      btnConfirmarReserva.textContent =
        "Confirmar reserva";


      if (
        horaSeleccionada !== null
      ) {

        btnConfirmarReserva.disabled =
          false;

      }

    }

  }
);


// ==================================================
// CREAR RESERVA FIRESTORE
// ==================================================

async function crearReserva(
  servicio,
  fecha,
  inicio
) {

  const duracion =
    Number(
      servicio.duracionMinutos
    );


  const fin =
    inicio
    +
    duracion;


  const reservaRef =
    doc(
      collection(
        db,
        "reservas"
      )
    );


  const referenciasSlots =
    [];


  for (
    let minuto = inicio;

    minuto < fin;

    minuto += INTERVALO
  ) {

    referenciasSlots.push({

      minuto:
      minuto,

      ref:
        doc(
          db,
          "agendaSlots",
          `${fecha}_${ESTILISTA_ID}_${minuto}`
        )

    });

  }


  await runTransaction(
    db,
    async (transaction) => {

      const documentosSlots =
        [];


      // TODAS LAS LECTURAS PRIMERO

      for (
        const slot
        of referenciasSlots
        ) {

        documentosSlots.push({

          ...slot,

          documento:
            await transaction.get(
              slot.ref
            )

        });

      }


      if (
        documentosSlots.some(
          (slot) =>
            slot.documento.exists()
        )
      ) {

        throw new Error(
          "horario-ocupado"
        );

      }


      transaction.set(
        reservaRef,
        {

          usuarioId:
          usuarioActual.uid,

          usuarioCorreo:
            usuarioActual.email || "",


          servicioId:
          servicio.id,

          servicioNombre:
          servicio.nombre,

          precio:
            Number(
              servicio.precio
            ),

          precioDesde:
            servicio.precioDesde
            === true,

          duracionMinutos:
          duracion,


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
            "pendiente",

          motivoCambio:
            null,

          motivoCancelacion:
            null,

          canceladaPor:
            null,

          reagendada:
            false,


          fechaCreacion:
            serverTimestamp()

        }
      );


      documentosSlots.forEach(
        (slot) => {

          transaction.set(
            slot.ref,
            {

              fecha:
              fecha,

              estilistaId:
              ESTILISTA_ID,

              minuto:
              slot.minuto,

              reservaId:
              reservaRef.id

            }
          );

        }
      );

    }
  );

}


// ==================================================
// BLOQUES
// ==================================================

function obtenerBloques(
  inicio,
  duracion
) {

  const bloques =
    [];


  const fin =
    inicio
    +
    duracion;


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


// ==================================================
// FECHAS
// ==================================================

function fechaEsValida(
  fecha
) {

  return (
    fecha >= obtenerFechaHoy()
    &&
    fechaAtencionValida(
      fecha
    )
  );

}


function fechaAtencionValida(
  fechaTexto
) {

  const fecha =
    crearFechaLocal(
      fechaTexto
    );


  const dia =
    fecha.getDay();


  return (
    dia !== 0
    &&
    dia !== 1
  );

}


function horaYaPaso(
  fechaTexto,
  inicio
) {

  const ahora =
    new Date();


  const fecha =
    crearFechaLocal(
      fechaTexto
    );


  const esHoy =

    fecha.getFullYear()
    === ahora.getFullYear()

    &&

    fecha.getMonth()
    === ahora.getMonth()

    &&

    fecha.getDate()
    === ahora.getDate();


  if (!esHoy) {

    return false;

  }


  const minutosActuales =
    ahora.getHours()
    *
    60

    +
    ahora.getMinutes();


  return (
    inicio <= minutosActuales
  );

}


function obtenerFechaHoy() {

  const hoy =
    new Date();


  return [

    hoy.getFullYear(),

    String(
      hoy.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      hoy.getDate()
    ).padStart(
      2,
      "0"
    )

  ].join("-");

}


function crearFechaLocal(
  fechaTexto
) {

  const partes =
    fechaTexto.split("-");


  return new Date(

    Number(
      partes[0]
    ),

    Number(
      partes[1]
    ) - 1,

    Number(
      partes[2]
    )

  );

}


function formatearFecha(
  fechaTexto
) {

  return crearFechaLocal(
    fechaTexto
  ).toLocaleDateString(
    "es-CL",
    {

      weekday:
        "long",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric"

    }
  );

}


// ==================================================
// HORAS
// ==================================================

function minutosAHora(
  total
) {

  const horas =
    Math.floor(
      total / 60
    );


  const minutos =
    total % 60;


  return (
    String(
      horas
    ).padStart(
      2,
      "0"
    )

    +

    ":"

    +

    String(
      minutos
    ).padStart(
      2,
      "0"
    )
  );

}


// ==================================================
// DURACIÓN
// ==================================================

function formatearDuracion(
  minutos
) {

  const horas =
    Math.floor(
      minutos / 60
    );


  const resto =
    minutos % 60;


  if (
    horas === 0
  ) {

    return `${resto} min`;

  }


  if (
    resto === 0
  ) {

    return (
      horas === 1
        ? "1 hora"
        : `${horas} horas`
    );

  }


  return `${horas} h ${resto} min`;

}


// ==================================================
// PRECIO
// ==================================================

function formatearPrecio(
  precio,
  desde
) {

  const valor =
    new Intl.NumberFormat(
      "es-CL",
      {

        style:
          "currency",

        currency:
          "CLP",

        maximumFractionDigits:
          0

      }
    ).format(
      Number(
        precio
      )
    );


  return desde
    ? `Desde ${valor}`
    : valor;

}
