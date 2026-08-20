// ==================================================
// BONSAI
// ADMINISTRACIÓN DE SERVICIOS
// ==================================================

import {
  auth,
  db
} from "./firebase-config.js";


import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================================================
// SERVICIOS INICIALES
// ==================================================

const SERVICIOS_INICIALES = {

  "corte": {

    nombre:
      "Corte",

    precio:
      40000,

    precioDesde:
      false,

    duracionMinutos:
      90,

    activo:
      true,

    orden:
      1

  },


  "corte-tratamiento": {

    nombre:
      "Corte + tratamiento",

    precio:
      75000,

    precioDesde:
      false,

    duracionMinutos:
      90,

    activo:
      true,

    orden:
      2

  },


  "tratamiento": {

    nombre:
      "Tratamiento",

    precio:
      45000,

    precioDesde:
      false,

    duracionMinutos:
      90,

    activo:
      true,

    orden:
      3

  },


  "botox": {

    nombre:
      "Botox",

    precio:
      60000,

    precioDesde:
      true,

    duracionMinutos:
      180,

    activo:
      true,

    orden:
      4

  },


  "alisado": {

    nombre:
      "Alisado",

    precio:
      80000,

    precioDesde:
      true,

    duracionMinutos:
      180,

    activo:
      true,

    orden:
      5

  },


  "color-global": {

    nombre:
      "Color global",

    precio:
      60000,

    precioDesde:
      true,

    duracionMinutos:
      180,

    activo:
      true,

    orden:
      6

  },


  "iluminaciones": {

    nombre:
      "Iluminaciones",

    precio:
      130000,

    precioDesde:
      true,

    duracionMinutos:
      300,

    activo:
      true,

    orden:
      7

  }

};


// ==================================================
// ELEMENTOS PRINCIPALES
// ==================================================

const cargandoServicios =
  document.getElementById(
    "cargandoServicios"
  );


const listaServiciosAdmin =
  document.getElementById(
    "listaServiciosAdmin"
  );


// ==================================================
// ELEMENTOS NUEVO SERVICIO
// ==================================================

const btnAgregarServicio =
  document.getElementById(
    "btnAgregarServicio"
  );


const modalNuevoServicio =
  document.getElementById(
    "modalNuevoServicio"
  );


const cerrarModalNuevoServicio =
  document.getElementById(
    "cerrarModalNuevoServicio"
  );


const cancelarNuevoServicio =
  document.getElementById(
    "cancelarNuevoServicio"
  );


const formNuevoServicio =
  document.getElementById(
    "formNuevoServicio"
  );


const nuevoServicioNombre =
  document.getElementById(
    "nuevoServicioNombre"
  );


const nuevoServicioPrecio =
  document.getElementById(
    "nuevoServicioPrecio"
  );


const nuevoServicioDuracion =
  document.getElementById(
    "nuevoServicioDuracion"
  );


const nuevoServicioDesde =
  document.getElementById(
    "nuevoServicioDesde"
  );


const nuevoServicioActivo =
  document.getElementById(
    "nuevoServicioActivo"
  );


const guardarNuevoServicio =
  document.getElementById(
    "guardarNuevoServicio"
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


      // ==========================================
      // CREAR SERVICIOS BASE SI FALTAN
      // ==========================================

      await asegurarServiciosIniciales();


      // ==========================================
      // CARGAR SERVICIOS
      // ==========================================

      await cargarServiciosAdmin();


    } catch (error) {

      console.error(
        "Error iniciando módulo de servicios:",
        error
      );


      cargandoServicios.textContent =
        "No fue posible cargar los servicios.";

    }

  }
);


// ==================================================
// DURACIONES DEL NUEVO SERVICIO
// ==================================================

