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


// ==========================================
// ELEMENTOS HTML
// ==========================================

const estadoCarga =
  document.getElementById("estadoCarga");

const proximasReservas =
  document.getElementById("proximasReservas");

const historialReservas =
  document.getElementById("historialReservas");

const seccionProximas =
  document.getElementById("seccionProximas");

const seccionHistorial =
  document.getElementById("seccionHistorial");

const saludoReservas =
  document.getElementById("saludoReservas");

const btnCerrarSesion =
  document.getElementById("btnCerrarSesion");


let usuarioActual = null;


// ==========================================
// COMPROBAR SESIÓN
// ==========================================

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (!usuario) {

      alert(
        "Debes iniciar sesión para ver tus reservas."
      );

      window.location.href =
        "login.html";

      return;
    }


    usuarioActual = usuario;


    // ==========================================
    // OBTENER DATOS DEL CLIENTE
    // ==========================================

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
          "Datos del usuario:",
          datos
        );


        saludoReservas.textContent =
          `Hola, ${datos.nombre}. Consulta y administra tus horas en Bonsai.`;


      } else {

        console.log(
          "No existe el documento del usuario en Firestore."
        );


        saludoReservas.textContent =
          "Consulta y administra tus horas en Bonsai.";

      }


    } catch (error) {

      console.error(
        "Error obteniendo usuario:",
        error
      );


      saludoReservas.textContent =
        "Consulta y administra tus horas en Bonsai.";

    }


    // ==========================================
    // CARGAR RESERVAS
    // ==========================================

    await cargarReservas();

  }
);


// ==========================================
// CARGAR RESERVAS
// ==========================================

async function cargarReservas() {

  estadoCarga.classList.remove(
    "oculto"
  );


  estadoCarga.textContent =
    "Cargando tus reservas...";


  proximasReservas.innerHTML = "";

  historialReservas.innerHTML = "";


  try {

    const consulta =
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
      );


    const resultado =
      await getDocs(
        consulta
      );


    const reservas = [];


    resultado.forEach(
      (documento) => {

        reservas.push({

          id: documento.id,

          ...documento.data()

        });

      }
    );


    // Ordenar por fecha y hora

    reservas.sort(
      (a, b) => {

        const fechaA =
          crearFechaReserva(a);

        const fechaB =
          crearFechaReserva(b);


        return fechaA - fechaB;

      }
    );


    const futuras = [];

    const historial = [];


    reservas.forEach(
      (reserva) => {

        if (
          reserva.estado === "confirmada"
          &&
          esReservaFutura(reserva)
        ) {

          futuras.push(reserva);

        } else {

          historial.push(reserva);

        }

      }
    );


    estadoCarga.classList.add(
      "oculto"
    );


    mostrarProximas(
      futuras
    );


    mostrarHistorial(
      historial
    );


  } catch (error) {

    console.error(
      "Error cargando reservas:",
      error
    );


    estadoCarga.textContent =
      "No fue posible cargar tus reservas.";

  }

}


// ==========================================
// MOSTRAR PRÓXIMAS
// ==========================================

function mostrarProximas(
  reservas
) {

  proximasReservas.innerHTML = "";


  if (reservas.length === 0) {

    proximasReservas.innerHTML = `
            <div class="sin-reservas">

                <p>
                    No tienes próximas reservas.
                </p>

                <a
                    href="agenda.html"
                    class="btn-principal"
                >
                    Agendar una hora
                </a>

            </div>
        `;

    return;

  }


  reservas.forEach(
    (reserva) => {

      proximasReservas.appendChild(
        crearTarjetaReserva(
          reserva,
          true
        )
      );

    }
  );

}


// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

function mostrarHistorial(
  reservas
) {

  historialReservas.innerHTML = "";


  if (reservas.length === 0) {

    historialReservas.innerHTML = `
            <div class="sin-reservas">

                <p>
                    Aún no tienes reservas anteriores.
                </p>

            </div>
        `;

    return;

  }


  // Más recientes primero

  reservas.reverse();


  reservas.forEach(
    (reserva) => {

      historialReservas.appendChild(
        crearTarjetaReserva(
          reserva,
          false
        )
      );

    }
  );

}


// ==========================================
// CREAR TARJETA
// ==========================================

