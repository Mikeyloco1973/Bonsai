// ==================================================
// BONSAI
// AGENDA VISUAL ADMINISTRATIVA
// ==================================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// CONFIGURACIÓN
// ==================================================

const ESTILISTA_ID = "javiera";
const APERTURA = 630;   // 10:30
const CIERRE = 1260;    // 21:00
const INTERVALO = 30;
const ALTO_SLOT = 44;


// ==================================================
// VARIABLES
// ==================================================

let reservasDia = [];
let bloqueosDia = [];

let reservasCargadas = false;
let bloqueosCargados = false;

let detenerReservas = null;
let detenerBloqueos = null;

const clientesCache = new Map();
const clientesDatosCache = new Map();

let detalleReservaActual = null;
let versionRender = 0;


// ==================================================
// ELEMENTOS DE LA AGENDA
// ==================================================

const fechaAdmin =
  document.getElementById("fechaAdmin");

const agendaVisualTitulo =
  document.getElementById("agendaVisualTitulo");

const agendaVisualResumen =
  document.getElementById("agendaVisualResumen");

const cargandoAgendaVisual =
  document.getElementById("cargandoAgendaVisual");

const agendaVisualDia =
  document.getElementById("agendaVisualDia");

const agendaVisualHoras =
  document.getElementById("agendaVisualHoras");

const agendaVisualCuerpo =
  document.getElementById("agendaVisualCuerpo");

const agendaVisualLineas =
  document.getElementById("agendaVisualLineas");

const agendaVisualEventos =
  document.getElementById("agendaVisualEventos");

const agendaVisualCerrado =
  document.getElementById("agendaVisualCerrado");


// ==================================================
// ELEMENTOS DEL MODAL DE DETALLE
// ==================================================

const modalDetalleAgenda =
  document.getElementById("modalDetalleAgenda");

const cerrarDetalleAgenda =
  document.getElementById("cerrarDetalleAgenda");

const btnCerrarDetalleAgenda =
  document.getElementById("btnCerrarDetalleAgenda");

const detalleAgendaCliente =
  document.getElementById("detalleAgendaCliente");

const detalleAgendaDatosCliente =
  document.getElementById("detalleAgendaDatosCliente");

const detalleAgendaDatosReserva =
  document.getElementById("detalleAgendaDatosReserva");

const mensajeContactoAgenda =
  document.getElementById("mensajeContactoAgenda");

const btnContactarAgenda =
  document.getElementById("btnContactarAgenda");


// ==================================================
// INICIAR
// ==================================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (!usuario) {
      detenerEscuchas();
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
        usuarioDoc.data().rol !== "admin"
      ) {
        detenerEscuchas();
        return;
      }

      if (!fechaAdmin.value) {
        fechaAdmin.value = obtenerFechaHoy();
      }

      escucharFechaSeleccionada();

    } catch (error) {

      console.error(
        "Error iniciando agenda visual:",
        error
      );

      cargandoAgendaVisual.textContent =
        "No fue posible cargar la agenda visual.";
    }
  }
);


// ==================================================
// CAMBIO DE FECHA
// ==================================================

fechaAdmin.addEventListener(
  "change",
  () => {
    escucharFechaSeleccionada();
  }
);


// ==================================================
// ESCUCHAR FECHA SELECCIONADA
// ==================================================

