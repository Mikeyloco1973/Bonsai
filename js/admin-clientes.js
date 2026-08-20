// ==================================================
// BONSAI
// ADMINISTRACIÓN DE CLIENTES
// ==================================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// VARIABLES
// ==================================================

let clientes = [];

let reservas = [];


// ==================================================
// ELEMENTOS
// ==================================================

const buscarCliente =
  document.getElementById(
    "buscarCliente"
  );


const cantidadClientesMostrados =
  document.getElementById(
    "cantidadClientesMostrados"
  );


const cargandoClientes =
  document.getElementById(
    "cargandoClientes"
  );


const listaClientesAdmin =
  document.getElementById(
    "listaClientesAdmin"
  );


// ==================================================
// MODAL HISTORIAL
// ==================================================

const modalHistorialCliente =
  document.getElementById(
    "modalHistorialCliente"
  );


const cerrarHistorialCliente =
  document.getElementById(
    "cerrarHistorialCliente"
  );


const volverHistorialCliente =
  document.getElementById(
    "volverHistorialCliente"
  );


const nombreHistorialCliente =
  document.getElementById(
    "nombreHistorialCliente"
  );


const datosHistorialCliente =
  document.getElementById(
    "datosHistorialCliente"
  );


const cantidadHistorialCliente =
  document.getElementById(
    "cantidadHistorialCliente"
  );


const historialClienteLista =
  document.getElementById(
    "historialClienteLista"
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


      await cargarDatosClientes();


    } catch (error) {

      console.error(
        "Error iniciando clientes:",
        error
      );


      cargandoClientes.textContent =
        "No fue posible cargar las clientas.";

    }

  }
);


// ==================================================
// CARGAR CLIENTAS Y RESERVAS
// ==================================================

async function cargarDatosClientes() {

  cargandoClientes.classList.remove(
    "oculto"
  );


  cargandoClientes.textContent =
    "Cargando clientas...";


  listaClientesAdmin.innerHTML =
    "";


  try {

    const [
      usuariosResultado,
      reservasResultado
    ] = await Promise.all([

      getDocs(
        collection(
          db,
          "usuarios"
        )
      ),

      getDocs(
        collection(
          db,
          "reservas"
        )
      )

    ]);


    clientes = [];


    usuariosResultado.forEach(
      (documento) => {

        const datos =
          documento.data();


        if (
          datos.rol !== "cliente"
        ) {

          return;

        }


        clientes.push(
          normalizarCliente(
            documento.id,
            datos
          )
        );

      }
    );


    reservas = [];


    reservasResultado.forEach(
      (documento) => {

        reservas.push({

          id:
          documento.id,

          ...documento.data()

        });

      }
    );


    clientes.sort(
      (a, b) =>
        a.nombreCompleto
          .localeCompare(
            b.nombreCompleto,
            "es"
          )
    );


    cargandoClientes.classList.add(
      "oculto"
    );


    mostrarClientes(
      clientes
    );


  } catch (error) {

    console.error(
      "Error cargando datos:",
      error
    );


    cargandoClientes.textContent =
      "No fue posible cargar las clientas.";

  }

}


// ==================================================
// NORMALIZAR CAMPOS DEL CLIENTE
// ==================================================

function normalizarCliente(
  id,
  datos
) {

  const nombre =
    String(
      datos.nombre || ""
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
      ""
    ).trim();


  return {

    id:
    id,

    nombre:
    nombre,

    apellido:
    apellido,

    nombreCompleto:
      `${nombre} ${apellido}`.trim()
      ||
      "Cliente",

    telefono:
    telefono,

    correo:
    correo,

    fechaRegistro:
      datos.fechaRegistro
      ||
      null

  };

}


// ==================================================
// BUSCADOR
// ==================================================

buscarCliente.addEventListener(
  "input",
  () => {

    const texto =
      normalizarTexto(
        buscarCliente.value
      );


    if (!texto) {

      mostrarClientes(
        clientes
      );


      return;

    }


    const filtrados =
      clientes.filter(
        (cliente) => {

          const nombre =
            normalizarTexto(
              cliente.nombreCompleto
            );


          const telefono =
            normalizarTexto(
              cliente.telefono
            );


          const correo =
            normalizarTexto(
              cliente.correo
            );


          return (

            nombre.includes(
              texto
            )

            ||

            telefono.includes(
              texto
            )

            ||

            correo.includes(
              texto
            )

          );

        }
      );


    mostrarClientes(
      filtrados
    );

  }
);