function generarDuracionesNuevoServicio() {

  nuevoServicioDuracion
    .replaceChildren();


  for (
    let minutos = 30;
    minutos <= 360;
    minutos += 30
  ) {

    const opcion =
      document.createElement(
        "option"
      );


    opcion.value =
      String(
        minutos
      );


    opcion.textContent =
      formatearDuracion(
        minutos
      );


    // Por defecto 1 hora 30 min

    if (
      minutos === 90
    ) {

      opcion.selected =
        true;

    }


    nuevoServicioDuracion
      .appendChild(
        opcion
      );

  }

}


// ==================================================
// ABRIR MODAL NUEVO SERVICIO
// ==================================================

btnAgregarServicio.addEventListener(
  "click",
  () => {

    formNuevoServicio.reset();


    nuevoServicioActivo.checked =
      true;


    nuevoServicioDesde.checked =
      false;


    generarDuracionesNuevoServicio();


    modalNuevoServicio.classList.remove(
      "oculto"
    );


    nuevoServicioNombre.focus();

  }
);


// ==================================================
// CERRAR MODAL NUEVO SERVICIO
// ==================================================

function cerrarNuevoServicio() {

  modalNuevoServicio.classList.add(
    "oculto"
  );


  formNuevoServicio.reset();

}


cerrarModalNuevoServicio.addEventListener(
  "click",
  cerrarNuevoServicio
);


cancelarNuevoServicio.addEventListener(
  "click",
  cerrarNuevoServicio
);


modalNuevoServicio.addEventListener(
  "click",
  (evento) => {

    if (
      evento.target
      === modalNuevoServicio
    ) {

      cerrarNuevoServicio();

    }

  }
);


// ==================================================
// CREAR NUEVO SERVICIO
// ==================================================

formNuevoServicio.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    const nombre =
      nuevoServicioNombre
        .value
        .trim();


    const precio =
      Number(
        nuevoServicioPrecio.value
      );


    const duracion =
      Number(
        nuevoServicioDuracion.value
      );


    // ==================================================
    // VALIDAR NOMBRE
    // ==================================================

    if (
      nombre.length < 2
    ) {

      alert(
        "Ingresa un nombre válido."
      );


      nuevoServicioNombre.focus();


      return;

    }


    // ==================================================
    // VALIDAR PRECIO
    // ==================================================

    if (
      !Number.isFinite(
        precio
      )
      ||
      precio < 0
    ) {

      alert(
        "Ingresa un precio válido."
      );


      nuevoServicioPrecio.focus();


      return;

    }


    // ==================================================
    // VALIDAR DURACIÓN
    // ==================================================

    if (
      !Number.isFinite(
        duracion
      )
      ||
      duracion < 30
      ||
      duracion > 360
      ||
      duracion % 30 !== 0
    ) {

      alert(
        "Selecciona una duración válida."
      );


      return;

    }


    guardarNuevoServicio.disabled =
      true;


    guardarNuevoServicio.textContent =
      "Agregando...";


    try {

      // ==================================================
      // GENERAR ID
      // ==================================================

      const id =
        await generarIdServicio(
          nombre
        );


      // ==================================================
      // OBTENER POSICIÓN
      // ==================================================

      const orden =
        await obtenerSiguienteOrden();


      // ==================================================
      // GUARDAR EN FIRESTORE
      // ==================================================

      await setDoc(
        doc(
          db,
          "servicios",
          id
        ),
        {

          nombre:
          nombre,

          precio:
          precio,

          precioDesde:
          nuevoServicioDesde.checked,

          duracionMinutos:
          duracion,

          activo:
          nuevoServicioActivo.checked,

          orden:
          orden,

          fechaCreacion:
            serverTimestamp(),

          fechaActualizacion:
            serverTimestamp()

        }
      );


      // ==================================================
      // CERRAR MODAL
      // ==================================================

      cerrarNuevoServicio();


      // ==================================================
      // ACTUALIZAR LISTA
      // ==================================================

      await cargarServiciosAdmin();


      alert(
        "Servicio agregado correctamente."
      );


    } catch (error) {

      console.error(
        "Error agregando servicio:",
        error
      );


      alert(
        "No fue posible agregar el servicio."
      );


    } finally {

      guardarNuevoServicio.disabled =
        false;


      guardarNuevoServicio.textContent =
        "Agregar servicio";

    }

  }
);


