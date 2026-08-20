// ==================================================
// BONSAI
// CALENDARIO ADMINISTRATIVO
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
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// CONFIGURACIÓN
// ==================================================

const ESTILISTA_ID =
  "javiera";


// ==================================================
// VARIABLES
// ==================================================

let mesActual =
  new Date();


// Siempre trabajaremos con el día 1
mesActual.setDate(
  1
);


// ==================================================
// ELEMENTOS
// ==================================================

const calendarioGrid =
  document.getElementById(
    "calendarioGrid"
  );


const tituloMesCalendario =
  document.getElementById(
    "tituloMesCalendario"
  );


const calendarioAnterior =
  document.getElementById(
    "calendarioAnterior"
  );


const calendarioSiguiente =
  document.getElementById(
    "calendarioSiguiente"
  );


const calendarioHoy =
  document.getElementById(
    "calendarioHoy"
  );


const cargandoCalendario =
  document.getElementById(
    "cargandoCalendario"
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


      await cargarCalendario();


    } catch (error) {

      console.error(
        "Error iniciando calendario:",
        error
      );

    }

  }
);


// ==================================================
// MES ANTERIOR
// ==================================================

calendarioAnterior.addEventListener(
  "click",
  async () => {

    mesActual.setMonth(
      mesActual.getMonth() - 1
    );


    mesActual.setDate(
      1
    );


    await cargarCalendario();

  }
);


// ==================================================
// MES SIGUIENTE
// ==================================================

calendarioSiguiente.addEventListener(
  "click",
  async () => {

    mesActual.setMonth(
      mesActual.getMonth() + 1
    );


    mesActual.setDate(
      1
    );


    await cargarCalendario();

  }
);


// ==================================================
// VOLVER A HOY
// ==================================================

calendarioHoy.addEventListener(
  "click",
  async () => {

    mesActual =
      new Date();


    mesActual.setDate(
      1
    );


    await cargarCalendario();

  }
);


// ==================================================
// CARGAR CALENDARIO
// ==================================================

async function cargarCalendario() {

  calendarioGrid.innerHTML =
    "";


  cargandoCalendario.classList.remove(
    "oculto"
  );


  cargandoCalendario.textContent =
    "Cargando calendario...";


  mostrarTituloMes();


  try {

    const anio =
      mesActual.getFullYear();


    const mes =
      mesActual.getMonth();


    const fechaInicio =
      fechaAString(
        new Date(
          anio,
          mes,
          1
        )
      );


    const fechaFin =
      fechaAString(
        new Date(
          anio,
          mes + 1,
          0
        )
      );


    // ==========================================
    // RESERVAS Y BLOQUEOS DEL MES
    // ==========================================

    const [
      reservas,
      bloqueos
    ] = await Promise.all([

      obtenerReservasMes(
        fechaInicio,
        fechaFin
      ),

      obtenerBloqueosMes(
        fechaInicio,
        fechaFin
      )

    ]);


    // ==========================================
    // AGRUPAR INFORMACIÓN POR FECHA
    // ==========================================

    const reservasPorFecha =
      agruparReservas(
        reservas
      );


    const bloqueosPorFecha =
      agruparBloqueos(
        bloqueos
      );


    construirCalendario(
      reservasPorFecha,
      bloqueosPorFecha
    );


    cargandoCalendario.classList.add(
      "oculto"
    );


  } catch (error) {

    console.error(
      "Error cargando calendario:",
      error
    );


    cargandoCalendario.textContent =
      "No fue posible cargar el calendario.";

  }

}


// ==================================================
// OBTENER RESERVAS DEL MES
// ==================================================

async function obtenerReservasMes(
  fechaInicio,
  fechaFin
) {

  const resultado =
    await getDocs(
      query(
        collection(
          db,
          "reservas"
        ),
        where(
          "fecha",
          ">=",
          fechaInicio
        ),
        where(
          "fecha",
          "<=",
          fechaFin
        )
      )
    );


  const reservas =
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


      reservas.push({

        id:
        documento.id,

        ...datos

      });

    }
  );


  return reservas;

}