// ==================================================
// MOSTRAR CLIENTAS
// ==================================================

function mostrarClientes(
  lista
) {

  listaClientesAdmin.innerHTML =
    "";


  cantidadClientesMostrados.textContent =
    lista.length;


  if (
    lista.length === 0
  ) {

    const vacio =
      document.createElement(
        "div"
      );


    vacio.classList.add(
      "clientes-sin-resultados"
    );


    const titulo =
      document.createElement(
        "h3"
      );


    titulo.textContent =
      "No encontramos clientas";


    const texto =
      document.createElement(
        "p"
      );


    texto.textContent =
      "Prueba utilizando otro nombre, teléfono o correo.";


    vacio.append(
      titulo,
      texto
    );


    listaClientesAdmin.appendChild(
      vacio
    );


    return;

  }


  lista.forEach(
    crearTarjetaCliente
  );

}


// ==================================================
// TARJETA CLIENTA
// ==================================================

function crearTarjetaCliente(
  cliente
) {

  const reservasCliente =
    obtenerReservasCliente(
      cliente.id
    );


  const estadisticas =
    obtenerEstadisticasCliente(
      reservasCliente
    );


  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "cliente-admin-card"
  );


  // ==========================================
  // CABECERA
  // ==========================================

  const cabecera =
    document.createElement(
      "div"
    );


  cabecera.classList.add(
    "cliente-admin-cabecera"
  );


  const avatar =
    document.createElement(
      "div"
    );


  avatar.classList.add(
    "cliente-avatar"
  );


  avatar.textContent =
    obtenerIniciales(
      cliente.nombreCompleto
    );


  const identidad =
    document.createElement(
      "div"
    );


  identidad.classList.add(
    "cliente-identidad"
  );


  const nombre =
    document.createElement(
      "h3"
    );


  nombre.textContent =
    cliente.nombreCompleto;


  const estado =
    document.createElement(
      "span"
    );


  estado.textContent =
    estadisticas.proximas > 0
      ? "Con próxima hora"
      : "Sin hora próxima";


  identidad.append(
    nombre,
    estado
  );


  cabecera.append(
    avatar,
    identidad
  );


  // ==========================================
  // DATOS
  // ==========================================

  const datos =
    document.createElement(
      "div"
    );


  datos.classList.add(
    "cliente-admin-datos"
  );


  datos.append(

    crearDatoCliente(
      "Teléfono",
      cliente.telefono
      ||
      "Sin teléfono"
    ),

    crearDatoCliente(
      "Correo",
      cliente.correo
      ||
      "Sin correo"
    )

  );


  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const resumen =
    document.createElement(
      "div"
    );


  resumen.classList.add(
    "cliente-estadisticas"
  );


  resumen.append(

    crearEstadistica(
      estadisticas.total,
      "Reservas"
    ),

    crearEstadistica(
      estadisticas.proximas,
      "Próximas"
    ),

    crearEstadistica(
      estadisticas.canceladas,
      "Canceladas"
    )

  );


  // ==========================================
  // ACCIONES
  // ==========================================

  const acciones =
    document.createElement(
      "div"
    );


  acciones.classList.add(
    "cliente-admin-acciones"
  );


  const whatsapp =
    document.createElement(
      "button"
    );


  whatsapp.type =
    "button";


  whatsapp.classList.add(
    "btn-cliente-whatsapp"
  );


  whatsapp.textContent =
    "WhatsApp";


  whatsapp.disabled =
    !normalizarTelefonoWhatsApp(
      cliente.telefono
    );


  whatsapp.addEventListener(
    "click",
    () => {

      abrirWhatsAppCliente(
        cliente
      );

    }
  );


  const historial =
    document.createElement(
      "button"
    );


  historial.type =
    "button";


  historial.classList.add(
    "btn-cliente-historial"
  );


  historial.textContent =
    "Ver historial";


  historial.addEventListener(
    "click",
    () => {

      abrirHistorialCliente(
        cliente
      );

    }
  );


  acciones.append(
    whatsapp,
    historial
  );


  tarjeta.append(
    cabecera,
    datos,
    resumen,
    acciones
  );


  listaClientesAdmin.appendChild(
    tarjeta
  );

}


// ==================================================
// CREAR DATO
// ==================================================

