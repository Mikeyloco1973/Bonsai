// ==================================================
// BONSAI
// PANEL ADMINISTRATIVO - JAVII
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
  updateDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// CONFIGURACIÓN
// ==================================================

const ESTILISTA_ID = "javiera";

const INTERVALO = 30;

// 10:30
const APERTURA = 630;

// 21:00
const CIERRE = 1260;


// ==================================================
// VARIABLES
// ==================================================

let usuarioActual = null;

let reservaSeleccionada = null;

let clienteSeleccionado = null;

let horaReagendarSeleccionada = null;

let notificacionCancelacion = null;


// ==================================================
// ESTADÍSTICAS
// ==================================================

const reservasPendientes =
  document.getElementById("reservasPendientes");

const reservasHoy =
  document.getElementById("reservasHoy");

const reservasProximas =
  document.getElementById("reservasProximas");

const clientesRegistrados =
  document.getElementById("clientesRegistrados");


// ==================================================
// SOLICITUDES
// ==================================================

const listaSolicitudes =
  document.getElementById("listaSolicitudes");

const cargandoSolicitudes =
  document.getElementById("cargandoSolicitudes");


// ==================================================
// AGENDA
// ==================================================

const listaAgenda =
  document.getElementById("listaAgenda");

const cargandoAgenda =
  document.getElementById("cargandoAgenda");

const fechaAdmin =
  document.getElementById("fechaAdmin");

const tituloFechaAgenda =
  document.getElementById("tituloFechaAgenda");

const btnHoy =
  document.getElementById("btnHoy");


// ==================================================
// SESIÓN
// ==================================================

const btnCerrarSesion =
  document.getElementById("btnCerrarSesion");


// ==================================================
// MODAL CANCELAR
// ==================================================

const modalCancelar =
  document.getElementById("modalCancelar");

const cerrarModalCancelar =
  document.getElementById("cerrarModalCancelar");

const volverCancelar =
  document.getElementById("volverCancelar");

const confirmarCancelacion =
  document.getElementById("confirmarCancelacion");

const motivoCancelacion =
  document.getElementById("motivoCancelacion");

const resumenCancelar =
  document.getElementById("resumenCancelar");


// ==================================================
// MODAL CAMBIO
// ==================================================

const modalCambio =
  document.getElementById("modalCambio");

const cerrarModalCambio =
  document.getElementById("cerrarModalCambio");

const confirmarCambio =
  document.getElementById("confirmarCambio");

const motivoCambio =
  document.getElementById("motivoCambio");

const resumenCambio =
  document.getElementById("resumenCambio");

const whatsappCambio =
  document.getElementById("whatsappCambio");


// ==================================================
// MODAL REAGENDAR
// ==================================================

const modalReagendar =
  document.getElementById("modalReagendar");

const cerrarModalReagendar =
  document.getElementById("cerrarModalReagendar");

const volverReagendar =
  document.getElementById("volverReagendar");

const resumenReagendar =
  document.getElementById("resumenReagendar");

const fechaReagendar =
  document.getElementById("fechaReagendar");

const mensajeHorasReagendar =
  document.getElementById("mensajeHorasReagendar");

const horasReagendar =
  document.getElementById("horasReagendar");

const nuevoHorarioResumen =
  document.getElementById("nuevoHorarioResumen");

const nuevoHorarioTexto =
  document.getElementById("nuevoHorarioTexto");

const confirmarReagendamiento =
  document.getElementById("confirmarReagendamiento");

// ==================================================
// MODAL NOTIFICACIÓN CANCELACIÓN
// ==================================================

const modalNotificacionCancelacion =
  document.getElementById(
    "modalNotificacionCancelacion"
  );


const cerrarModalNotificacionCancelacion =
  document.getElementById(
    "cerrarModalNotificacionCancelacion"
  );


const btnCerrarNotificacionCancelacion =
  document.getElementById(
    "btnCerrarNotificacionCancelacion"
  );


const btnNotificarCancelacionWhatsApp =
  document.getElementById(
    "btnNotificarCancelacionWhatsApp"
  );


const resumenNotificacionCancelacion =
  document.getElementById(
    "resumenNotificacionCancelacion"
  );

// ==================================================
// PROTEGER PANEL
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


    try {

      const adminDoc =
        await getDoc(
          doc(
            db,
            "usuarios",
            usuario.uid
          )
        );


      if (
        !adminDoc.exists()
        ||
        adminDoc.data().rol !== "admin"
      ) {

        alert(
          "No tienes permisos para acceder al panel administrativo."
        );


        window.location.href =
          "index.html";


        return;
      }


      fechaAdmin.value =
        obtenerFechaHoy();


      await actualizarPanel();


    } catch (error) {

      console.error(
        "Error validando administrador:",
        error
      );


      alert(
        "No fue posible comprobar los permisos del administrador."
      );

    }

  }
);


// ==================================================
// ACTUALIZAR PANEL
// ==================================================

async function actualizarPanel() {

  await cargarEstadisticas();

  await cargarSolicitudes();

  await cargarAgenda();

}


// ==================================================
// ESTADÍSTICAS
// ==================================================

async function cargarEstadisticas() {

  try {

    const resultado =
      await getDocs(
        collection(
          db,
          "reservas"
        )
      );


    const hoy =
      obtenerFechaHoy();


    let pendientes = 0;

    let cantidadHoy = 0;

    let proximas = 0;


    resultado.forEach(
      (documento) => {

        const reserva =
          documento.data();


        if (
          reserva.estado === "pendiente"
          ||
          reserva.estado === "cambio_solicitado"
        ) {

          pendientes++;

        }


        if (
          reserva.fecha === hoy
          &&
          !esReservaCancelada(reserva)
        ) {

          cantidadHoy++;

        }


        if (
          reserva.fecha >= hoy
          &&
          !esReservaCancelada(reserva)
        ) {

          proximas++;

        }

      }
    );


    reservasPendientes.textContent =
      pendientes;

    reservasHoy.textContent =
      cantidadHoy;

    reservasProximas.textContent =
      proximas;


    // ======================================
    // CLIENTES
    // ======================================

    const usuarios =
      await getDocs(
        collection(
          db,
          "usuarios"
        )
      );


    let clientes = 0;


    usuarios.forEach(
      (documento) => {

        if (
          documento.data().rol
          === "cliente"
        ) {

          clientes++;

        }

      }
    );


    clientesRegistrados.textContent =
      clientes;


  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );

  }

}