// ==================================================
// GENERAR ID DEL SERVICIO
// ==================================================

async function generarIdServicio(
  nombre
) {

  let base =
    normalizarId(
      nombre
    );


  if (!base) {

    base =
      "servicio";

  }


  let id =
    base;


  let numero =
    2;


  // ==================================================
  // EVITAR IDs REPETIDOS
  // ==================================================

  while (true) {

    const documento =
      await getDoc(
        doc(
          db,
          "servicios",
          id
        )
      );


    if (
      !documento.exists()
    ) {

      return id;

    }


    id =
      `${base}-${numero}`;


    numero++;

  }

}


// ==================================================
// NORMALIZAR ID
// ==================================================

function normalizarId(
  texto
) {

  return String(
    texto || ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


// ==================================================
// OBTENER SIGUIENTE ORDEN
// ==================================================

async function obtenerSiguienteOrden() {

  const resultado =
    await getDocs(
      collection(
        db,
        "servicios"
      )
    );


  let mayor =
    0;


  resultado.forEach(
    (documento) => {

      const orden =
        Number(
          documento.data().orden
          ||
          0
        );


      if (
        orden > mayor
      ) {

        mayor =
          orden;

      }

    }
  );


  return mayor + 1;

}


// ==================================================
// ASEGURAR SERVICIOS INICIALES
// ==================================================

async function asegurarServiciosIniciales() {

  const batch =
    writeBatch(
      db
    );


  let hayCambios =
    false;


  for (
    const [
      id,
      servicio
    ]
    of Object.entries(
    SERVICIOS_INICIALES
  )
    ) {

    const referencia =
      doc(
        db,
        "servicios",
        id
      );


    const documento =
      await getDoc(
        referencia
      );


    // ==========================================
    // SOLO CREAR SI NO EXISTE
    // ==========================================

    if (
      !documento.exists()
    ) {

      batch.set(
        referencia,
        {

          ...servicio,

          fechaCreacion:
            serverTimestamp(),

          fechaActualizacion:
            serverTimestamp()

        }
      );


      hayCambios =
        true;

    }

  }


  if (
    hayCambios
  ) {

    await batch.commit();

  }

}


// ==================================================
// CARGAR SERVICIOS
// ==================================================

async function cargarServiciosAdmin() {

  listaServiciosAdmin.replaceChildren();


  cargandoServicios.classList.remove(
    "oculto"
  );


  cargandoServicios.textContent =
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

        servicios.push({

          id:
          documento.id,

          ...documento.data()

        });

      }
    );


    // ==================================================
    // ORDENAR SERVICIOS
    // ==================================================

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


    cargandoServicios.classList.add(
      "oculto"
    );


    // ==================================================
    // SIN SERVICIOS
    // ==================================================

    if (
      servicios.length === 0
    ) {

      const mensaje =
        document.createElement(
          "div"
        );


      mensaje.classList.add(
        "admin-sin-reservas"
      );


      const titulo =
        document.createElement(
          "h3"
        );


      titulo.textContent =
        "No existen servicios";


      mensaje.appendChild(
        titulo
      );


      listaServiciosAdmin.appendChild(
        mensaje
      );


      return;

    }


    // ==================================================
    // MOSTRAR SERVICIOS
    // ==================================================

    servicios.forEach(
      crearTarjetaServicio
    );


  } catch (error) {

    console.error(
      "Error cargando servicios:",
      error
    );


    cargandoServicios.textContent =
      "No fue posible cargar los servicios.";

  }

}


// ==================================================
// CREAR TARJETA DE SERVICIO
// ==================================================

