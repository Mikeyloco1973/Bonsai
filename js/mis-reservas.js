// ==================================================
// BONSAI
// MIS RESERVAS - CLIENTA
// ==================================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// CONFIGURACIÓN
// ==================================================

const ESTILISTA_ID =
  "javiera";

const INTERVALO =
  30;


// ==================================================
// VARIABLES
// ==================================================

let usuarioActual =
  null;


// ==================================================
// ELEMENTOS HTML
// ==================================================

const proximasReservas =
  document.getElementById(
    "proximasReservas"
  );


const historialReservas =
  document.getElementById(
    "historialReservas"
  );


const cargandoReservas =
  document.getElementById(
    "cargandoReservas"
  );


const saludoUsuario =
  document.getElementById(
    "saludoUsuario"
  );


const btnCerrarSesion =
  document.getElementById(
    "btnCerrarSesion"
  );


// ==================================================
// PROTEGER PÁGINA
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


    await cargarNombreUsuario();


    await cargarMisReservas();

  }
);


// ==================================================
// CARGAR NOMBRE
// ==================================================

async function cargarNombreUsuario() {

  if (!usuarioActual) {

    return;

  }


  try {

    const usuarioDoc =
      await getDoc(
        doc(
          db,
          "usuarios",
          usuarioActual.uid
        )
      );


    if (
      usuarioDoc.exists()
    ) {

      const datos =
        usuarioDoc.data();


      const nombre =
        datos.nombre
        ||
        usuarioActual.displayName
        ||
        "Cliente";


      if (saludoUsuario) {

        saludoUsuario.textContent =
          `Hola, ${nombre}`;

      }


      return;

    }


  } catch (error) {

    console.error(
      "Error cargando nombre:",
      error
    );

  }


  if (saludoUsuario) {

    saludoUsuario.textContent =
      usuarioActual.displayName
        ? `Hola, ${usuarioActual.displayName}`
        : "Hola";

  }

}


// ==================================================
// CARGAR RESERVAS
// ==================================================

async function cargarMisReservas() {

  if (!usuarioActual) {

    return;

  }


  proximasReservas.replaceChildren();

  historialReservas.replaceChildren();


  if (cargandoReservas) {

    cargandoReservas.classList.remove(
      "oculto"
    );


    cargandoReservas.textContent =
      "Cargando tus reservas...";

  }


  try {

    const resultado =
      await getDocs(
        query(
          collection(
            db,
            "reservas"
          ),
          where(
            "usuarioId",
            "==",
            usuarioActual.uid
          )
        )
      );


    const reservas =
      [];


    resultado.forEach(
      (documento) => {

        reservas.push({

          id:
          documento.id,

          ...documento.data()

        });

      }
    );


    reservas.sort(
      ordenarReservasMasRecientes
    );


    const proximas =
      [];


    const historial =
      [];


    reservas.forEach(
      (reserva) => {

        if (
          esReservaProxima(
            reserva
          )
        ) {

          proximas.push(
            reserva
          );

        } else {

          historial.push(
            reserva
          );

        }

      }
    );


    if (cargandoReservas) {

      cargandoReservas.classList.add(
        "oculto"
      );

    }


    mostrarGrupoReservas(
      proximas,
      proximasReservas,
      true
    );


    mostrarGrupoReservas(
      historial,
      historialReservas,
      false
    );


  } catch (error) {

    console.error(
      "Error cargando reservas:",
      error
    );


    if (cargandoReservas) {

      cargandoReservas.textContent =
        "No fue posible cargar tus reservas.";

    }

  }

}


// ==================================================
// MOSTRAR GRUPO
// ==================================================

function mostrarGrupoReservas(
  reservas,
  contenedor,
  esProxima
) {

  contenedor.replaceChildren();


  if (
    reservas.length === 0
  ) {

    const vacio =
      document.createElement(
        "div"
      );


    vacio.classList.add(
      "sin-reservas"
    );


    const texto =
      document.createElement(
        "p"
      );


    texto.textContent =
      esProxima
        ? "No tienes próximas reservas."
        : "Todavía no tienes reservas en tu historial.";


    vacio.appendChild(
      texto
    );


    contenedor.appendChild(
      vacio
    );


    return;

  }


  reservas.forEach(
    (reserva) => {

      contenedor.appendChild(
        crearTarjetaReserva(
          reserva,
          esProxima
        )
      );

    }
  );

}


// ==================================================
// CREAR TARJETA
// ==================================================