function crearDatoCliente(
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
// CREAR ESTADÍSTICA
// ==================================================

function crearEstadistica(
  numero,
  texto
) {

  const elemento =
    document.createElement(
      "div"
    );


  const cantidad =
    document.createElement(
      "strong"
    );


  cantidad.textContent =
    numero;


  const etiqueta =
    document.createElement(
      "span"
    );


  etiqueta.textContent =
    texto;


  elemento.append(
    cantidad,
    etiqueta
  );


  return elemento;

}


// ==================================================
// RESERVAS DE CLIENTA
// ==================================================

function obtenerReservasCliente(
  clienteId
) {

  return reservas
    .filter(
      (reserva) =>
        reserva.usuarioId
        === clienteId
    )
    .sort(
      (a, b) => {

        const fechaA =
          `${a.fecha || ""}-${String(
            a.inicioMinutos || 0
          ).padStart(4, "0")}`;


        const fechaB =
          `${b.fecha || ""}-${String(
            b.inicioMinutos || 0
          ).padStart(4, "0")}`;


        return fechaB.localeCompare(
          fechaA
        );

      }
    );

}


// ==================================================
// ESTADÍSTICAS CLIENTE
// ==================================================

function obtenerEstadisticasCliente(
  reservasCliente
) {

  const hoy =
    obtenerFechaHoy();


  let proximas =
    0;


  let canceladas =
    0;


  reservasCliente.forEach(
    (reserva) => {

      if (
        esCancelada(
          reserva
        )
      ) {

        canceladas++;

        return;

      }


      if (
        reserva.fecha >= hoy
      ) {

        proximas++;

      }

    }
  );


  return {

    total:
    reservasCliente.length,

    proximas:
    proximas,

    canceladas:
    canceladas

  };

}


// ==================================================
// ABRIR HISTORIAL
// ==================================================

function abrirHistorialCliente(
  cliente
) {

  const reservasCliente =
    obtenerReservasCliente(
      cliente.id
    );


  nombreHistorialCliente.textContent =
    cliente.nombreCompleto;


  datosHistorialCliente.replaceChildren();


  datosHistorialCliente.append(

    crearDatoModal(
      "Teléfono",
      cliente.telefono
      ||
      "Sin teléfono"
    ),

    crearDatoModal(
      "Correo",
      cliente.correo
      ||
      "Sin correo"
    )

  );


  cantidadHistorialCliente.textContent =
    reservasCliente.length === 1
      ? "1 reserva"
      : `${reservasCliente.length} reservas`;


  historialClienteLista.replaceChildren();


  if (
    reservasCliente.length === 0
  ) {

    const vacio =
      document.createElement(
        "div"
      );


    vacio.classList.add(
      "historial-sin-reservas"
    );


    vacio.textContent =
      "Esta clienta todavía no tiene reservas.";


    historialClienteLista.appendChild(
      vacio
    );

  } else {

    reservasCliente.forEach(
      (reserva) => {

        historialClienteLista.appendChild(
          crearReservaHistorial(
            reserva
          )
        );

      }
    );

  }


  modalHistorialCliente.classList.remove(
    "oculto"
  );

}


// ==================================================
// DATO DEL MODAL
// ==================================================

function crearDatoModal(
  etiqueta,
  valor
) {

  const elemento =
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


  elemento.append(
    label,
    texto
  );


  return elemento;

}


// ==================================================
// RESERVA DEL HISTORIAL
// ==================================================

function crearReservaHistorial(
  reserva
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "cliente-historial-reserva"
  );


  const cabecera =
    document.createElement(
      "div"
    );


  cabecera.classList.add(
    "cliente-historial-superior"
  );


  const servicio =
    document.createElement(
      "strong"
    );


  servicio.textContent =
    reserva.servicioNombre
    ||
    "Servicio";


  const estado =
    document.createElement(
      "span"
    );


  const estadoVisual =
    obtenerEstadoVisual(
      reserva.estado
    );


  estado.textContent =
    estadoVisual.texto;


  estado.classList.add(
    "cliente-historial-estado",
    estadoVisual.clase
  );


  cabecera.append(
    servicio,
    estado
  );


  const fecha =
    document.createElement(
      "p"
    );


  fecha.textContent =
    `${formatearFecha(reserva.fecha)} · ${reserva.horaInicio || "--:--"} - ${reserva.horaFin || "--:--"}`;


  tarjeta.append(
    cabecera,
    fecha
  );


  // ==========================================
  // MOTIVO CAMBIO
  // ==========================================

  if (
    reserva.motivoCambio
  ) {

    const cambio =
      document.createElement(
        "div"
      );


    cambio.classList.add(
      "historial-observacion"
    );


    cambio.textContent =
      `Motivo de cambio: ${reserva.motivoCambio}`;


    tarjeta.appendChild(
      cambio
    );

  }


  // ==========================================
  // MOTIVO CANCELACIÓN
  // ==========================================

  if (
    reserva.motivoCancelacion
  ) {

    const cancelacion =
      document.createElement(
        "div"
      );


    cancelacion.classList.add(
      "historial-observacion",
      "historial-observacion-cancelacion"
    );


    cancelacion.textContent =
      `Motivo de cancelación: ${reserva.motivoCancelacion}`;


    tarjeta.appendChild(
      cancelacion
    );

  }


  return tarjeta;

}


