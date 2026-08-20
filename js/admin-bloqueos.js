// ==================================================
// BONSAI
// BLOQUEO DE HORARIOS - ADMINISTRACIÓN
// ==================================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// CONFIGURACIÓN
// ==================================================

const ESTILISTA_ID =
  "javiera";

const APERTURA =
  630; // 10:30

const CIERRE =
  1260; // 21:00

const INTERVALO =
  30;


// ==================================================
// ELEMENTOS
// ==================================================

const bloqueoFecha =
  document.getElementById(
    "bloqueoFecha"
  );


const bloqueoHorarios =
  document.getElementById(
    "bloqueoHorarios"
  );


const bloqueoDesde =
  document.getElementById(
    "bloqueoDesde"
  );


const bloqueoHasta =
  document.getElementById(
    "bloqueoHasta"
  );


const bloqueoMotivo =
  document.getElementById(
    "bloqueoMotivo"
  );


const btnCrearBloqueo =
  document.getElementById(
    "btnCrearBloqueo"
  );


const listaBloqueos =
  document.getElementById(
    "listaBloqueos"
  );


const cargandoBloqueos =
  document.getElementById(
    "cargandoBloqueos"
  );


// ==================================================
// INICIAR
// ==================================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (!usuario) {

      return;

    }


    try {

      const usuarioDoc =
        await getDoc(
          doc(
            db,
            "usuarios",
            usuario.uid
          )
        );


      if (
        !usuarioDoc.exists()
        ||
        usuarioDoc.data().rol
        !== "admin"
      ) {

        return;

      }


      iniciarModuloBloqueos();


      await cargarBloqueos();


    } catch (error) {

      console.error(
        "Error iniciando módulo de bloqueos:",
        error
      );


      if (cargandoBloqueos) {

        cargandoBloqueos.textContent =
          "No fue posible cargar los bloqueos.";

      }

    }

  }
);


// ==================================================
// INICIAR MÓDULO
// ==================================================

function iniciarModuloBloqueos() {

  bloqueoFecha.min =
    obtenerFechaHoy();


  bloqueoFecha.value =
    obtenerFechaHoy();


  generarHorarios();


  actualizarTipoBloqueo();

}


// ==================================================
// GENERAR HORARIOS
// ==================================================

function generarHorarios() {

  bloqueoDesde.replaceChildren();

  bloqueoHasta.replaceChildren();


  // ==================================================
  // DESDE
  // ==================================================

  for (
    let minuto = APERTURA;

    minuto < CIERRE;

    minuto += INTERVALO
  ) {

    const opcion =
      document.createElement(
        "option"
      );


    opcion.value =
      String(
        minuto
      );


    opcion.textContent =
      minutosAHora(
        minuto
      );


    bloqueoDesde.appendChild(
      opcion
    );

  }


  // ==================================================
  // HASTA
  // ==================================================

  for (
    let minuto =
      APERTURA + INTERVALO;

    minuto <= CIERRE;

    minuto += INTERVALO
  ) {

    const opcion =
      document.createElement(
        "option"
      );


    opcion.value =
      String(
        minuto
      );


    opcion.textContent =
      minutosAHora(
        minuto
      );


    bloqueoHasta.appendChild(
      opcion
    );

  }


  // Valores iniciales

  bloqueoDesde.value =
    "840"; // 14:00


  bloqueoHasta.value =
    "1050"; // 17:30

}


// ==================================================
// TIPO DE BLOQUEO
// ==================================================

document
  .querySelectorAll(
    'input[name="tipoBloqueo"]'
  )
  .forEach(
    (radio) => {

      radio.addEventListener(
        "change",
        actualizarTipoBloqueo
      );

    }
  );


function actualizarTipoBloqueo() {

  const tipo =
    obtenerTipoBloqueo();


  if (
    tipo === "dia"
  ) {

    bloqueoHorarios.classList.add(
      "oculto"
    );


    btnCrearBloqueo.textContent =
      "Bloquear día completo";


  } else {

    bloqueoHorarios.classList.remove(
      "oculto"
    );


    btnCrearBloqueo.textContent =
      "Bloquear horario";

  }

}