function crearTarjetaReserva(
  reserva,
  esProxima
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "reserva-card"
  );


  // ==================================================
  // CABECERA
  // ==================================================

  const cabecera =
    document.createElement(
      "div"
    );


  cabecera.classList.add(
    "reserva-card-header"
  );


  const tituloContenedor =
    document.createElement(
      "div"
    );


  const fecha =
    document.createElement(
      "span"
    );


  fecha.classList.add(
    "reserva-fecha"
  );


  fecha.textContent =
    formatearFecha(
      reserva.fecha
    );


  const servicio =
    document.createElement(
      "h3"
    );


  servicio.textContent =
    reserva.servicioNombre
    ||
    "Servicio";


  tituloContenedor.append(
    fecha,
    servicio
  );


  const estadoVisual =
    obtenerEstadoVisual(
      reserva
    );


  const estado =
    document.createElement(
      "span"
    );


  estado.classList.add(
    "estado-reserva",
    estadoVisual.clase
  );


  estado.textContent =
    estadoVisual.texto;


  cabecera.append(
    tituloContenedor,
    estado
  );


  // ==================================================
  // DATOS
  // ==================================================

  const datos =
    document.createElement(
      "div"
    );


  datos.classList.add(
    "reserva-datos"
  );


  datos.append(

    crearDatoReserva(
      "Horario",
      `${reserva.horaInicio || "--:--"} - ${reserva.horaFin || "--:--"}`
    ),

    crearDatoReserva(
      "Profesional",
      reserva.estilistaNombre
      ||
      "Javii"
    ),

    crearDatoReserva(
      "Duración",
      formatearDuracion(
        reserva.duracionMinutos
      )
    ),

    crearDatoReserva(
      "Valor",
      formatearPrecio(
        reserva.precio,
        reserva.precioDesde
      )
    )

  );


  tarjeta.append(
    cabecera,
    datos
  );


  // ==================================================
  // MENSAJE PENDIENTE
  // ==================================================

  if (
    reserva.estado === "pendiente"
  ) {

    tarjeta.appendChild(
      crearAviso(
        "Tu solicitud está pendiente de confirmación por Javii.",
        "reserva-aviso-pendiente"
      )
    );

  }


  // ==================================================
  // CAMBIO SOLICITADO
  // ==================================================

  if (
    reserva.estado === "cambio_solicitado"
  ) {

    const texto =
      reserva.motivoCambio

        ? `Javii necesita coordinar un cambio contigo: ${reserva.motivoCambio}`

        : "Javii necesita coordinar un cambio de horario contigo.";


    tarjeta.appendChild(
      crearAviso(
        texto,
        "reserva-aviso-cambio"
      )
    );

  }


  // ==================================================
  // REAGENDADA
  // ==================================================

  if (
    reserva.estado === "reagendada"
  ) {

    const contenedor =
      document.createElement(
        "div"
      );


    contenedor.classList.add(
      "reserva-reagendada-info"
    );


    const titulo =
      document.createElement(
        "strong"
      );


    titulo.textContent =
      "Reserva reagendada";


    contenedor.appendChild(
      titulo
    );


    if (
      reserva.fechaAnterior
      &&
      reserva.horaInicioAnterior
    ) {

      const anterior =
        document.createElement(
          "span"
        );


      anterior.textContent =
        `Horario anterior: ${formatearFechaCorta(reserva.fechaAnterior)} · ${reserva.horaInicioAnterior} - ${reserva.horaFinAnterior || ""}`;


      contenedor.appendChild(
        anterior
      );

    }


    const nuevo =
      document.createElement(
        "span"
      );


    nuevo.textContent =
      `Nuevo horario: ${formatearFechaCorta(reserva.fecha)} · ${reserva.horaInicio} - ${reserva.horaFin}`;


    contenedor.appendChild(
      nuevo
    );


    tarjeta.appendChild(
      contenedor
    );

  }


  // ==================================================
  // CANCELADA POR BONSAI
  // ==================================================

  if (
    reserva.estado === "cancelada_admin"
  ) {

    const texto =
      reserva.motivoCancelacion

        ? `Bonsai canceló esta reserva. Motivo: ${reserva.motivoCancelacion}`

        : "Bonsai canceló esta reserva.";


    tarjeta.appendChild(
      crearAviso(
        texto,
        "reserva-aviso-cancelada"
      )
    );

  }


  // ==================================================
  // CANCELADA POR CLIENTA
  // ==================================================

  if (
    reserva.estado === "cancelada_cliente"
  ) {

    tarjeta.appendChild(
      crearAviso(
        "Cancelaste esta reserva.",
        "reserva-aviso-cancelada"
      )
    );

  }


  // ==================================================
  // ACCIONES
  // ==================================================

  if (
    esProxima
    &&
    puedeCancelarReserva(
      reserva
    )
  ) {

    const acciones =
      document.createElement(
        "div"
      );


    acciones.classList.add(
      "reserva-acciones"
    );


    const cancelar =
      document.createElement(
        "button"
      );


    cancelar.type =
      "button";


    cancelar.classList.add(
      "btn-cancelar-reserva"
    );


    cancelar.textContent =
      "Cancelar reserva";


    cancelar.addEventListener(
      "click",
      async () => {

        await solicitarCancelacion(
          reserva,
          cancelar
        );

      }
    );


    acciones.appendChild(
      cancelar
    );


    tarjeta.appendChild(
      acciones
    );

  }


  return tarjeta;

}