// ==================================================
// SOLICITUDES
// ==================================================

async function cargarSolicitudes() {

  listaSolicitudes.innerHTML =
    "";


  cargandoSolicitudes.classList.remove(
    "oculto"
  );


  cargandoSolicitudes.textContent =
    "Cargando solicitudes...";


  try {

    const resultado =
      await getDocs(
        query(
          collection(
            db,
            "reservas"
          ),
          where(
            "estado",
            "in",
            [
              "pendiente",
              "cambio_solicitado"
            ]
          )
        )
      );


    const reservas = [];


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
      ordenarReservas
    );


    cargandoSolicitudes.classList.add(
      "oculto"
    );


    if (
      reservas.length === 0
    ) {

      listaSolicitudes.innerHTML = `

                <div class="admin-sin-reservas">

                    <h3>
                        No hay solicitudes por gestionar
                    </h3>

                    <p>
                        Las nuevas solicitudes aparecerán aquí.
                    </p>

                </div>

            `;


      return;
    }


    for (
      const reserva
      of reservas
      ) {

      await crearTarjetaReserva(
        reserva,
        listaSolicitudes
      );

    }


  } catch (error) {

    console.error(
      "Error cargando solicitudes:",
      error
    );


    cargandoSolicitudes.textContent =
      "No fue posible cargar las solicitudes.";

  }

}


// ==================================================
// AGENDA
// ==================================================

async function cargarAgenda() {

  if (!fechaAdmin.value) {

    return;
  }


  listaAgenda.innerHTML =
    "";


  cargandoAgenda.classList.remove(
    "oculto"
  );


  cargandoAgenda.textContent =
    "Cargando agenda...";


  try {

    const resultado =
      await getDocs(
        query(
          collection(
            db,
            "reservas"
          ),
          where(
            "fecha",
            "==",
            fechaAdmin.value
          )
        )
      );


    const reservas = [];


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
      ordenarReservas
    );


    mostrarTituloFecha(
      fechaAdmin.value
    );


    cargandoAgenda.classList.add(
      "oculto"
    );


    if (
      reservas.length === 0
    ) {

      listaAgenda.innerHTML = `

                <div class="admin-sin-reservas">

                    <h3>
                        No hay reservas
                    </h3>

                    <p>
                        No existen reservas para este día.
                    </p>

                </div>

            `;


      return;
    }


    for (
      const reserva
      of reservas
      ) {

      await crearTarjetaReserva(
        reserva,
        listaAgenda
      );

    }


  } catch (error) {

    console.error(
      "Error cargando agenda:",
      error
    );


    cargandoAgenda.textContent =
      "No fue posible cargar la agenda.";

  }

}


// ==================================================
// TARJETA RESERVA
// ==================================================

async function crearTarjetaReserva(
  reserva,
  contenedor
) {

  const cliente =
    await obtenerCliente(
      reserva.usuarioId,
      reserva.usuarioCorreo
    );


  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "admin-reserva-card-nueva"
  );

  tarjeta.dataset.reservaId =
    reserva.id;

  const estado =
    obtenerEstadoVisual(
      reserva
    );


  const fechaBonita =
    formatearFecha(
      reserva.fecha
    );


  const precio =
    formatearPrecio(
      reserva.precio,
      reserva.precioDesde
    );


  tarjeta.innerHTML = `

        <div class="admin-reserva-superior">

            <div>

                <span class="admin-reserva-fecha">
                    ${escaparHTML(fechaBonita)}
                </span>

                <h3>
                    ${escaparHTML(
    reserva.servicioNombre
  )}
                </h3>

            </div>


            <span class="estado-reserva ${estado.clase}">
                ${escaparHTML(estado.texto)}
            </span>

        </div>


        <div class="admin-reserva-horario">

            <strong>
                ${escaparHTML(reserva.horaInicio)}
            </strong>

            <span>
                a
            </span>

            <strong>
                ${escaparHTML(reserva.horaFin)}
            </strong>

        </div>


        <div class="admin-cliente-datos">

            <div>

                <span>
                    Clienta
                </span>

                <strong>
                    ${escaparHTML(
    cliente.nombreCompleto
  )}
                </strong>

            </div>


            <div>

                <span>
                    WhatsApp
                </span>

                <strong>
                    ${escaparHTML(
    cliente.telefono
  )}
                </strong>

            </div>


            <div>

                <span>
                    Correo
                </span>

                <strong>
                    ${escaparHTML(
    cliente.correo
  )}
                </strong>

            </div>


            <div>

                <span>
                    Valor
                </span>

                <strong>
                    ${escaparHTML(precio)}
                </strong>

            </div>

        </div>


        <div class="admin-contacto">

            <button
                    type="button"
                    class="btn-whatsapp"
            >
                Contactar por WhatsApp
            </button>

        </div>


        <div class="admin-acciones-reserva">
        </div>

    `;


  // ==================================================
  // WHATSAPP
  // ==================================================

  tarjeta
    .querySelector(
      ".btn-whatsapp"
    )
    .addEventListener(
      "click",
      () => {

        abrirWhatsApp(
          cliente,
          reserva
        );

      }
    );


  const acciones =
    tarjeta.querySelector(
      ".admin-acciones-reserva"
    );


  // ==================================================
  // PENDIENTE
  // ==================================================

  if (
    reserva.estado === "pendiente"
  ) {

    const btnAceptar =
      crearBoton(
        "Aceptar",
        "btn-admin-aceptar"
      );


    btnAceptar.addEventListener(
      "click",
      async () => {

        await aceptarReserva(
          reserva
        );

      }
    );


    const btnCambio =
      crearBoton(
        "Solicitar cambio",
        "btn-admin-reagendar"
      );


    btnCambio.addEventListener(
      "click",
      () => {

        abrirModalCambio(
          reserva,
          cliente
        );

      }
    );


    const btnCancelar =
      crearBoton(
        "Cancelar",
        "btn-admin-cancelar"
      );


    btnCancelar.addEventListener(
      "click",
      () => {

        abrirModalCancelar(
          reserva,
          cliente
        );

      }
    );


    acciones.append(
      btnAceptar,
      btnCambio,
      btnCancelar
    );

  }


  // ==================================================
  // CONFIRMADA O REAGENDADA
  // ==================================================

  if (
    reserva.estado === "confirmada"
    ||
    reserva.estado === "reagendada"
  ) {

    const btnCambio =
      crearBoton(
        "Solicitar cambio",
        "btn-admin-reagendar"
      );


    btnCambio.addEventListener(
      "click",
      () => {

        abrirModalCambio(
          reserva,
          cliente
        );

      }
    );


    const btnCancelar =
      crearBoton(
        "Cancelar",
        "btn-admin-cancelar"
      );


    btnCancelar.addEventListener(
      "click",
      () => {

        abrirModalCancelar(
          reserva,
          cliente
        );

      }
    );


    acciones.append(
      btnCambio,
      btnCancelar
    );

  }


  // ==================================================
  // CAMBIO SOLICITADO
  // ==================================================

  if (
    reserva.estado === "cambio_solicitado"
  ) {

    const btnReagendar =
      crearBoton(
        "Reagendar",
        "btn-admin-aceptar"
      );


    btnReagendar.addEventListener(
      "click",
      () => {

        abrirModalReagendar(
          reserva,
          cliente
        );

      }
    );


    const btnEditarMotivo =
      crearBoton(
        "Editar motivo",
        "btn-admin-reagendar"
      );


    btnEditarMotivo.addEventListener(
      "click",
      () => {

        abrirModalCambio(
          reserva,
          cliente
        );

      }
    );


    const btnCancelar =
      crearBoton(
        "Cancelar",
        "btn-admin-cancelar"
      );


    btnCancelar.addEventListener(
      "click",
      () => {

        abrirModalCancelar(
          reserva,
          cliente
        );

      }
    );


    acciones.append(
      btnReagendar,
      btnEditarMotivo,
      btnCancelar
    );

  }


  contenedor.appendChild(
    tarjeta
  );

}