// ==================================================
// OBTENER TIPO
// ==================================================

function obtenerTipoBloqueo() {

  const seleccionado =
    document.querySelector(
      'input[name="tipoBloqueo"]:checked'
    );


  return seleccionado
    ? seleccionado.value
    : "horario";

}


// ==================================================
// CREAR BLOQUEO
// ==================================================

btnCrearBloqueo.addEventListener(
  "click",
  async () => {

    const fecha =
      bloqueoFecha.value;


    const motivo =
      bloqueoMotivo
        .value
        .trim();


    const tipo =
      obtenerTipoBloqueo();


    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (!fecha) {

      alert(
        "Selecciona una fecha."
      );

      return;

    }


    if (
      fecha <
      obtenerFechaHoy()
    ) {

      alert(
        "No puedes bloquear una fecha anterior a hoy."
      );

      return;

    }


    if (
      !fechaAtencionValida(
        fecha
      )
    ) {

      alert(
        "Javii atiende solamente de martes a sábado."
      );

      return;

    }


    if (
      motivo.length < 3
    ) {

      alert(
        "Ingresa el motivo del bloqueo."
      );


      bloqueoMotivo.focus();


      return;

    }


    let inicioMinutos =
      APERTURA;


    let finMinutos =
      CIERRE;


    let diaCompleto =
      false;


    if (
      tipo === "horario"
    ) {

      inicioMinutos =
        Number(
          bloqueoDesde.value
        );


      finMinutos =
        Number(
          bloqueoHasta.value
        );


      if (
        finMinutos <= inicioMinutos
      ) {

        alert(
          "La hora final debe ser posterior a la hora inicial."
        );

        return;

      }


    } else {

      diaCompleto =
        true;

    }


    btnCrearBloqueo.disabled =
      true;


    btnCrearBloqueo.textContent =
      "Comprobando disponibilidad...";


    try {

      await crearBloqueoAtomico(
        {
          fecha,
          motivo,
          inicioMinutos,
          finMinutos,
          diaCompleto
        }
      );


      alert(
        diaCompleto
          ? "Día bloqueado correctamente."
          : "Horario bloqueado correctamente."
      );


      bloqueoMotivo.value =
        "";


      await cargarBloqueos();


    } catch (error) {

      console.error(
        "Error creando bloqueo:",
        error
      );


      if (
        error.message
        === "horario-ocupado"
      ) {

        alert(
          "No se puede crear el bloqueo porque parte de ese horario ya está ocupado por una reserva o por otro bloqueo."
        );


      } else {

        alert(
          "No fue posible crear el bloqueo."
        );

      }


    } finally {

      btnCrearBloqueo.disabled =
        false;


      actualizarTipoBloqueo();

    }

  }
);


// ==================================================
// CREAR BLOQUEO ATÓMICAMENTE
// ==================================================

async function crearBloqueoAtomico(
  {
    fecha,
    motivo,
    inicioMinutos,
    finMinutos,
    diaCompleto
  }
) {

  // Creamos el ID del bloqueo antes
  // de comenzar la transacción.

  const bloqueoRef =
    doc(
      collection(
        db,
        "bloqueos"
      )
    );


  // ==================================================
  // DOCUMENTOS agendaSlots QUE NECESITAMOS
  // ==================================================

  const slots =
    [];


  for (
    let minuto =
      inicioMinutos;

    minuto <
    finMinutos;

    minuto += INTERVALO
  ) {

    slots.push(
      {

        minuto,

        ref:
          doc(
            db,
            "agendaSlots",
            `${fecha}_${ESTILISTA_ID}_${minuto}`
          )

      }
    );

  }


  await runTransaction(
    db,
    async (transaction) => {

      const documentosSlots =
        [];


      // ==================================================
      // TODAS LAS LECTURAS PRIMERO
      // ==================================================

      for (
        const slot
        of slots
        ) {

        documentosSlots.push(
          {

            ...slot,

            snap:
              await transaction.get(
                slot.ref
              )

          }
        );

      }


      // ==================================================
      // SI UN SLOT EXISTE, EL HORARIO YA ESTÁ OCUPADO
      // ==================================================

      const existeConflicto =
        documentosSlots.some(
          (slot) =>
            slot.snap.exists()
        );


      if (existeConflicto) {

        throw new Error(
          "horario-ocupado"
        );

      }


      // ==================================================
      // CREAR DOCUMENTO PRINCIPAL DEL BLOQUEO
      // ==================================================

      transaction.set(
        bloqueoRef,
        {

          estilistaId:
          ESTILISTA_ID,

          fecha:
          fecha,

          diaCompleto:
          diaCompleto,

          inicioMinutos:
          inicioMinutos,

          finMinutos:
          finMinutos,

          horaInicio:
            minutosAHora(
              inicioMinutos
            ),

          horaFin:
            minutosAHora(
              finMinutos
            ),

          motivo:
          motivo,

          creadoPor:
          auth.currentUser.uid,

          fechaCreacion:
            serverTimestamp()

        }
      );


      // ==================================================
      // RESERVAR TODOS LOS SLOTS
      // ==================================================

      documentosSlots.forEach(
        (slot) => {

          transaction.set(
            slot.ref,
            {

              tipo:
                "bloqueo",

              fecha:
              fecha,

              estilistaId:
              ESTILISTA_ID,

              minuto:
              slot.minuto,

              bloqueoId:
              bloqueoRef.id

            }
          );

        }
      );

    }
  );

}