function escucharFechaSeleccionada() {

  detenerEscuchas();

  reservasDia = [];
  bloqueosDia = [];

  reservasCargadas = false;
  bloqueosCargados = false;

  const fecha = fechaAdmin.value;

  if (!fecha) {
    return;
  }

  agendaVisualTitulo.textContent =
    capitalizar(
      formatearFecha(fecha)
    );

  agendaVisualResumen.textContent = "";
  agendaVisualEventos.replaceChildren();

  // Domingo o lunes.
  if (!fechaAtencionValida(fecha)) {

    cargandoAgendaVisual.classList.add("oculto");
    agendaVisualDia.classList.add("oculto");
    agendaVisualCerrado.classList.remove("oculto");

    agendaVisualResumen.textContent =
      "Día cerrado";

    return;
  }

  agendaVisualCerrado.classList.add("oculto");
  agendaVisualDia.classList.add("oculto");

  cargandoAgendaVisual.classList.remove("oculto");
  cargandoAgendaVisual.textContent =
    "Cargando agenda...";

  construirEscalaVisual();

  // ==================================================
  // RESERVAS EN TIEMPO REAL
  // ==================================================

  detenerReservas =
    onSnapshot(
      query(
        collection(db, "reservas"),
        where("fecha", "==", fecha)
      ),
      (resultado) => {

        reservasDia = [];

        resultado.forEach(
          (documento) => {

            const datos =
              documento.data();

            if (
              datos.estilistaId !== ESTILISTA_ID
            ) {
              return;
            }

            if (
              datos.estado === "cancelada_admin"
              ||
              datos.estado === "cancelada_cliente"
            ) {
              return;
            }

            reservasDia.push({
              id: documento.id,
              ...datos
            });
          }
        );

        reservasDia.sort(
          (a, b) =>
            Number(a.inicioMinutos || 0)
            -
            Number(b.inicioMinutos || 0)
        );

        reservasCargadas = true;
        intentarRenderizar();
      },
      (error) => {

        console.error(
          "Error escuchando reservas:",
          error
        );

        cargandoAgendaVisual.textContent =
          "No fue posible cargar las reservas.";
      }
    );

  // ==================================================
  // BLOQUEOS EN TIEMPO REAL
  // ==================================================

  detenerBloqueos =
    onSnapshot(
      query(
        collection(db, "bloqueos"),
        where("fecha", "==", fecha)
      ),
      (resultado) => {

        bloqueosDia = [];

        resultado.forEach(
          (documento) => {

            const datos =
              documento.data();

            if (
              datos.estilistaId !== ESTILISTA_ID
            ) {
              return;
            }

            bloqueosDia.push({
              id: documento.id,
              ...datos
            });
          }
        );

        bloqueosDia.sort(
          (a, b) =>
            Number(a.inicioMinutos || APERTURA)
            -
            Number(b.inicioMinutos || APERTURA)
        );

        bloqueosCargados = true;
        intentarRenderizar();
      },
      (error) => {

        console.error(
          "Error escuchando bloqueos:",
          error
        );

        cargandoAgendaVisual.textContent =
          "No fue posible cargar los bloqueos.";
      }
    );
}


// ==================================================
// RENDER CUANDO AMBAS CONSULTAS ESTÉN LISTAS
// ==================================================

function intentarRenderizar() {

  if (
    !reservasCargadas
    ||
    !bloqueosCargados
  ) {
    return;
  }

  renderizarAgendaVisual();
}


// ==================================================
// CONSTRUIR ESCALA 10:30 - 21:00
// ==================================================

function construirEscalaVisual() {

  agendaVisualHoras.replaceChildren();
  agendaVisualLineas.replaceChildren();

  const totalSlots =
    (CIERRE - APERTURA) / INTERVALO;

  const altoTotal =
    totalSlots * ALTO_SLOT;

  agendaVisualHoras.style.height =
    `${altoTotal}px`;

  agendaVisualCuerpo.style.height =
    `${altoTotal}px`;

  for (
    let indice = 0;
    indice <= totalSlots;
    indice++
  ) {

    const minuto =
      APERTURA
      +
      indice * INTERVALO;

    const posicion =
      indice * ALTO_SLOT;

    // Hora.
    const hora =
      document.createElement("span");

    hora.classList.add(
      "agenda-visual-hora"
    );

    hora.textContent =
      minutosAHora(minuto);

    hora.style.top =
      `${posicion}px`;

    agendaVisualHoras.appendChild(hora);

    // Línea.
    const linea =
      document.createElement("div");

    linea.classList.add(
      "agenda-visual-linea"
    );

    if (minuto % 60 === 0) {
      linea.classList.add(
        "agenda-visual-linea-hora"
      );
    }

    linea.style.top =
      `${posicion}px`;

    agendaVisualLineas.appendChild(linea);
  }
}