// ==================================================
// CREAR DATO
// ==================================================

function crearDatoReserva(
  etiqueta,
  valor
) {

  const contenedor =
    document.createElement(
      "div"
    );


  const label =
    document.createElement(
      "span"
    );


  label.textContent =
    etiqueta;


  const texto =
    document.createElement(
      "strong"
    );


  texto.textContent =
    valor;


  contenedor.append(
    label,
    texto
  );


  return contenedor;

}


// ==================================================
// CREAR AVISO
// ==================================================

function crearAviso(
  texto,
  clase
) {

  const aviso =
    document.createElement(
      "div"
    );


  aviso.classList.add(
    "reserva-aviso",
    clase
  );


  aviso.textContent =
    texto;


  return aviso;

}


// ==================================================
// SOLICITAR CANCELACIÓN
// ==================================================

async function solicitarCancelacion(
  reserva,
  boton
) {

  const confirmar =
    confirm(
      `¿Seguro que deseas cancelar tu reserva de ${reserva.servicioNombre || "este servicio"} para el ${formatearFecha(reserva.fecha)} a las ${reserva.horaInicio}?`
    );


  if (!confirmar) {

    return;

  }


  boton.disabled =
    true;


  boton.textContent =
    "Cancelando...";


  try {

    await cancelarReservaCliente(
      reserva
    );


    alert(
      "Tu reserva fue cancelada y el horario quedó disponible nuevamente."
    );


    await cargarMisReservas();


  } catch (error) {

    console.error(
      "Error cancelando reserva:",
      error
    );


    if (
      error.message ===
      "reserva-ya-cancelada"
    ) {

      alert(
        "Esta reserva ya había sido cancelada."
      );


      await cargarMisReservas();


    } else {

      alert(
        "No fue posible cancelar la reserva."
      );


      boton.disabled =
        false;


      boton.textContent =
        "Cancelar reserva";

    }

  }

}


// ==================================================
// CANCELAR RESERVA CLIENTA
// ==================================================

async function cancelarReservaCliente(
  reserva
) {

  const reservaRef =
    doc(
      db,
      "reservas",
      reserva.id
    );


  await runTransaction(
    db,
    async (transaction) => {

      // ======================================
      // LEER RESERVA ACTUAL
      // ======================================

      const reservaDoc =
        await transaction.get(
          reservaRef
        );


      if (
        !reservaDoc.exists()
      ) {

        throw new Error(
          "reserva-no-existe"
        );

      }


      const datos =
        reservaDoc.data();


      // ======================================
      // SEGURIDAD CLIENTA
      // ======================================

      if (
        datos.usuarioId
        !== usuarioActual.uid
      ) {

        throw new Error(
          "sin-permiso"
        );

      }


      if (
        datos.estado === "cancelada_admin"
        ||
        datos.estado === "cancelada_cliente"
      ) {

        throw new Error(
          "reserva-ya-cancelada"
        );

      }


      if (
        !estadoCancelable(
          datos.estado
        )
      ) {

        throw new Error(
          "estado-no-cancelable"
        );

      }


      // ======================================
      // GENERAR SLOTS REALES
      // ======================================

      const referenciasSlots =
        [];


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


      // ======================================
      // TODAS LAS LECTURAS PRIMERO
      // ======================================

      const documentosSlots =
        [];


      for (
        const referencia
        of referenciasSlots
        ) {

        documentosSlots.push({

          ref:
          referencia,

          snap:
            await transaction.get(
              referencia
            )

        });

      }


      // ======================================
      // ACTUALIZAR RESERVA
      // ======================================
      //
      // Importante:
      // Las reglas actuales permiten solamente
      // estos tres campos para cancelación cliente.
      // ==================================================

      transaction.update(
        reservaRef,
        {

          estado:
            "cancelada_cliente",

          canceladaPor:
            "cliente",

          fechaCancelacion:
            serverTimestamp()

        }
      );


      // ======================================
      // LIBERAR SLOTS
      // ======================================

      documentosSlots.forEach(
        (item) => {

          if (
            item.snap.exists()
            &&
            item.snap.data().reservaId
            === reserva.id
          ) {

            transaction.delete(
              item.ref
            );

          }

        }
      );

    }
  );

}