// ==================================================
// ESTADO HISTORIAL
// ==================================================

function obtenerEstadoVisual(
  estado
) {

  switch (estado) {

    case "pendiente":

      return {
        texto: "Pendiente",
        clase: "historial-pendiente"
      };


    case "confirmada":

      return {
        texto: "Confirmada",
        clase: "historial-confirmada"
      };


    case "cambio_solicitado":

      return {
        texto: "Cambio solicitado",
        clase: "historial-cambio"
      };


    case "reagendada":

      return {
        texto: "Reagendada",
        clase: "historial-reagendada"
      };


    case "cancelada_cliente":

      return {
        texto: "Cancelada por clienta",
        clase: "historial-cancelada"
      };


    case "cancelada_admin":

      return {
        texto: "Cancelada por Bonsai",
        clase: "historial-cancelada"
      };


    default:

      return {
        texto: estado || "Sin estado",
        clase: "historial-finalizada"
      };

  }

}


// ==================================================
// WHATSAPP CLIENTA
// ==================================================

function abrirWhatsAppCliente(
  cliente
) {

  const telefono =
    normalizarTelefonoWhatsApp(
      cliente.telefono
    );


  if (!telefono) {

    alert(
      "La clienta no tiene un teléfono válido."
    );


    return;

  }


  const primerNombre =
    cliente.nombre
    ||
    cliente.nombreCompleto.split(" ")[0]
    ||
    "Hola";


  const mensaje =
    `Hola ${primerNombre}, soy Javii de Bonsai. ` +
    `Me comunico contigo desde nuestro sistema de reservas.`;


  const enlace =
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;


  window.open(
    enlace,
    "_blank",
    "noopener,noreferrer"
  );

}


// ==================================================
// NORMALIZAR WHATSAPP
// ==================================================

function normalizarTelefonoWhatsApp(
  telefono
) {

  if (!telefono) {

    return "";
  }


  let numero =
    String(
      telefono
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

    numero =
      "56" + numero;

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
// CANCELADA
// ==================================================

function esCancelada(
  reserva
) {

  return (
    reserva.estado
    === "cancelada_admin"

    ||

    reserva.estado
    === "cancelada_cliente"
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
      nombre
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (
    partes.length === 0
  ) {

    return "C";

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
// NORMALIZAR TEXTO BÚSQUEDA
// ==================================================

function normalizarTexto(
  texto
) {

  return String(
    texto || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();

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
  texto
) {

  if (!texto) {

    return null;

  }


  const partes =
    texto.split("-");


  return new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );

}


function formatearFecha(
  texto
) {

  const fecha =
    crearFechaLocal(
      texto
    );


  if (!fecha) {

    return "Sin fecha";

  }


  return fecha.toLocaleDateString(
    "es-CL",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


// ==================================================
// CERRAR MODAL
// ==================================================

function cerrarModalHistorial() {

  modalHistorialCliente.classList.add(
    "oculto"
  );

}


cerrarHistorialCliente.addEventListener(
  "click",
  cerrarModalHistorial
);


volverHistorialCliente.addEventListener(
  "click",
  cerrarModalHistorial
);


// Cerrar haciendo clic fuera del modal

modalHistorialCliente.addEventListener(
  "click",
  (evento) => {

    if (
      evento.target
      === modalHistorialCliente
    ) {

      cerrarModalHistorial();

    }

  }
);