// ==================================================
// RENDER PRINCIPAL
// ==================================================

async function renderizarAgendaVisual() {

  const miVersion =
    ++versionRender;

  cargandoAgendaVisual.classList.remove(
    "oculto"
  );

  cargandoAgendaVisual.textContent =
    "Actualizando agenda...";

  agendaVisualEventos.replaceChildren();

  const fechaRender =
    fechaAdmin.value;

  // Reservas.
  for (const reserva of reservasDia) {

    const nombreCliente =
      await obtenerNombreCliente(
        reserva.usuarioId
      );

    if (
      miVersion !== versionRender
      ||
      fechaAdmin.value !== fechaRender
    ) {
      return;
    }

    crearEventoReserva(
      reserva,
      nombreCliente
    );
  }

  // Bloqueos.
  bloqueosDia.forEach(
    crearEventoBloqueo
  );

  // Hora actual.
  agregarLineaHoraActual(fechaRender);

  actualizarResumen();

  cargandoAgendaVisual.classList.add(
    "oculto"
  );

  agendaVisualDia.classList.remove(
    "oculto"
  );
}


// ==================================================
// RESERVA VISUAL
// ==================================================

function crearEventoReserva(
  reserva,
  nombreCliente
) {

  const inicio =
    Number(reserva.inicioMinutos);

  const fin =
    Number(reserva.finMinutos);

  if (
    !Number.isFinite(inicio)
    ||
    !Number.isFinite(fin)
  ) {
    return;
  }

  const posicion =
    calcularPosicionEvento(
      inicio,
      fin
    );

  if (!posicion) {
    return;
  }

  const evento =
    document.createElement("button");

  evento.type = "button";

  evento.classList.add(
    "agenda-visual-evento",
    "agenda-evento-reserva",
    obtenerClaseEstado(
      reserva.estado
    )
  );

  evento.style.top =
    `${posicion.top}px`;

  evento.style.height =
    `${posicion.height}px`;

  const servicio =
    document.createElement("strong");

  servicio.textContent =
    reserva.servicioNombre
    ||
    "Servicio";

  const cliente =
    document.createElement("span");

  cliente.textContent =
    nombreCliente;

  const horario =
    document.createElement("small");

  horario.textContent =
    `${reserva.horaInicio} - ${reserva.horaFin}`;

  const estado =
    document.createElement("em");

  estado.textContent =
    obtenerTextoEstado(
      reserva.estado
    );

  evento.append(
    servicio,
    cliente,
    horario,
    estado
  );

  evento.title =
    `${reserva.servicioNombre || "Servicio"} · ${nombreCliente}`;

  // ==================================================
  // CLIC → ABRIR DETALLE
  // ==================================================

  evento.addEventListener(
    "click",
    async () => {
      await abrirDetalleReservaAgenda(
        reserva
      );
    }
  );

  agendaVisualEventos.appendChild(
    evento
  );
}


// ==================================================
// BLOQUEO VISUAL
// ==================================================