// ==================================================
// CARGAR BLOQUEOS
// ==================================================

async function cargarBloqueos() {

  cargandoBloqueos.classList.remove(
    "oculto"
  );


  cargandoBloqueos.textContent =
    "Cargando bloqueos...";


  listaBloqueos.replaceChildren();


  try {

    const resultado =
      await getDocs(
        collection(
          db,
          "bloqueos"
        )
      );


    const hoy =
      obtenerFechaHoy();


    const bloqueos =
      [];


    resultado.forEach(
      (documento) => {

        const datos =
          documento.data();


        if (
          datos.estilistaId
          !== ESTILISTA_ID
        ) {

          return;

        }


        if (
          datos.fecha < hoy
        ) {

          return;

        }


        bloqueos.push(
          {

            id:
            documento.id,

            ...datos

          }
        );

      }
    );


    bloqueos.sort(
      (a, b) => {

        if (
          a.fecha
          !== b.fecha
        ) {

          return a.fecha.localeCompare(
            b.fecha
          );

        }


        return (
          Number(
            a.inicioMinutos
          )
          -
          Number(
            b.inicioMinutos
          )
        );

      }
    );


    cargandoBloqueos.classList.add(
      "oculto"
    );


    if (
      bloqueos.length === 0
    ) {

      const vacio =
        document.createElement(
          "div"
        );


      vacio.classList.add(
        "sin-bloqueos"
      );


      const texto =
        document.createElement(
          "p"
        );


      texto.textContent =
        "No existen bloqueos próximos.";


      vacio.appendChild(
        texto
      );


      listaBloqueos.appendChild(
        vacio
      );


      return;

    }


    bloqueos.forEach(
      crearTarjetaBloqueo
    );


  } catch (error) {

    console.error(
      "Error cargando bloqueos:",
      error
    );


    cargandoBloqueos.textContent =
      "No fue posible cargar los bloqueos.";

  }

}


// ==================================================
// TARJETA BLOQUEO
// ==================================================