// ==================================================
// OBTENER CLIENTE
// ==================================================

async function obtenerCliente(
  uid,
  correoReserva = ""
) {

  try {

    const documento =
      await getDoc(
        doc(
          db,
          "usuarios",
          uid
        )
      );


    if (
      documento.exists()
    ) {

      const datos =
        documento.data();


      const nombre =
        datos.nombre || "";


      const apellido =
        datos.apellido
        ||
        datos.apellidos
        ||
        "";


      const correo =
        datos.correo
        ||
        datos.email
        ||
        correoReserva
        ||
        "Sin correo";


      return {

        nombreCompleto:
          `${nombre} ${apellido}`.trim()
          || "Cliente",

        telefono:
          datos.telefono
          || "Sin teléfono",

        correo:
        correo

      };

    }


  } catch (error) {

    console.error(
      "Error obteniendo cliente:",
      error
    );

  }


  return {

    nombreCompleto:
      "Cliente",

    telefono:
      "Sin teléfono",

    correo:
      correoReserva
      || "Sin correo"

  };

}


// ==================================================
// ACEPTAR RESERVA
// ==================================================

async function aceptarReserva(
  reserva
) {

  const confirmar =
    confirm(
      `¿Aceptar la reserva de ${reserva.servicioNombre} para el ${formatearFecha(reserva.fecha)} a las ${reserva.horaInicio}?`
    );


  if (!confirmar) {

    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "reservas",
        reserva.id
      ),
      {

        estado:
          "confirmada",

        fechaAceptacion:
          serverTimestamp(),

        fechaActualizacion:
          serverTimestamp()

      }
    );


    alert(
      "Reserva aceptada correctamente."
    );


    await actualizarPanel();


  } catch (error) {

    console.error(
      "Error aceptando reserva:",
      error
    );


    alert(
      "No fue posible aceptar la reserva."
    );

  }

}


// ==================================================
// MODAL CANCELAR
// ==================================================

function abrirModalCancelar(
  reserva,
  cliente
) {

  reservaSeleccionada =
    reserva;


  clienteSeleccionado =
    cliente;


  motivoCancelacion.value =
    "";


  resumenCancelar.innerHTML = `

        <strong>
            ${escaparHTML(
    cliente.nombreCompleto
  )}
        </strong>

        <span>
            ${escaparHTML(
    reserva.servicioNombre
  )}
        </span>

        <span>
            ${escaparHTML(
    formatearFecha(
      reserva.fecha
    )
  )}
        </span>

        <span>
            ${escaparHTML(
    reserva.horaInicio
  )}
            -
            ${escaparHTML(
    reserva.horaFin
  )}
        </span>

    `;


  modalCancelar.classList.remove(
    "oculto"
  );


  motivoCancelacion.focus();

}


// ==================================================
// CONFIRMAR CANCELACIÓN
// ==================================================

confirmarCancelacion.addEventListener(
  "click",
  async () => {

    if (!reservaSeleccionada) {

      return;
    }


    const motivo =
      motivoCancelacion
        .value
        .trim();


    if (
      motivo.length < 5
    ) {

      alert(
        "Debes ingresar el motivo de la cancelación."
      );


      motivoCancelacion.focus();


      return;
    }


    confirmarCancelacion.disabled =
      true;


    confirmarCancelacion.textContent =
      "Cancelando...";


    try {

      const reservaCancelada =
        reservaSeleccionada;


      const clienteCancelado =
        clienteSeleccionado;


      await cancelarReservaAdmin(
        reservaCancelada,
        motivo
      );


// Guardamos la información antes de cerrar
// el modal anterior.

      notificacionCancelacion = {

        reserva:
        reservaCancelada,

        cliente:
        clienteCancelado,

        motivo:
        motivo

      };


// Cerramos el modal de cancelación.

      cerrarModales();


// Mostramos el nuevo modal.

      abrirNotificacionCancelacion();


      await actualizarPanel();


    } catch (error) {

      console.error(
        "Error cancelando reserva:",
        error
      );


      alert(
        "No fue posible cancelar la reserva."
      );


    } finally {

      confirmarCancelacion.disabled =
        false;


      confirmarCancelacion.textContent =
        "Cancelar reserva";

    }

  }
);