function crearEventoBloqueo(
  bloqueo
) {

  const inicio =
    bloqueo.diaCompleto
      ? APERTURA
      : Number(
        bloqueo.inicioMinutos
      );

  const fin =
    bloqueo.diaCompleto
      ? CIERRE
      : Number(
        bloqueo.finMinutos
      );

  const posicion =
    calcularPosicionEvento(
      inicio,
      fin
    );

  if (!posicion) {
    return;
  }

  const evento =
    document.createElement("div");

  evento.classList.add(
    "agenda-visual-evento",
    "agenda-evento-bloqueo"
  );

  if (bloqueo.diaCompleto) {
    evento.classList.add(
      "agenda-evento-dia-completo"
    );
  }

  evento.style.top =
    `${posicion.top}px`;

  evento.style.height =
    `${posicion.height}px`;

  const titulo =
    document.createElement("strong");

  titulo.textContent =
    bloqueo.diaCompleto
      ? "Día bloqueado"
      : "Horario bloqueado";

  const motivo =
    document.createElement("span");

  motivo.textContent =
    bloqueo.motivo
    ||
    "Sin motivo";

  const horario =
    document.createElement("small");

  horario.textContent =
    `${minutosAHora(inicio)} - ${minutosAHora(fin)}`;

  evento.append(
    titulo,
    motivo,
    horario
  );

  agendaVisualEventos.appendChild(
    evento
  );
}


// ==================================================
// CALCULAR POSICIÓN
// ==================================================

function calcularPosicionEvento(
  inicioOriginal,
  finOriginal
) {

  const inicio =
    Math.max(
      APERTURA,
      inicioOriginal
    );

  const fin =
    Math.min(
      CIERRE,
      finOriginal
    );

  if (fin <= inicio) {
    return null;
  }

  const top =
    (
      (inicio - APERTURA)
      /
      INTERVALO
    )
    *
    ALTO_SLOT;

  const height =
    (
      (fin - inicio)
      /
      INTERVALO
    )
    *
    ALTO_SLOT;

  return {
    top: top + 2,
    height: Math.max(
      height - 4,
      25
    )
  };
}


// ==================================================
// RESUMEN DEL DÍA
// ==================================================

function actualizarResumen() {

  const ocupados =
    new Set();

  reservasDia.forEach(
    (reserva) => {
      agregarSlotsOcupados(
        ocupados,
        Number(reserva.inicioMinutos),
        Number(reserva.finMinutos)
      );
    }
  );

  bloqueosDia.forEach(
    (bloqueo) => {
      agregarSlotsOcupados(
        ocupados,
        bloqueo.diaCompleto
          ? APERTURA
          : Number(bloqueo.inicioMinutos),
        bloqueo.diaCompleto
          ? CIERRE
          : Number(bloqueo.finMinutos)
      );
    }
  );

  const totalSlots =
    (CIERRE - APERTURA)
    /
    INTERVALO;

  const slotsLibres =
    Math.max(
      totalSlots - ocupados.size,
      0
    );

  const minutosLibres =
    slotsLibres * INTERVALO;

  const textoReservas =
    reservasDia.length === 1
      ? "1 reserva"
      : `${reservasDia.length} reservas`;

  const textoBloqueos =
    bloqueosDia.length === 1
      ? "1 bloqueo"
      : `${bloqueosDia.length} bloqueos`;

  agendaVisualResumen.textContent =
    `${textoReservas} · ${textoBloqueos} · ${formatearDuracion(minutosLibres)} libres`;
}


// ==================================================
// AGREGAR SLOTS OCUPADOS
// ==================================================

function agregarSlotsOcupados(
  set,
  inicio,
  fin
) {

  if (
    !Number.isFinite(inicio)
    ||
    !Number.isFinite(fin)
  ) {
    return;
  }

  const inicioReal =
    Math.max(
      inicio,
      APERTURA
    );

  const finReal =
    Math.min(
      fin,
      CIERRE
    );

  for (
    let minuto = inicioReal;
    minuto < finReal;
    minuto += INTERVALO
  ) {
    set.add(minuto);
  }
}


// ==================================================
// NOMBRE DEL CLIENTE PARA LA AGENDA VISUAL
// ==================================================