function crearTarjetaBloqueo(
  bloqueo
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "bloqueo-card"
  );


  // ==================================================
  // INFORMACIÓN
  // ==================================================

  const informacion =
    document.createElement(
      "div"
    );


  informacion.classList.add(
    "bloqueo-card-info"
  );


  const fecha =
    document.createElement(
      "strong"
    );


  fecha.textContent =
    formatearFecha(
      bloqueo.fecha
    );


  const horario =
    document.createElement(
      "span"
    );


  horario.textContent =
    bloqueo.diaCompleto
      ? "Día completo"
      : `${bloqueo.horaInicio} - ${bloqueo.horaFin}`;


  const motivo =
    document.createElement(
      "p"
    );


  motivo.textContent =
    bloqueo.motivo
    ||
    "Sin motivo";


  informacion.append(
    fecha,
    horario,
    motivo
  );


  // ==================================================
  // ELIMINAR
  // ==================================================

  const botonEliminar =
    document.createElement(
      "button"
    );


  botonEliminar.type =
    "button";


  botonEliminar.classList.add(
    "btn-eliminar-bloqueo"
  );


  botonEliminar.textContent =
    "Eliminar";


  botonEliminar.addEventListener(
    "click",
    async () => {

      const confirmar =
        confirm(
          bloqueo.diaCompleto

            ? `¿Volver a habilitar el ${formatearFecha(bloqueo.fecha)}?`

            : `¿Volver a habilitar el horario ${bloqueo.horaInicio} - ${bloqueo.horaFin}?`
        );


      if (!confirmar) {

        return;

      }


      botonEliminar.disabled =
        true;


      botonEliminar.textContent =
        "Eliminando...";


      try {

        await eliminarBloqueoAtomico(
          bloqueo
        );


        await cargarBloqueos();


      } catch (error) {

        console.error(
          "Error eliminando bloqueo:",
          error
        );


        alert(
          "No fue posible eliminar el bloqueo."
        );


        botonEliminar.disabled =
          false;


        botonEliminar.textContent =
          "Eliminar";

      }

    }
  );


  tarjeta.append(
    informacion,
    botonEliminar
  );


  listaBloqueos.appendChild(
    tarjeta
  );

}


// ==================================================
// ELIMINAR BLOQUEO ATÓMICAMENTE
// ==================================================

async function eliminarBloqueoAtomico(
  bloqueo
) {

  const bloqueoRef =
    doc(
      db,
      "bloqueos",
      bloqueo.id
    );


  await runTransaction(
    db,
    async (transaction) => {

      // ==================================================
      // LEER DOCUMENTO PRINCIPAL
      // ==================================================

      const bloqueoDoc =
        await transaction.get(
          bloqueoRef
        );


      if (
        !bloqueoDoc.exists()
      ) {

        throw new Error(
          "bloqueo-no-existe"
        );

      }


      const datos =
        bloqueoDoc.data();


      const referenciasSlots =
        [];


      // ==================================================
      // CREAR REFERENCIAS BASÁNDONOS EN FIRESTORE
      // ==================================================

      for (
        let minuto =
          Number(
            datos.inicioMinutos
          );

        minuto <
        Number(
          datos.finMinutos
        );

        minuto += INTERVALO
      ) {

        referenciasSlots.push(
          doc(
            db,
            "agendaSlots",
            `${datos.fecha}_${ESTILISTA_ID}_${minuto}`
          )
        );

      }


      // ==================================================
      // LEER TODOS LOS SLOTS
      // ==================================================

      const documentosSlots =
        [];


      for (
        const referencia
        of referenciasSlots
        ) {

        documentosSlots.push(
          {

            ref:
            referencia,

            snap:
              await transaction.get(
                referencia
              )

          }
        );

      }


      // ==================================================
      // BORRAR SOLO LOS SLOTS DEL BLOQUEO
      // ==================================================

      documentosSlots.forEach(
        (item) => {

          if (
            item.snap.exists()
            &&
            item.snap.data().bloqueoId
            === bloqueo.id
          ) {

            transaction.delete(
              item.ref
            );

          }

        }
      );


      // ==================================================
      // BORRAR BLOQUEO PRINCIPAL
      // ==================================================

      transaction.delete(
        bloqueoRef
      );

    }
  );

}


// ==================================================
// VALIDAR DÍA DE ATENCIÓN
// ==================================================

function fechaAtencionValida(
  fechaTexto
) {

  const fecha =
    crearFechaLocal(
      fechaTexto
    );


  const dia =
    fecha.getDay();


  // Domingo = 0
  // Lunes = 1

  return (
    dia !== 0
    &&
    dia !== 1
  );

}


// ==================================================
// FECHA DE HOY
// ==================================================

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


// ==================================================
// CREAR FECHA LOCAL
// ==================================================

function crearFechaLocal(
  fechaTexto
) {

  const partes =
    String(
      fechaTexto
    ).split("-");


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


// ==================================================
// FORMATEAR FECHA
// ==================================================

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
// MINUTOS A HH:MM
// ==================================================

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