// ==================================================
// OBTENER BLOQUEOS DEL MES
// ==================================================

async function obtenerBloqueosMes(
  fechaInicio,
  fechaFin
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
          ">=",
          fechaInicio
        ),
        where(
          "fecha",
          "<=",
          fechaFin
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
        !== ESTILISTA_ID
      ) {

        return;

      }


      bloqueos.push({

        id:
        documento.id,

        ...datos

      });

    }
  );


  return bloqueos;

}


// ==================================================
// AGRUPAR RESERVAS
// ==================================================

function agruparReservas(
  reservas
) {

  const resultado =
    new Map();


  reservas.forEach(
    (reserva) => {

      // Las reservas canceladas no cuentan
      // como trabajo activo del día.

      if (
        reserva.estado
        === "cancelada_admin"

        ||

        reserva.estado
        === "cancelada_cliente"
      ) {

        return;

      }


      if (
        !resultado.has(
          reserva.fecha
        )
      ) {

        resultado.set(
          reserva.fecha,
          []
        );

      }


      resultado
        .get(
          reserva.fecha
        )
        .push(
          reserva
        );

    }
  );


  return resultado;

}


// ==================================================
// AGRUPAR BLOQUEOS
// ==================================================

function agruparBloqueos(
  bloqueos
) {

  const resultado =
    new Map();


  bloqueos.forEach(
    (bloqueo) => {

      if (
        !resultado.has(
          bloqueo.fecha
        )
      ) {

        resultado.set(
          bloqueo.fecha,
          []
        );

      }


      resultado
        .get(
          bloqueo.fecha
        )
        .push(
          bloqueo
        );

    }
  );


  return resultado;

}


// ==================================================
// CONSTRUIR CALENDARIO
// ==================================================

function construirCalendario(
  reservasPorFecha,
  bloqueosPorFecha
) {

  calendarioGrid.innerHTML =
    "";


  const anio =
    mesActual.getFullYear();


  const mes =
    mesActual.getMonth();


  const primerDia =
    new Date(
      anio,
      mes,
      1
    );


  const ultimoDia =
    new Date(
      anio,
      mes + 1,
      0
    );


  const totalDias =
    ultimoDia.getDate();


  // JavaScript:
  // Domingo = 0
  // Lunes = 1
  //
  // Nuestro calendario comienza el lunes.

  const diaSemanaPrimerDia =
    primerDia.getDay();


  const espaciosAntes =
    diaSemanaPrimerDia === 0
      ? 6
      : diaSemanaPrimerDia - 1;


  // ==========================================
  // CELDAS VACÍAS ANTES DEL DÍA 1
  // ==========================================

  for (
    let i = 0;

    i < espaciosAntes;

    i++
  ) {

    const vacio =
      document.createElement(
        "div"
      );


    vacio.classList.add(
      "calendario-dia",
      "calendario-vacio"
    );


    calendarioGrid.appendChild(
      vacio
    );

  }


  // ==========================================
  // DÍAS DEL MES
  // ==========================================

  for (
    let dia = 1;

    dia <= totalDias;

    dia++
  ) {

    const fecha =
      new Date(
        anio,
        mes,
        dia
      );


    const fechaTexto =
      fechaAString(
        fecha
      );


    const reservas =
      reservasPorFecha.get(
        fechaTexto
      )
      || [];


    const bloqueos =
      bloqueosPorFecha.get(
        fechaTexto
      )
      || [];


    crearDiaCalendario(
      fecha,
      fechaTexto,
      reservas,
      bloqueos
    );

  }

}


// ==================================================
// CREAR DÍA
// ==================================================