async function obtenerNombreCliente(
  usuarioId
) {

  if (!usuarioId) {
    return "Cliente";
  }

  if (clientesCache.has(usuarioId)) {
    return clientesCache.get(usuarioId);
  }

  try {

    const documento =
      await getDoc(
        doc(
          db,
          "usuarios",
          usuarioId
        )
      );

    if (documento.exists()) {

      const datos =
        documento.data();

      const nombre =
        datos.nombre || "";

      const apellido =
        datos.apellido
        ||
        datos.apellidos
        ||
        datos.surname
        ||
        "";

      const nombreCompleto =
        `${nombre} ${apellido}`.trim()
        ||
        "Cliente";

      clientesCache.set(
        usuarioId,
        nombreCompleto
      );

      return nombreCompleto;
    }

  } catch (error) {

    console.error(
      "Error obteniendo nombre cliente:",
      error
    );
  }

  clientesCache.set(
    usuarioId,
    "Cliente"
  );

  return "Cliente";
}


// ==================================================
// DATOS COMPLETOS DEL CLIENTE
// ==================================================

async function obtenerDatosCliente(
  usuarioId
) {

  if (!usuarioId) {
    return {
      nombreCompleto: "Cliente",
      telefono: "",
      correo: ""
    };
  }

  if (
    clientesDatosCache.has(
      usuarioId
    )
  ) {
    return clientesDatosCache.get(
      usuarioId
    );
  }

  try {

    const documento =
      await getDoc(
        doc(
          db,
          "usuarios",
          usuarioId
        )
      );

    if (documento.exists()) {

      const datos =
        documento.data();

      const nombre =
        datos.nombre || "";

      const apellido =
        datos.apellido
        ||
        datos.apellidos
        ||
        datos.surname
        ||
        "";

      const cliente = {
        nombreCompleto:
          `${nombre} ${apellido}`.trim()
          ||
          "Cliente",

        telefono:
          datos.telefono
          ||
          datos.phone
          ||
          "",

        correo:
          datos.correo
          ||
          datos.email
          ||
          ""
      };

      clientesDatosCache.set(
        usuarioId,
        cliente
      );

      return cliente;
    }

  } catch (error) {

    console.error(
      "Error obteniendo cliente:",
      error
    );
  }

  return {
    nombreCompleto: "Cliente",
    telefono: "",
    correo: ""
  };
}


// ==================================================
// ABRIR DETALLE DE RESERVA
// ==================================================

async function abrirDetalleReservaAgenda(
  reserva
) {

  const cliente =
    await obtenerDatosCliente(
      reserva.usuarioId
    );

  detalleReservaActual = {
    reserva,
    cliente
  };

  // Nombre principal.
  detalleAgendaCliente.textContent =
    cliente.nombreCompleto;

  // ==================================================
  // INFORMACIÓN DE LA CLIENTA
  // ==================================================

  detalleAgendaDatosCliente.replaceChildren();

  detalleAgendaDatosCliente.append(
    crearDatoDetalle(
      "Nombre",
      cliente.nombreCompleto
    ),
    crearDatoDetalle(
      "WhatsApp",
      cliente.telefono || "Sin teléfono"
    ),
    crearDatoDetalle(
      "Correo",
      cliente.correo || "Sin correo"
    )
  );

  // ==================================================
  // INFORMACIÓN DE LA RESERVA
  // ==================================================

  detalleAgendaDatosReserva.replaceChildren();

  detalleAgendaDatosReserva.append(
    crearDatoDetalle(
      "Servicio",
      reserva.servicioNombre || "Servicio"
    ),
    crearDatoDetalle(
      "Fecha",
      formatearFecha(reserva.fecha)
    ),
    crearDatoDetalle(
      "Horario",
      `${reserva.horaInicio || "--:--"} - ${reserva.horaFin || "--:--"}`
    ),
    crearDatoDetalle(
      "Duración",
      formatearDuracion(
        reserva.duracionMinutos
      )
    ),
    crearDatoDetalle(
      "Estado",
      obtenerTextoEstado(
        reserva.estado
      )
    ),
    crearDatoDetalle(
      "Valor",
      formatearPrecioAgenda(
        reserva.precio,
        reserva.precioDesde
      )
    )
  );

  // ==================================================
  // MENSAJE INICIAL PARA WHATSAPP
  // ==================================================

  const primerNombre =
    cliente.nombreCompleto
      .trim()
      .split(/\s+/)[0]
    ||
    "Cliente";

  mensajeContactoAgenda.value =
    `Hola ${primerNombre}, soy Javii de Bonsai 🌿\n\n`
    +
    `Te escribo por tu reserva de ${reserva.servicioNombre || "tu servicio"}, `
    +
    `agendada para el ${formatearFecha(reserva.fecha)} `
    +
    `a las ${reserva.horaInicio || ""}.\n\n`
    +
    `Quería coordinar algunos detalles de tu llegada y atención.`;

  // ==================================================
  // VALIDAR WHATSAPP
  // ==================================================

  const telefonoValido =
    normalizarTelefonoAgenda(
      cliente.telefono
    );

  btnContactarAgenda.disabled =
    !telefonoValido;

  btnContactarAgenda.textContent =
    telefonoValido
      ? "Contactar por WhatsApp"
      : "Sin WhatsApp válido";

  // Mostrar modal.
  modalDetalleAgenda.classList.remove(
    "oculto"
  );
}


