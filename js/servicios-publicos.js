// ==================================================
// BONSAI
// SERVICIOS PÚBLICOS
// ==================================================

import {
  db
} from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// ELEMENTOS
// ==================================================

const listaServiciosPublicos =
  document.getElementById(
    "listaServiciosPublicos"
  );


const cargandoServiciosPublicos =
  document.getElementById(
    "cargandoServiciosPublicos"
  );


// ==================================================
// INICIAR
// ==================================================

cargarServiciosPublicos();


// ==================================================
// CARGAR FIRESTORE
// ==================================================

async function cargarServiciosPublicos() {

  if (
    !listaServiciosPublicos
    ||
    !cargandoServiciosPublicos
  ) {

    return;

  }


  listaServiciosPublicos.replaceChildren();


  cargandoServiciosPublicos.classList.remove(
    "oculto"
  );


  cargandoServiciosPublicos.textContent =
    "Cargando servicios...";


  try {

    const resultado =
      await getDocs(
        collection(
          db,
          "servicios"
        )
      );


    const servicios =
      [];


    resultado.forEach(
      (documento) => {

        const datos =
          documento.data();


        // Solo mostramos los servicios
        // habilitados por Javii.

        if (
          datos.activo !== true
        ) {

          return;

        }


        servicios.push({

          id:
          documento.id,

          ...datos

        });

      }
    );


    // ==========================================
    // ORDEN
    // ==========================================

    servicios.sort(
      (a, b) =>

        Number(
          a.orden || 999
        )

        -

        Number(
          b.orden || 999
        )
    );


    cargandoServiciosPublicos.classList.add(
      "oculto"
    );


    if (
      servicios.length === 0
    ) {

      mostrarSinServicios();

      return;

    }


    servicios.forEach(
      crearTarjetaServicio
    );


  } catch (error) {

    console.error(
      "Error cargando servicios públicos:",
      error
    );


    cargandoServiciosPublicos.textContent =
      "No fue posible cargar los servicios.";

  }

}


// ==================================================
// TARJETA
// ==================================================

function crearTarjetaServicio(
  servicio
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "servicio-publico-card"
  );


  // ==================================================
  // CABECERA
  // ==================================================

  const cabecera =
    document.createElement(
      "div"
    );


  cabecera.classList.add(
    "servicio-publico-cabecera"
  );


  const numero =
    document.createElement(
      "span"
    );


  numero.classList.add(
    "servicio-publico-numero"
  );


  numero.textContent =
    String(
      servicio.orden || ""
    ).padStart(
      2,
      "0"
    );


  const nombre =
    document.createElement(
      "h3"
    );


  nombre.textContent =
    servicio.nombre
    ||
    "Servicio";


  cabecera.append(
    numero,
    nombre
  );


  // ==================================================
  // INFORMACIÓN
  // ==================================================

  const informacion =
    document.createElement(
      "div"
    );


  informacion.classList.add(
    "servicio-publico-info"
  );


  const precio =
    document.createElement(
      "strong"
    );


  precio.textContent =
    formatearPrecio(
      servicio.precio,
      servicio.precioDesde
    );


  const duracion =
    document.createElement(
      "span"
    );


  duracion.textContent =
    formatearDuracion(
      servicio.duracionMinutos
    );


  informacion.append(
    precio,
    duracion
  );


  // ==================================================
  // BOTÓN
  // ==================================================

  const boton =
    document.createElement(
      "a"
    );


  boton.classList.add(
    "servicio-publico-reservar"
  );


  boton.href =
    `agenda.html?servicio=${encodeURIComponent(
      servicio.id
    )}`;


  boton.textContent =
    "Reservar";


  // ==================================================
  // ARMAR
  // ==================================================

  tarjeta.append(
    cabecera,
    informacion,
    boton
  );


  listaServiciosPublicos.appendChild(
    tarjeta
  );

}


// ==================================================
// SIN SERVICIOS
// ==================================================

function mostrarSinServicios() {

  const contenedor =
    document.createElement(
      "div"
    );


  contenedor.classList.add(
    "servicios-publicos-vacio"
  );


  const titulo =
    document.createElement(
      "h3"
    );


  titulo.textContent =
    "Servicios temporalmente no disponibles";


  const texto =
    document.createElement(
      "p"
    );


  texto.textContent =
    "Pronto volveremos a habilitar nuestras reservas.";


  contenedor.append(
    titulo,
    texto
  );


  listaServiciosPublicos.appendChild(
    contenedor
  );

}


// ==================================================
// PRECIO
// ==================================================

function formatearPrecio(
  precio,
  desde
) {

  const numero =
    Number(
      precio
    );


  if (
    !Number.isFinite(
      numero
    )
  ) {

    return "Consultar";
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
      numero
    );


  return desde
    ? `Desde ${valor}`
    : valor;

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


  if (
    !Number.isFinite(
      minutos
    )
    ||
    minutos <= 0
  ) {

    return "";
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

    return horas === 1
      ? "1 hora"
      : `${horas} horas`;

  }


  return `${horas} h ${resto} min`;

}