// ==================================================
// ESTADO CANCELABLE
// ==================================================

function estadoCancelable(
  estado
) {

  return [

    "pendiente",
    "confirmada",
    "cambio_solicitado",
    "reagendada"

  ].includes(
    estado
  );

}


// ==================================================
// PUEDE CANCELAR
// ==================================================

function puedeCancelarReserva(
  reserva
) {

  if (
    !estadoCancelable(
      reserva.estado
    )
  ) {

    return false;

  }


  if (
    !reserva.fecha
  ) {

    return false;

  }


  return !reservaYaPaso(
    reserva
  );

}


// ==================================================
// ESTADO VISUAL
// ==================================================

function obtenerEstadoVisual(
  reserva
) {

  if (
    !esReservaCancelada(
      reserva
    )
    &&
    reservaYaPaso(
      reserva
    )
  ) {

    return {

      texto:
        "Finalizada",

      clase:
        "estado-finalizada"

    };

  }


  switch (
    reserva.estado
    ) {

    case "pendiente":

      return {

        texto:
          "Pendiente",

        clase:
          "estado-pendiente"

      };


    case "confirmada":

      return {

        texto:
          "Confirmada",

        clase:
          "estado-confirmada"

      };


    case "cambio_solicitado":

      return {

        texto:
          "Cambio solicitado",

        clase:
          "estado-cambio"

      };


    case "reagendada":

      return {

        texto:
          "Reagendada",

        clase:
          "estado-reagendada"

      };


    case "cancelada_admin":

      return {

        texto:
          "Cancelada por Bonsai",

        clase:
          "estado-cancelada"

      };


    case "cancelada_cliente":

      return {

        texto:
          "Cancelada por ti",

        clase:
          "estado-cancelada"

      };


    default:

      return {

        texto:
          reserva.estado
          ||
          "Sin estado",

        clase:
          "estado-finalizada"

      };

  }

}


// ==================================================
// PRÓXIMA O HISTORIAL
// ==================================================

function esReservaProxima(
  reserva
) {

  if (
    esReservaCancelada(
      reserva
    )
  ) {

    return false;

  }


  return !reservaYaPaso(
    reserva
  );

}


// ==================================================
// ¿YA PASÓ?
// ==================================================

function reservaYaPaso(
  reserva
) {

  if (
    !reserva.fecha
    ||
    !reserva.horaFin
  ) {

    return false;

  }


  const fecha =
    crearFechaLocal(
      reserva.fecha
    );


  const partesHora =
    String(
      reserva.horaFin
    ).split(":");


  fecha.setHours(
    Number(
      partesHora[0] || 0
    ),
    Number(
      partesHora[1] || 0
    ),
    0,
    0
  );


  return (
    fecha.getTime()
    <
    Date.now()
  );

}


// ==================================================
// CANCELADA
// ==================================================

function esReservaCancelada(
  reserva
) {

  return (
    reserva.estado === "cancelada_admin"
    ||
    reserva.estado === "cancelada_cliente"
  );

}


// ==================================================
// ORDEN
// ==================================================

function ordenarReservasMasRecientes(
  a,
  b
) {

  const fechaA =
    `${a.fecha || ""}-${String(
      a.inicioMinutos || 0
    ).padStart(
      4,
      "0"
    )}`;


  const fechaB =
    `${b.fecha || ""}-${String(
      b.inicioMinutos || 0
    ).padStart(
      4,
      "0"
    )}`;


  return fechaB.localeCompare(
    fechaA
  );

}


// ==================================================
// FORMATEAR FECHA
// ==================================================

function formatearFecha(
  fechaTexto
) {

  if (!fechaTexto) {

    return "Sin fecha";

  }


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
// FECHA CORTA
// ==================================================

function formatearFechaCorta(
  fechaTexto
) {

  if (!fechaTexto) {

    return "Sin fecha";

  }


  return crearFechaLocal(
    fechaTexto
  ).toLocaleDateString(
    "es-CL",
    {

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric"

    }
  );

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
// DURACIÓN
// ==================================================

function formatearDuracion(
  minutos
) {

  minutos =
    Number(
      minutos || 0
    );


  if (
    minutos <= 0
  ) {

    return "Sin duración";

  }


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

  if (
    precio === undefined
    ||
    precio === null
  ) {

    return "Sin valor";

  }


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


// ==================================================
// CERRAR SESIÓN
// ==================================================

if (btnCerrarSesion) {

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

}