// ==================================================
// CREAR DATO DEL DETALLE
// ==================================================

function crearDatoDetalle(
  etiqueta,
  valor
) {

  const elemento =
    document.createElement("div");

  const label =
    document.createElement("span");

  label.textContent = etiqueta;

  const texto =
    document.createElement("strong");

  texto.textContent = valor;

  elemento.append(
    label,
    texto
  );

  return elemento;
}


// ==================================================
// PRECIO DEL DETALLE
// ==================================================

function formatearPrecioAgenda(
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

  const numero =
    Number(precio);

  if (!Number.isFinite(numero)) {
    return "Sin valor";
  }

  const valor =
    new Intl.NumberFormat(
      "es-CL",
      {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
      }
    ).format(numero);

  return desde
    ? `Desde ${valor}`
    : valor;
}


// ==================================================
// NORMALIZAR TELÉFONO PARA WHATSAPP
// ==================================================

function normalizarTelefonoAgenda(
  telefono
) {

  let numero =
    String(
      telefono || ""
    ).replace(
      /\D/g,
      ""
    );

  // 912345678
  if (
    numero.length === 9
    &&
    numero.startsWith("9")
  ) {
    numero = "56" + numero;
  }

  // 0912345678
  if (
    numero.length === 10
    &&
    numero.startsWith("09")
  ) {
    numero =
      "56"
      +
      numero.substring(1);
  }

  if (
    numero.length !== 11
    ||
    !numero.startsWith("569")
  ) {
    return "";
  }

  return numero;
}


// ==================================================
// CONTACTAR POR WHATSAPP
// ==================================================

btnContactarAgenda.addEventListener(
  "click",
  () => {

    if (!detalleReservaActual) {
      return;
    }

    const telefono =
      normalizarTelefonoAgenda(
        detalleReservaActual
          .cliente
          .telefono
      );

    if (!telefono) {
      alert(
        "La clienta no tiene un WhatsApp válido."
      );
      return;
    }

    const mensaje =
      mensajeContactoAgenda
        .value
        .trim();

    if (!mensaje) {
      alert(
        "Escribe un mensaje para la clienta."
      );

      mensajeContactoAgenda.focus();
      return;
    }

    const enlace =
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(
      enlace,
      "_blank",
      "noopener,noreferrer"
    );
  }
);


// ==================================================
// CERRAR DETALLE DE RESERVA
// ==================================================

function cerrarDetalleReservaAgenda() {

  modalDetalleAgenda.classList.add(
    "oculto"
  );

  detalleReservaActual = null;
}

cerrarDetalleAgenda.addEventListener(
  "click",
  cerrarDetalleReservaAgenda
);

btnCerrarDetalleAgenda.addEventListener(
  "click",
  cerrarDetalleReservaAgenda
);