function crearDiaCalendario(
  fecha,
  fechaTexto,
  reservas,
  bloqueos
) {

  const celda =
    document.createElement(
      "button"
    );


  celda.type =
    "button";


  celda.classList.add(
    "calendario-dia"
  );


  // ==========================================
  // NÚMERO DEL DÍA
  // ==========================================

  const numero =
    document.createElement(
      "span"
    );


  numero.classList.add(
    "calendario-numero"
  );


  numero.textContent =
    fecha.getDate();


  celda.appendChild(
    numero
  );


  // ==========================================
  // HOY
  // ==========================================

  if (
    fechaTexto
    === obtenerFechaHoy()
  ) {

    celda.classList.add(
      "calendario-dia-hoy"
    );

  }


  // ==========================================
  // DOMINGO / LUNES
  // ==========================================

  const diaSemana =
    fecha.getDay();


  if (
    diaSemana === 0
    ||
    diaSemana === 1
  ) {

    celda.classList.add(
      "calendario-cerrado"
    );


    const cerrado =
      document.createElement(
        "span"
      );


    cerrado.classList.add(
      "calendario-etiqueta-cerrado"
    );


    cerrado.textContent =
      "Cerrado";


    celda.appendChild(
      cerrado
    );

  }


  // ==========================================
  // RESERVAS
  // ==========================================

  if (
    reservas.length > 0
  ) {

    const indicador =
      document.createElement(
        "span"
      );


    indicador.classList.add(
      "calendario-indicador",
      "calendario-indicador-reservas"
    );


    indicador.textContent =
      reservas.length === 1

        ? "1 reserva"

        : `${reservas.length} reservas`;


    celda.appendChild(
      indicador
    );


    celda.classList.add(
      "calendario-con-reservas"
    );

  }


  // ==========================================
  // BLOQUEOS
  // ==========================================

  if (
    bloqueos.length > 0
  ) {

    const diaCompleto =
      bloqueos.some(
        (bloqueo) =>
          bloqueo.diaCompleto
          === true
      );


    const indicador =
      document.createElement(
        "span"
      );


    indicador.classList.add(
      "calendario-indicador"
    );


    if (diaCompleto) {

      celda.classList.add(
        "calendario-dia-bloqueado"
      );


      indicador.classList.add(
        "calendario-indicador-completo"
      );


      indicador.textContent =
        "Día bloqueado";

    } else {

      celda.classList.add(
        "calendario-con-bloqueo"
      );


      indicador.classList.add(
        "calendario-indicador-bloqueo"
      );


      indicador.textContent =
        bloqueos.length === 1

          ? "1 bloqueo"

          : `${bloqueos.length} bloqueos`;

    }


    celda.appendChild(
      indicador
    );

  }


  // ==========================================
  // ABRIR AGENDA DEL DÍA
  // ==========================================

  celda.addEventListener(
    "click",
    () => {

      abrirAgendaFecha(
        fechaTexto
      );

    }
  );


  calendarioGrid.appendChild(
    celda
  );

}


// ==================================================
// ABRIR AGENDA DEL DÍA
// ==================================================

function abrirAgendaFecha(
  fecha
) {

  const fechaAdmin =
    document.getElementById(
      "fechaAdmin"
    );


  if (fechaAdmin) {

    fechaAdmin.value =
      fecha;


    // Ejecutamos el listener que ya tiene
    // admin.js para cargar la agenda.

    fechaAdmin.dispatchEvent(
      new Event(
        "change",
        {
          bubbles:
            true
        }
      )
    );

  }


  const botonAgenda =
    document.querySelector(
      '[data-seccion="agenda"]'
    );


  if (botonAgenda) {

    botonAgenda.click();

  }

}


// ==================================================
// TÍTULO MES
// ==================================================

function mostrarTituloMes() {

  const texto =
    mesActual.toLocaleDateString(
      "es-CL",
      {

        month:
          "long",

        year:
          "numeric"

      }
    );


  tituloMesCalendario.textContent =
    capitalizarPrimeraLetra(
      texto
    );

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
// CAPITALIZAR
// ==================================================

function capitalizarPrimeraLetra(
  texto
) {

  if (!texto) {

    return "";
  }


  return (
    texto.charAt(0)
      .toUpperCase()

    +

    texto.slice(1)
  );

}