function crearTarjetaServicio(
  servicio
) {

  const tarjeta =
    document.createElement(
      "article"
    );


  tarjeta.classList.add(
    "admin-servicio-card"
  );


  // ==================================================
  // CABECERA
  // ==================================================

  const cabecera =
    document.createElement(
      "div"
    );


  cabecera.classList.add(
    "admin-servicio-cabecera"
  );


  const titulo =
    document.createElement(
      "h3"
    );


  titulo.textContent =
    servicio.nombre
    ||
    "Servicio";


  // ==================================================
  // ESTADO
  // ==================================================

  const estado =
    document.createElement(
      "span"
    );


  estado.classList.add(

    servicio.activo !== false

      ? "servicio-estado-activo"

      : "servicio-estado-inactivo"

  );


  estado.textContent =

    servicio.activo !== false

      ? "Activo"

      : "Inactivo";


  cabecera.append(
    titulo,
    estado
  );


  // ==================================================
  // NOMBRE
  // ==================================================

  const campoNombre =
    crearCampoTexto(
      "Nombre",
      servicio.nombre
    );


  // ==================================================
  // PRECIO
  // ==================================================

  const campoPrecio =
    crearCampoNumero(
      "Precio",
      servicio.precio
    );


  // ==================================================
  // DURACIÓN
  // ==================================================

  const grupoDuracion =
    document.createElement(
      "div"
    );


  grupoDuracion.classList.add(
    "campo-formulario"
  );


  const labelDuracion =
    document.createElement(
      "label"
    );


  labelDuracion.textContent =
    "Duración";


  const selectDuracion =
    document.createElement(
      "select"
    );


  selectDuracion.classList.add(
    "servicio-select"
  );


  for (
    let minutos = 30;
    minutos <= 360;
    minutos += 30
  ) {

    const opcion =
      document.createElement(
        "option"
      );


    opcion.value =
      String(
        minutos
      );


    opcion.textContent =
      formatearDuracion(
        minutos
      );


    if (
      Number(
        servicio.duracionMinutos
      )
      === minutos
    ) {

      opcion.selected =
        true;

    }


    selectDuracion.appendChild(
      opcion
    );

  }


  grupoDuracion.append(
    labelDuracion,
    selectDuracion
  );


  // ==================================================
  // PRECIO "DESDE"
  // ==================================================

  const desdeLabel =
    document.createElement(
      "label"
    );


  desdeLabel.classList.add(
    "servicio-check"
  );


  const desdeCheckbox =
    document.createElement(
      "input"
    );


  desdeCheckbox.type =
    "checkbox";


  desdeCheckbox.checked =
    servicio.precioDesde
    === true;


  const desdeTexto =
    document.createElement(
      "span"
    );


  desdeTexto.textContent =
    'Mostrar precio como "Desde"';


  desdeLabel.append(
    desdeCheckbox,
    desdeTexto
  );


  // ==================================================
  // SERVICIO ACTIVO
  // ==================================================

  const activoLabel =
    document.createElement(
      "label"
    );


  activoLabel.classList.add(
    "servicio-check",
    "servicio-check-activo"
  );


  const activoCheckbox =
    document.createElement(
      "input"
    );


  activoCheckbox.type =
    "checkbox";


  activoCheckbox.checked =
    servicio.activo !== false;


  const activoTexto =
    document.createElement(
      "span"
    );


  activoTexto.textContent =
    "Servicio disponible para reservas";


  activoLabel.append(
    activoCheckbox,
    activoTexto
  );


  // ==================================================
  // BOTÓN GUARDAR
  // ==================================================

  const btnGuardar =
    document.createElement(
      "button"
    );


  btnGuardar.type =
    "button";


  btnGuardar.classList.add(
    "btn-guardar-servicio"
  );


  btnGuardar.textContent =
    "Guardar cambios";


  // ==================================================
  // GUARDAR CAMBIOS
  // ==================================================

  btnGuardar.addEventListener(
    "click",
    async () => {

      const nombre =
        campoNombre.input
          .value
          .trim();


      const precio =
        Number(
          campoPrecio.input.value
        );


      const duracion =
        Number(
          selectDuracion.value
        );


      // ==========================================
      // VALIDAR NOMBRE
      // ==========================================

      if (
        nombre.length < 2
      ) {

        alert(
          "Ingresa un nombre válido para el servicio."
        );


        campoNombre.input.focus();


        return;

      }


      // ==========================================
      // VALIDAR PRECIO
      // ==========================================

      if (
        !Number.isFinite(
          precio
        )
        ||
        precio < 0
      ) {

        alert(
          "Ingresa un precio válido."
        );


        campoPrecio.input.focus();


        return;

      }


      // ==========================================
      // VALIDAR DURACIÓN
      // ==========================================

      if (
        !Number.isFinite(
          duracion
        )
        ||
        duracion < 30
        ||
        duracion > 360
        ||
        duracion % 30 !== 0
      ) {

        alert(
          "Selecciona una duración válida."
        );


        return;

      }


      btnGuardar.disabled =
        true;


      btnGuardar.textContent =
        "Guardando...";


      try {

        await updateDoc(
          doc(
            db,
            "servicios",
            servicio.id
          ),
          {

            nombre:
            nombre,

            precio:
            precio,

            precioDesde:
            desdeCheckbox.checked,

            duracionMinutos:
            duracion,

            activo:
            activoCheckbox.checked,

            fechaActualizacion:
              serverTimestamp()

          }
        );


        alert(
          "Servicio actualizado correctamente."
        );


        await cargarServiciosAdmin();


      } catch (error) {

        console.error(
          "Error actualizando servicio:",
          error
        );


        alert(
          "No fue posible guardar los cambios."
        );


        btnGuardar.disabled =
          false;


        btnGuardar.textContent =
          "Guardar cambios";

      }

    }
  );


  // ==================================================
  // FORMULARIO INTERNO
  // ==================================================

  const formulario =
    document.createElement(
      "div"
    );


  formulario.classList.add(
    "admin-servicio-form"
  );


  formulario.append(

    campoNombre.contenedor,

    campoPrecio.contenedor,

    grupoDuracion,

    desdeLabel,

    activoLabel

  );


  // ==================================================
  // TARJETA COMPLETA
  // ==================================================

  tarjeta.append(

    cabecera,

    formulario,

    btnGuardar

  );


  listaServiciosAdmin.appendChild(
    tarjeta
  );

}