modalDetalleAgenda.addEventListener(
  "click",
  (evento) => {
    if (
      evento.target === modalDetalleAgenda
    ) {
      cerrarDetalleReservaAgenda();
    }
  }
);


// ==================================================
// LÍNEA DE HORA ACTUAL
// ==================================================

function agregarLineaHoraActual(
  fecha
) {

  if (
    fecha !== obtenerFechaHoy()
  ) {
    return;
  }

  const ahora =
    new Date();

  const minutoActual =
    ahora.getHours() * 60
    +
    ahora.getMinutes();

  if (
    minutoActual < APERTURA
    ||
    minutoActual > CIERRE
  ) {
    return;
  }

  const top =
    (
      (minutoActual - APERTURA)
      /
      INTERVALO
    )
    *
    ALTO_SLOT;

  const linea =
    document.createElement("div");

  linea.classList.add(
    "agenda-ahora-linea"
  );

  linea.style.top =
    `${top}px`;

  const etiqueta =
    document.createElement("span");

  etiqueta.textContent =
    "Ahora";

  linea.appendChild(
    etiqueta
  );

  agendaVisualEventos.appendChild(
    linea
  );
}


// ==================================================
// CLASE SEGÚN ESTADO
// ==================================================

function obtenerClaseEstado(
  estado
) {

  switch (estado) {

    case "pendiente":
      return "agenda-evento-pendiente";

    case "confirmada":
      return "agenda-evento-confirmada";

    case "cambio_solicitado":
      return "agenda-evento-cambio";

    case "reagendada":
      return "agenda-evento-reagendada";

    default:
      return "agenda-evento-confirmada";
  }
}


// ==================================================
// TEXTO DEL ESTADO
// ==================================================

function obtenerTextoEstado(
  estado
) {

  switch (estado) {

    case "pendiente":
      return "Pendiente";

    case "confirmada":
      return "Confirmada";

    case "cambio_solicitado":
      return "Cambio solicitado";

    case "reagendada":
      return "Reagendada";

    case "cancelada_admin":
      return "Cancelada por Bonsai";

    case "cancelada_cliente":
      return "Cancelada por clienta";

    default:
      return estado || "Reserva";
  }
}


// ==================================================
// DÍA DE ATENCIÓN
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
// FECHA
// ==================================================

function obtenerFechaHoy() {

  const hoy =
    new Date();

  return [
    hoy.getFullYear(),
    String(
      hoy.getMonth() + 1
    ).padStart(2, "0"),
    String(
      hoy.getDate()
    ).padStart(2, "0")
  ].join("-");
}

function crearFechaLocal(
  fechaTexto
) {

  const partes =
    String(
      fechaTexto
    ).split("-");

  return new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );
}

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
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  );
}


// ==================================================
// MINUTOS → HORA
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
    String(horas).padStart(2, "0")
    +
    ":"
    +
    String(minutos).padStart(2, "0")
  );
}


// ==================================================
// DURACIÓN
// ==================================================

function formatearDuracion(
  minutos
) {

  minutos =
    Number(minutos);

  if (
    !Number.isFinite(minutos)
    ||
    minutos <= 0
  ) {
    return "0 min";
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const resto =
    minutos % 60;

  if (horas === 0) {
    return `${resto} min`;
  }

  if (resto === 0) {
    return horas === 1
      ? "1 hora"
      : `${horas} horas`;
  }

  return `${horas} h ${resto} min`;
}


// ==================================================
// CAPITALIZAR
// ==================================================

function capitalizar(
  texto
) {

  if (!texto) {
    return "";
  }

  return (
    texto.charAt(0).toUpperCase()
    +
    texto.slice(1)
  );
}


// ==================================================
// DETENER LISTENERS
// ==================================================

function detenerEscuchas() {

  if (
    typeof detenerReservas === "function"
  ) {
    detenerReservas();
  }

  if (
    typeof detenerBloqueos === "function"
  ) {
    detenerBloqueos();
  }

  detenerReservas = null;
  detenerBloqueos = null;
}