function crearTarjetaReserva(
  reserva,
  permitirCancelar
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "reserva-card"
  );


  // Fecha bonita

  const fecha =
    crearFechaLocal(
      reserva.fecha
    );


  const fechaTexto =
    fecha.toLocaleDateString(
      "es-CL",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );


  // Precio

  const precioFormateado =
    new Intl.NumberFormat(
      "es-CL",
      {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
      }
    ).format(
      reserva.precio
    );


  const precioTexto =
    reserva.precioDesde
      ? `Desde ${precioFormateado}`
      : precioFormateado;


  // Estado visual

  let estadoTexto =
    "Confirmada";


  let claseEstado =
    "estado-confirmada";


  if (
    reserva.estado === "cancelada"
  ) {

    estadoTexto =
      "Cancelada";

    claseEstado =
      "estado-cancelada";

  } else if (
    !esReservaFutura(reserva)
  ) {

    estadoTexto =
      "Finalizada";

    claseEstado =
      "estado-finalizada";

  }


  tarjeta.innerHTML = `

        <div class="reserva-card-header">

            <div>

                <span class="reserva-fecha">
                    ${capitalizar(fechaTexto)}
                </span>

                <h3>
                    ${reserva.servicioNombre}
                </h3>

            </div>


            <span class="estado-reserva ${claseEstado}">
                ${estadoTexto}
            </span>

        </div>


        <div class="reserva-datos">

            <div>

                <span>Estilista</span>

                <strong>
                    ${reserva.estilistaNombre}
                </strong>

            </div>


            <div>

                <span>Horario</span>

                <strong>
                    ${reserva.horaInicio}
                    -
                    ${reserva.horaFin}
                </strong>

            </div>


            <div>

                <span>Duración</span>

                <strong>
                    ${formatearDuracion(
    reserva.duracionMinutos
  )}
                </strong>

            </div>


            <div>

                <span>Valor</span>

                <strong>
                    ${precioTexto}
                </strong>

            </div>

        </div>

    `;


  // ======================================
  // BOTÓN CANCELAR
  // ======================================

  if (
    permitirCancelar
    &&
    reserva.estado === "confirmada"
  ) {

    const acciones =
      document.createElement(
        "div"
      );


    acciones.classList.add(
      "reserva-acciones"
    );


    const botonCancelar =
      document.createElement(
        "button"
      );


    botonCancelar.type =
      "button";


    botonCancelar.classList.add(
      "btn-cancelar-reserva"
    );


    botonCancelar.textContent =
      "Cancelar reserva";


    botonCancelar.addEventListener(
      "click",
      async () => {

        const confirmar =
          confirm(
            `¿Seguro que deseas cancelar tu reserva de ${reserva.servicioNombre}?`
          );


        if (!confirmar) {

          return;

        }


        botonCancelar.disabled =
          true;


        botonCancelar.textContent =
          "Cancelando...";


        try {

          await cancelarReserva(
            reserva
          );


          alert(
            "Tu reserva fue cancelada correctamente."
          );


          await cargarReservas();


        } catch (error) {

          console.error(
            "Error cancelando reserva:",
            error
          );


          alert(
            "No fue posible cancelar la reserva."
          );


          botonCancelar.disabled =
            false;


          botonCancelar.textContent =
            "Cancelar reserva";

        }

      }
    );


    acciones.appendChild(
      botonCancelar
    );


    tarjeta.appendChild(
      acciones
    );

  }


  return tarjeta;

}


// ==========================================
// CANCELAR RESERVA
// ==========================================

async function cancelarReserva(
  reserva
) {

  const reservaRef =
    doc(
      db,
      "reservas",
      reserva.id
    );


  // ======================================
  // OBTENER BLOQUES DE LA RESERVA
  // ======================================

  const slotRefs = [];


  for (
    let minuto =
      reserva.inicioMinutos;

    minuto <
    reserva.finMinutos;

    minuto += 30
  ) {

    const idSlot =
      `${reserva.fecha}_${reserva.estilistaId}_${minuto}`;


    slotRefs.push(
      doc(
        db,
        "agendaSlots",
        idSlot
      )
    );

  }


  // ======================================
  // TRANSACCIÓN
  // ======================================

  await runTransaction(
    db,
    async (transaction) => {

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


      // Seguridad adicional

      if (
        datos.usuarioId
        !== usuarioActual.uid
      ) {

        throw new Error(
          "sin-permiso"
        );

      }


      if (
        datos.estado
        !== "confirmada"
      ) {

        throw new Error(
          "reserva-ya-cancelada"
        );

      }


      // ==================================
      // LEER TODOS LOS BLOQUES
      // ==================================

      const slotsDocumentos = [];


      for (
        const slotRef
        of slotRefs
        ) {

        const slotDoc =
          await transaction.get(
            slotRef
          );


        slotsDocumentos.push(
          {
            ref: slotRef,
            doc: slotDoc
          }
        );

      }


      // ==================================
      // CAMBIAR ESTADO
      // ==================================

      transaction.update(
        reservaRef,
        {

          estado:
            "cancelada",

          fechaCancelacion:
            serverTimestamp()

        }
      );


      // ==================================
      // LIBERAR HORAS
      // ==================================

      slotsDocumentos.forEach(
        (slot) => {

          if (
            slot.doc.exists()
            &&
            slot.doc.data().reservaId
            === reserva.id
          ) {

            transaction.delete(
              slot.ref
            );

          }

        }
      );

    }
  );

}


// ==========================================
// COMPROBAR SI ES FUTURA
// ==========================================

function esReservaFutura(
  reserva
) {

  const fechaReserva =
    crearFechaReserva(
      reserva
    );


  return (
    fechaReserva >
    new Date()
  );

}


// ==========================================
// CREAR FECHA CON HORA
// ==========================================

function crearFechaReserva(
  reserva
) {

  const partesFecha =
    reserva.fecha.split("-");


  const partesHora =
    reserva.horaInicio.split(":");


  return new Date(

    Number(
      partesFecha[0]
    ),

    Number(
      partesFecha[1]
    ) - 1,

    Number(
      partesFecha[2]
    ),

    Number(
      partesHora[0]
    ),

    Number(
      partesHora[1]
    )

  );

}


// ==========================================
// CREAR FECHA LOCAL
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
// DURACIÓN
// ==========================================

function formatearDuracion(
  minutos
) {

  const horas =
    Math.floor(
      minutos / 60
    );


  const minutosRestantes =
    minutos % 60;


  if (
    minutosRestantes === 0
  ) {

    return (
      horas === 1
        ? "1 hora"
        : `${horas} horas`
    );

  }


  return (
    `${horas} h ${minutosRestantes} min`
  );

}


// ==========================================
// CAPITALIZAR TEXTO
// ==========================================

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