// ==================================================
// CREAR CAMPO TEXTO
// ==================================================

function crearCampoTexto(
  etiqueta,
  valor
) {

  const contenedor =
    document.createElement(
      "div"
    );


  contenedor.classList.add(
    "campo-formulario"
  );


  const label =
    document.createElement(
      "label"
    );


  label.textContent =
    etiqueta;


  const input =
    document.createElement(
      "input"
    );


  input.type =
    "text";


  input.value =
    valor || "";


  input.maxLength =
    60;


  contenedor.append(
    label,
    input
  );


  return {

    contenedor,
    input

  };

}


// ==================================================
// CREAR CAMPO NÚMERO
// ==================================================

function crearCampoNumero(
  etiqueta,
  valor
) {

  const contenedor =
    document.createElement(
      "div"
    );


  contenedor.classList.add(
    "campo-formulario"
  );


  const label =
    document.createElement(
      "label"
    );


  label.textContent =
    etiqueta;


  const input =
    document.createElement(
      "input"
    );


  input.type =
    "number";


  input.min =
    "0";


  input.step =
    "1000";


  input.value =
    Number(
      valor || 0
    );


  contenedor.append(
    label,
    input
  );


  return {

    contenedor,
    input

  };

}


// ==================================================
// FORMATEAR DURACIÓN
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

    return "0 min";

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


  return (
    `${horas} h ${resto} min`
  );

}