// ==================================================
// CANCELAR RESERVA
// ==================================================

async function cancelarReservaAdmin(
  reserva,
  motivo
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
      // LEER RESERVA
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


      if (
        datos.estado === "cancelada_admin"
        ||
        datos.estado === "cancelada_cliente"
      ) {

        throw new Error(
          "reserva-ya-cancelada"
        );

      }


      // ======================================
      // REFERENCIAS REALES DE LOS SLOTS
      // ======================================

      const referenciasSlots =
        [];


      for (
        let minuto =
          datos.inicioMinutos;

        minuto <
        datos.finMinutos;

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
      // LEER TODOS LOS SLOTS ANTES DE ESCRIBIR
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

      transaction.update(
        reservaRef,
        {

          estado:
            "cancelada_admin",

          motivoCancelacion:
          motivo,

          canceladaPor:
            "admin",

          fechaCancelacion:
            serverTimestamp(),

          fechaActualizacion:
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
// MODAL SOLICITAR CAMBIO
// ==================================================

function abrirModalCambio(
  reserva,
  cliente
) {

  reservaSeleccionada =
    reserva;


  clienteSeleccionado =
    cliente;


  motivoCambio.value =
    reserva.motivoCambio
    ||
    "";


  resumenCambio.innerHTML = `

        <strong>
            ${escaparHTML(
    cliente.nombreCompleto
  )}
        </strong>

        <span>
            ${escaparHTML(
    reserva.servicioNombre
  )}
        </span>

        <span>
            ${escaparHTML(
    formatearFecha(
      reserva.fecha
    )
  )}
        </span>

        <span>
            ${escaparHTML(
    reserva.horaInicio
  )}
            -
            ${escaparHTML(
    reserva.horaFin
  )}
        </span>

        <span>
            ${escaparHTML(
    cliente.telefono
  )}
        </span>

    `;


  modalCambio.classList.remove(
    "oculto"
  );


  motivoCambio.focus();

}


// ==================================================
// GUARDAR SOLICITUD DE CAMBIO
// ==================================================

confirmarCambio.addEventListener(
  "click",
  async () => {

    if (!reservaSeleccionada) {

      return;
    }


    const motivo =
      motivoCambio
        .value
        .trim();


    if (
      motivo.length < 5
    ) {

      alert(
        "Debes explicar el motivo del cambio."
      );


      motivoCambio.focus();


      return;
    }


    confirmarCambio.disabled =
      true;


    confirmarCambio.textContent =
      "Guardando...";


    try {

      await updateDoc(
        doc(
          db,
          "reservas",
          reservaSeleccionada.id
        ),
        {

          estado:
            "cambio_solicitado",

          motivoCambio:
          motivo,

          fechaSolicitudCambio:
            serverTimestamp(),

          fechaActualizacion:
            serverTimestamp()

        }
      );


      alert(
        "Solicitud de cambio guardada. La hora seguirá bloqueada mientras coordinas con la clienta."
      );


      cerrarModales();


      await actualizarPanel();


    } catch (error) {

      console.error(
        "Error guardando cambio:",
        error
      );


      alert(
        "No fue posible guardar la solicitud."
      );


    } finally {

      confirmarCambio.disabled =
        false;


      confirmarCambio.textContent =
        "Guardar solicitud";

    }

  }
);


// ==================================================
// WHATSAPP MODAL
// ==================================================

whatsappCambio.addEventListener(
  "click",
  () => {

    if (
      !reservaSeleccionada
      ||
      !clienteSeleccionado
    ) {

      return;
    }


    abrirWhatsApp(
      clienteSeleccionado,
      reservaSeleccionada,
      motivoCambio.value.trim()
    );

  }
);


// ==================================================
// WHATSAPP
// ==================================================

function abrirWhatsApp(
  cliente,
  reserva,
  motivo = ""
) {

  const telefono =
    normalizarTelefonoWhatsApp(
      cliente.telefono
    );


  if (!telefono) {

    alert(
      "La clienta no tiene un teléfono válido registrado."
    );


    return;
  }


  const primerNombre =
    cliente.nombreCompleto
      .split(" ")[0];


  let mensaje =
    `Hola ${primerNombre}, soy Javii de Bonsai. ` +
    `Me comunico contigo por tu hora de ${reserva.servicioNombre} ` +
    `agendada para el ${formatearFecha(reserva.fecha)} ` +
    `a las ${reserva.horaInicio}.`;


  if (motivo) {

    mensaje +=
      ` Necesito conversar contigo porque: ${motivo}`;

  }


  const enlace =
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;


  window.open(
    enlace,
    "_blank",
    "noopener,noreferrer"
  );

}


// ==================================================
// NORMALIZAR WHATSAPP CHILE
// ==================================================

function normalizarTelefonoWhatsApp(
  telefono
) {

  if (!telefono) {

    return "";
  }


  let numero =
    telefono.replace(
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


  // +569XXXXXXXX
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
// ABRIR MODAL REAGENDAR
// ==================================================

async function abrirModalReagendar(
  reserva,
  cliente
) {

  reservaSeleccionada =
    reserva;


  clienteSeleccionado =
    cliente;


  horaReagendarSeleccionada =
    null;


  fechaReagendar.min =
    obtenerFechaHoy();


  fechaReagendar.value =
    obtenerFechaInicialReagendar(
      reserva
    );


  resumenReagendar.innerHTML = `

        <strong>
            ${escaparHTML(
    cliente.nombreCompleto
  )}
        </strong>

        <span>
            ${escaparHTML(
    reserva.servicioNombre
  )}
        </span>

        <span>
            Horario actual:
            ${escaparHTML(
    formatearFecha(
      reserva.fecha
    )
  )}
        </span>

        <span>
            ${escaparHTML(
    reserva.horaInicio
  )}
            -
            ${escaparHTML(
    reserva.horaFin
  )}
        </span>

        <span>
            Duración:
            ${escaparHTML(
    formatearDuracion(
      reserva.duracionMinutos
    )
  )}
        </span>

    `;


  nuevoHorarioResumen.classList.add(
    "oculto"
  );


  confirmarReagendamiento.disabled =
    true;


  modalReagendar.classList.remove(
    "oculto"
  );


  await cargarHorasReagendar();

}


// ==================================================
// FECHA INICIAL REAGENDAR
// ==================================================

function obtenerFechaInicialReagendar(
  reserva
) {

  const hoy =
    obtenerFechaHoy();


  if (
    reserva.fecha >= hoy
    &&
    fechaAtencionValida(
      reserva.fecha
    )
  ) {

    return reserva.fecha;

  }


  let fecha =
    new Date();


  for (
    let intento = 0;

    intento < 7;

    intento++
  ) {

    const fechaTexto =
      fechaAString(
        fecha
      );


    if (
      fechaAtencionValida(
        fechaTexto
      )
    ) {

      return fechaTexto;

    }


    fecha.setDate(
      fecha.getDate() + 1
    );

  }


  return hoy;

}


// ==================================================
// CAMBIO FECHA REAGENDAR
// ==================================================

fechaReagendar.addEventListener(
  "change",
  async () => {

    horaReagendarSeleccionada =
      null;


    nuevoHorarioResumen.classList.add(
      "oculto"
    );


    confirmarReagendamiento.disabled =
      true;


    if (!fechaReagendar.value) {

      horasReagendar.innerHTML =
        "";


      mensajeHorasReagendar.textContent =
        "Selecciona una fecha.";


      return;
    }


    if (
      fechaReagendar.value
      <
      obtenerFechaHoy()
    ) {

      alert(
        "No puedes seleccionar una fecha anterior a hoy."
      );


      fechaReagendar.value =
        "";


      horasReagendar.innerHTML =
        "";


      return;
    }


    if (
      !fechaAtencionValida(
        fechaReagendar.value
      )
    ) {

      alert(
        "Javii atiende de martes a sábado."
      );


      fechaReagendar.value =
        "";


      horasReagendar.innerHTML =
        "";


      mensajeHorasReagendar.textContent =
        "Selecciona una fecha válida.";


      return;
    }


    await cargarHorasReagendar();

  }
);


// ==================================================
// HORAS REAGENDAMIENTO
// ==================================================

async function cargarHorasReagendar() {

  horasReagendar.innerHTML =
    "";


  horaReagendarSeleccionada =
    null;


  nuevoHorarioResumen.classList.add(
    "oculto"
  );


  confirmarReagendamiento.disabled =
    true;


  if (
    !reservaSeleccionada
    ||
    !fechaReagendar.value
  ) {

    mensajeHorasReagendar.textContent =
      "Selecciona una fecha.";


    return;
  }


  if (
    !fechaAtencionValida(
      fechaReagendar.value
    )
  ) {

    mensajeHorasReagendar.textContent =
      "Javii no atiende domingos ni lunes.";


    return;
  }


  mensajeHorasReagendar.textContent =
    "Consultando horarios disponibles...";


  try {

    const [
      resultadoSlots,
      bloqueos
    ] =
      await Promise.all([

        getDocs(
          query(
            collection(
              db,
              "agendaSlots"
            ),
            where(
              "fecha",
              "==",
              fechaReagendar.value
            )
          )
        ),

        obtenerBloqueosFecha(
          fechaReagendar.value
        )

      ]);


    const slotsOcupados =
      new Map();


    resultadoSlots.forEach(
      (documento) => {

        const datos =
          documento.data();


        if (
          datos.estilistaId
          === ESTILISTA_ID
        ) {

          slotsOcupados.set(

            Number(
              datos.minuto
            ),

            datos.reservaId

          );

        }

      }
    );


    const duracion =
      Number(
        reservaSeleccionada
          .duracionMinutos
      );


    let disponibles = 0;


    for (
      let inicio =
        APERTURA;

      inicio + duracion
      <= CIERRE;

      inicio += INTERVALO
    ) {

      if (
        horaYaPaso(
          fechaReagendar.value,
          inicio
        )
      ) {

        continue;
      }


      const bloquesNecesarios =
        obtenerBloques(
          inicio,
          duracion
        );


      const choqueReserva =
        bloquesNecesarios.some(
          (minuto) => {

            if (
              !slotsOcupados.has(
                minuto
              )
            ) {

              return false;

            }


            // Los bloques que ya pertenecen
            // a esta misma reserva pueden
            // reutilizarse.

            return (
              slotsOcupados.get(
                minuto
              )
              !==
              reservaSeleccionada.id
            );

          }
        );


      if (choqueReserva) {

        continue;
      }


      const fin =
        inicio + duracion;


      if (
        hayChoqueConBloqueo(
          inicio,
          fin,
          bloqueos
        )
      ) {

        continue;
      }


      crearBotonHoraReagendar(
        inicio
      );


      disponibles++;

    }


    mensajeHorasReagendar.textContent =
      disponibles === 0

        ? "No hay horarios disponibles para este servicio en esa fecha."

        : "Selecciona el nuevo horario:";


  } catch (error) {

    console.error(
      "Error consultando horarios:",
      error
    );


    mensajeHorasReagendar.textContent =
      "No fue posible consultar la disponibilidad.";

  }

}


// ==================================================
// BOTÓN HORA REAGENDAR
// ==================================================

function crearBotonHoraReagendar(
  inicio
) {

  const boton =
    document.createElement(
      "button"
    );


  boton.type =
    "button";


  boton.classList.add(
    "hora-reagendar-btn"
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
          ".hora-reagendar-btn"
        )
        .forEach(
          (elemento) => {

            elemento.classList.remove(
              "seleccionada"
            );

          }
        );


      boton.classList.add(
        "seleccionada"
      );


      horaReagendarSeleccionada =
        inicio;


      const fin =
        inicio
        +
        Number(
          reservaSeleccionada
            .duracionMinutos
        );


      nuevoHorarioTexto.textContent =
        `${minutosAHora(inicio)} - ${minutosAHora(fin)}`;


      nuevoHorarioResumen.classList.remove(
        "oculto"
      );


      confirmarReagendamiento.disabled =
        false;

    }
  );


  horasReagendar.appendChild(
    boton
  );

}


// ==================================================
// CONFIRMAR REAGENDAMIENTO
// ==================================================

confirmarReagendamiento.addEventListener(
  "click",
  async () => {

    if (
      !reservaSeleccionada
      ||
      horaReagendarSeleccionada === null
      ||
      !fechaReagendar.value
    ) {

      alert(
        "Selecciona una nueva fecha y horario."
      );


      return;
    }


    const duracion =
      Number(
        reservaSeleccionada
          .duracionMinutos
      );


    const nuevaHoraFin =
      horaReagendarSeleccionada
      +
      duracion;


    const confirmar =
      confirm(
        `¿Reagendar esta reserva para el ${formatearFecha(fechaReagendar.value)} de ${minutosAHora(horaReagendarSeleccionada)} a ${minutosAHora(nuevaHoraFin)}?`
      );


    if (!confirmar) {

      return;
    }


    confirmarReagendamiento.disabled =
      true;


    confirmarReagendamiento.textContent =
      "Comprobando...";


    try {

      // ======================================
      // VOLVER A REVISAR BLOQUEOS
      // ======================================

      const bloqueos =
        await obtenerBloqueosFecha(
          fechaReagendar.value
        );


      if (
        hayChoqueConBloqueo(
          horaReagendarSeleccionada,
          nuevaHoraFin,
          bloqueos
        )
      ) {

        alert(
          "Ese horario acaba de ser bloqueado. Selecciona otro."
        );


        await cargarHorasReagendar();


        return;
      }


      confirmarReagendamiento.textContent =
        "Reagendando...";


      const fechaNueva =
        fechaReagendar.value;


      await reagendarReservaAdmin(
        reservaSeleccionada,
        fechaNueva,
        horaReagendarSeleccionada
      );


      cerrarModales();


      alert(
        "Reserva reagendada correctamente."
      );


      fechaAdmin.value =
        fechaNueva;


      cambiarSeccion(
        "agenda"
      );


      await actualizarPanel();


    } catch (error) {

      console.error(
        "Error reagendando reserva:",
        error
      );


      if (
        error.message
        === "horario-ocupado"
      ) {

        alert(
          "Ese horario acaba de ser ocupado. Selecciona otro."
        );


        await cargarHorasReagendar();


      } else if (
        error.message
        === "reserva-cancelada"
      ) {

        alert(
          "Esta reserva ya fue cancelada."
        );


        cerrarModales();


        await actualizarPanel();


      } else {

        alert(
          "No fue posible reagendar la reserva."
        );

      }


    } finally {

      confirmarReagendamiento.disabled =
        false;


      confirmarReagendamiento.textContent =
        "Confirmar reagendamiento";

    }

  }
);


// ==================================================
// REAGENDAR EN FIRESTORE
// ==================================================

async function reagendarReservaAdmin(
  reserva,
  nuevaFecha,
  nuevoInicio
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

      // ==================================================
      // 1. LEER RESERVA ACTUAL
      // ==================================================

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


      const datosActuales =
        reservaDoc.data();


      if (
        datosActuales.estado
        === "cancelada_admin"

        ||

        datosActuales.estado
        === "cancelada_cliente"
      ) {

        throw new Error(
          "reserva-cancelada"
        );

      }


      const duracion =
        Number(
          datosActuales
            .duracionMinutos
        );


      const nuevoFin =
        nuevoInicio
        +
        duracion;


      // ==================================================
      // 2. REFERENCIAS ANTIGUAS
      // ==================================================

      const slotsAntiguos =
        [];


      for (
        let minuto =
          Number(
            datosActuales.inicioMinutos
          );

        minuto
        <
        Number(
          datosActuales.finMinutos
        );

        minuto += INTERVALO
      ) {

        slotsAntiguos.push(
          doc(
            db,
            "agendaSlots",
            `${datosActuales.fecha}_${ESTILISTA_ID}_${minuto}`
          )
        );

      }


      // ==================================================
      // 3. REFERENCIAS NUEVAS
      // ==================================================

      const slotsNuevos =
        [];


      for (
        let minuto =
          nuevoInicio;

        minuto <
        nuevoFin;

        minuto += INTERVALO
      ) {

        slotsNuevos.push(
          doc(
            db,
            "agendaSlots",
            `${nuevaFecha}_${ESTILISTA_ID}_${minuto}`
          )
        );

      }


      // ==================================================
      // 4. LEER NUEVOS SLOTS
      // ==================================================

      const documentosNuevos =
        [];


      for (
        const referencia
        of slotsNuevos
        ) {

        documentosNuevos.push({

          ref:
          referencia,

          snap:
            await transaction.get(
              referencia
            )

        });

      }


      // ==================================================
      // 5. LEER SLOTS ANTIGUOS
      // ==================================================

      const documentosAntiguos =
        [];


      for (
        const referencia
        of slotsAntiguos
        ) {

        documentosAntiguos.push({

          ref:
          referencia,

          snap:
            await transaction.get(
              referencia
            )

        });

      }


      // ==================================================
      // IMPORTANTE:
      // Hasta aquí solamente hicimos lecturas.
      // Las escrituras empiezan después.
      // ==================================================


      // ==================================================
      // 6. VERIFICAR CONFLICTOS
      // ==================================================

      documentosNuevos.forEach(
        (item) => {

          if (
            item.snap.exists()
            &&
            item.snap.data().reservaId
            !== reserva.id
          ) {

            throw new Error(
              "horario-ocupado"
            );

          }

        }
      );


      // ==================================================
      // 7. ACTUALIZAR RESERVA
      // ==================================================

      transaction.update(
        reservaRef,
        {

          fechaAnterior:
          datosActuales.fecha,

          horaInicioAnterior:
          datosActuales.horaInicio,

          horaFinAnterior:
          datosActuales.horaFin,


          fecha:
          nuevaFecha,

          horaInicio:
            minutosAHora(
              nuevoInicio
            ),

          horaFin:
            minutosAHora(
              nuevoFin
            ),

          inicioMinutos:
          nuevoInicio,

          finMinutos:
          nuevoFin,


          estado:
            "reagendada",

          reagendada:
            true,

          fechaReagendamiento:
            serverTimestamp(),

          fechaActualizacion:
            serverTimestamp()

        }
      );


      // ==================================================
      // 8. RUTAS NUEVAS
      // ==================================================

      const rutasNuevas =
        new Set(
          slotsNuevos.map(
            (referencia) =>
              referencia.path
          )
        );


      // ==================================================
      // 9. ELIMINAR SLOTS ANTIGUOS
      // QUE YA NO FORMAN PARTE DEL HORARIO
      // ==================================================

      documentosAntiguos.forEach(
        (item) => {

          if (
            item.snap.exists()
            &&
            item.snap.data().reservaId
            === reserva.id
            &&
            !rutasNuevas.has(
              item.ref.path
            )
          ) {

            transaction.delete(
              item.ref
            );

          }

        }
      );


      // ==================================================
      // 10. CREAR ÚNICAMENTE SLOTS QUE NO EXISTEN
      // ==================================================
      //
      // ESTA ES LA CORRECCIÓN IMPORTANTE.
      //
      // Si un slot ya existe y pertenece a esta
      // misma reserva, lo dejamos tal cual.
      //
      // No intentamos transaction.set() sobre él,
      // porque Firestore lo consideraría UPDATE
      // y nuestras reglas no permiten updates de
      // agendaSlots.
      // ==================================================

      documentosNuevos.forEach(
        (item, indice) => {

          if (
            !item.snap.exists()
          ) {

            const minuto =
              nuevoInicio
              +
              indice
              *
              INTERVALO;


            transaction.set(
              item.ref,
              {

                fecha:
                nuevaFecha,

                estilistaId:
                ESTILISTA_ID,

                minuto:
                minuto,

                reservaId:
                reserva.id

              }
            );

          }

        }
      );

    }
  );

}


// ==================================================
// OBTENER BLOQUEOS
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
// CHOQUE CON BLOQUEO
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
// ESTADO VISUAL
// ==================================================

function obtenerEstadoVisual(
  reserva
) {

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
          "Cancelada por clienta",

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
// RESERVA CANCELADA
// ==================================================

function esReservaCancelada(
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
// CREAR BOTÓN
// ==================================================

function crearBoton(
  texto,
  clase
) {

  const boton =
    document.createElement(
      "button"
    );


  boton.type =
    "button";


  boton.textContent =
    texto;


  boton.classList.add(
    clase
  );


  return boton;

}


// ==================================================
// MENÚ
// ==================================================

document
  .querySelectorAll(
    ".admin-menu-btn"
  )
  .forEach(
    (boton) => {

      boton.addEventListener(
        "click",
        () => {

          cambiarSeccion(
            boton.dataset.seccion
          );

        }
      );

    }
  );


function cambiarSeccion(
  nombre
) {

  document
    .querySelectorAll(
      ".admin-seccion"
    )
    .forEach(
      (seccion) => {

        seccion.classList.add(
          "oculto"
        );

      }
    );


  document
    .querySelectorAll(
      ".admin-menu-btn"
    )
    .forEach(
      (boton) => {

        boton.classList.remove(
          "activo"
        );

      }
    );


  const mapa = {

    solicitudes:
      "seccionSolicitudes",

    agenda:
      "seccionAgenda",

    calendario:
      "seccionCalendario",

    bloqueos:
      "seccionBloqueos",

    servicios:
      "seccionServicios",

    clientes:
      "seccionClientes"

  };


  const seccion =
    document.getElementById(
      mapa[nombre]
    );


  const boton =
    document.querySelector(
      `[data-seccion="${nombre}"]`
    );


  if (seccion) {

    seccion.classList.remove(
      "oculto"
    );

  }


  if (boton) {

    boton.classList.add(
      "activo"
    );

  }

}


// ==================================================
// BLOQUES DE 30 MINUTOS
// ==================================================

function obtenerBloques(
  inicio,
  duracion
) {

  const bloques =
    [];


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


// ==================================================
// FECHA DE HOY
// ==================================================

function obtenerFechaHoy() {

  return fechaAString(
    new Date()
  );

}


// ==================================================
// DATE → YYYY-MM-DD
// ==================================================

function fechaAString(
  fecha
) {

  return [

    fecha.getFullYear(),

    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    )

  ].join("-");

}


// ==================================================
// STRING → DATE LOCAL
// ==================================================

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


  // 0 Domingo
  // 1 Lunes

  return (
    dia !== 0
    &&
    dia !== 1
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
// HORA YA PASÓ
// ==================================================

function horaYaPaso(
  fechaTexto,
  inicioMinutos
) {

  const ahora =
    new Date();


  const fecha =
    crearFechaLocal(
      fechaTexto
    );


  const esHoy =

    fecha.getFullYear()
    ===
    ahora.getFullYear()

    &&

    fecha.getMonth()
    ===
    ahora.getMonth()

    &&

    fecha.getDate()
    ===
    ahora.getDate();


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
    inicioMinutos
    <=
    minutosActuales
  );

}


// ==================================================
// ORDENAR RESERVAS
// ==================================================

function ordenarReservas(
  a,
  b
) {

  if (
    a.fecha !== b.fecha
  ) {

    return String(
      a.fecha
    ).localeCompare(
      String(
        b.fecha
      )
    );

  }


  return (

    Number(
      a.inicioMinutos || 0
    )

    -

    Number(
      b.inicioMinutos || 0
    )

  );

}


// ==================================================
// MINUTOS → HH:MM
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

  minutos =
    Number(
      minutos
    );


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
// ESCAPAR HTML
// ==================================================

function escaparHTML(
  valor
) {

  return String(
    valor ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}

// ==================================================
// ABRIR NOTIFICACIÓN DE CANCELACIÓN
// ==================================================

function abrirNotificacionCancelacion() {

  if (
    !notificacionCancelacion
  ) {

    return;

  }


  const {
    reserva,
    cliente,
    motivo
  } = notificacionCancelacion;


  resumenNotificacionCancelacion
    .replaceChildren();


  resumenNotificacionCancelacion.append(

    crearDatoNotificacion(
      "Clienta",
      cliente?.nombreCompleto
      ||
      "Cliente"
    ),

    crearDatoNotificacion(
      "Servicio",
      reserva.servicioNombre
      ||
      "Servicio"
    ),

    crearDatoNotificacion(
      "Fecha",
      formatearFecha(
        reserva.fecha
      )
    ),

    crearDatoNotificacion(
      "Horario",
      `${reserva.horaInicio} - ${reserva.horaFin}`
    ),

    crearDatoNotificacion(
      "Teléfono",
      cliente?.telefono
      ||
      "Sin teléfono"
    )

  );


  // ==================================================
  // MOTIVO
  // ==================================================

  const motivoContenedor =
    crearDatoNotificacion(
      "Motivo de cancelación",
      motivo
    );


  motivoContenedor.classList.add(
    "notificacion-whatsapp-motivo"
  );


  resumenNotificacionCancelacion
    .appendChild(
      motivoContenedor
    );


  // ==================================================
  // COMPROBAR TELÉFONO
  // ==================================================

  const telefonoValido =
    normalizarTelefonoWhatsApp(
      cliente?.telefono
    );


  btnNotificarCancelacionWhatsApp.disabled =
    !telefonoValido;


  btnNotificarCancelacionWhatsApp.textContent =
    telefonoValido

      ? "Notificar por WhatsApp"

      : "Clienta sin WhatsApp válido";


  modalNotificacionCancelacion
    .classList.remove(
    "oculto"
  );

}

// ==================================================
// DATO MODAL NOTIFICACIÓN
// ==================================================

function crearDatoNotificacion(
  etiqueta,
  valor
) {

  const contenedor =
    document.createElement(
      "div"
    );


  contenedor.classList.add(
    "notificacion-whatsapp-dato"
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
// WHATSAPP DE CANCELACIÓN
// ==================================================

function abrirWhatsAppCancelacion(
  cliente,
  reserva,
  motivo
) {

  const telefono =
    normalizarTelefonoWhatsApp(
      cliente?.telefono
    );


  if (!telefono) {

    alert(
      "La clienta no tiene un teléfono válido registrado."
    );


    return;

  }


  const primerNombre =
    cliente.nombreCompleto
      ?.trim()
      .split(/\s+/)[0]
    ||
    "Hola";


  const mensaje =
    `Hola ${primerNombre} 👋 Soy Javii de Bonsai.\n\n`
    +
    `Te escribo para informarte que tuvimos que cancelar tu reserva de ${reserva.servicioNombre}, agendada para el ${formatearFecha(reserva.fecha)} de ${reserva.horaInicio} a ${reserva.horaFin}.\n\n`
    +
    `Motivo: ${motivo}\n\n`
    +
    `Puedes solicitar una nueva hora desde Bonsai. 🌿\n\n`
    +
    `Disculpa las molestias.`;


  const enlace =
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;


  window.open(
    enlace,
    "_blank",
    "noopener,noreferrer"
  );

}

// ==================================================
// BOTÓN NOTIFICAR WHATSAPP
// ==================================================

btnNotificarCancelacionWhatsApp
  .addEventListener(
    "click",
    () => {

      if (
        !notificacionCancelacion
      ) {

        return;

      }


      abrirWhatsAppCancelacion(

        notificacionCancelacion
          .cliente,

        notificacionCancelacion
          .reserva,

        notificacionCancelacion
          .motivo

      );

    }
  );

// ==================================================
// CERRAR NOTIFICACIÓN CANCELACIÓN
// ==================================================

function cerrarNotificacionCancelacion() {

  modalNotificacionCancelacion
    .classList.add(
    "oculto"
  );


  notificacionCancelacion =
    null;

}


cerrarModalNotificacionCancelacion
  .addEventListener(
    "click",
    cerrarNotificacionCancelacion
  );


btnCerrarNotificacionCancelacion
  .addEventListener(
    "click",
    cerrarNotificacionCancelacion
  );

modalNotificacionCancelacion
  .addEventListener(
    "click",
    (evento) => {

      if (
        evento.target
        === modalNotificacionCancelacion
      ) {

        cerrarNotificacionCancelacion();

      }

    }
  );


// ==================================================
// CERRAR MODALES
// ==================================================

function cerrarModales() {

  modalCancelar.classList.add(
    "oculto"
  );


  modalCambio.classList.add(
    "oculto"
  );


  modalReagendar.classList.add(
    "oculto"
  );


  reservaSeleccionada =
    null;


  clienteSeleccionado =
    null;


  horaReagendarSeleccionada =
    null;

}


// ==================================================
// BOTONES MODALES
// ==================================================

cerrarModalCancelar.addEventListener(
  "click",
  cerrarModales
);


volverCancelar.addEventListener(
  "click",
  cerrarModales
);


cerrarModalCambio.addEventListener(
  "click",
  cerrarModales
);


cerrarModalReagendar.addEventListener(
  "click",
  cerrarModales
);


volverReagendar.addEventListener(
  "click",
  cerrarModales
);


// ==================================================
// FECHA AGENDA
// ==================================================

fechaAdmin.addEventListener(
  "change",
  cargarAgenda
);


// ==================================================
// HOY
// ==================================================

btnHoy.addEventListener(
  "click",
  async () => {

    fechaAdmin.value =
      obtenerFechaHoy();


    await cargarAgenda();

  }
);


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
