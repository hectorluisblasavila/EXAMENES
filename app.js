// =====================================================
// AULA DE EVALUACIONES
// APP.JS
// =====================================================

const USUARIO_HIJA = "hija";
const CLAVE_HIJA = "1234";

const USUARIO_ADMIN = "admin";
const CLAVE_ADMIN = "admin123";

const CANTIDAD_EXAMEN = 20;

let cursoActual = "";
let examenActual = [];
let examenAnterior = [];
let respuestasUsuario = [];
let preguntaActual = 0;


// =====================================================
// INICIO
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    mostrarLogin();
});


// =====================================================
// UTILIDADES
// =====================================================

function mezclar(array) {
    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}


function obtenerCursos() {
    return [
        ...new Set(
            bancoPreguntas.map(p => p.curso)
        )
    ];
}


function obtenerPreguntasCurso(curso) {
    return bancoPreguntas.filter(
        p => p.curso === curso
    );
}


function obtenerTemasCurso(curso) {

    return [
        ...new Set(
            obtenerPreguntasCurso(curso)
                .map(p => p.tema)
        )
    ];
}


function obtenerPreguntasUsadas(curso) {

    const usuario =
        localStorage.getItem("usuarioActual");

    const clave =
        `usadas_${usuario}_${curso}`;

    return JSON.parse(
        localStorage.getItem(clave) || "[]"
    );
}


function guardarPreguntasUsadas(curso, ids) {

    const usuario =
        localStorage.getItem("usuarioActual");

    const clave =
        `usadas_${usuario}_${curso}`;

    localStorage.setItem(
        clave,
        JSON.stringify(ids)
    );
}


// =====================================================
// HEADER
// =====================================================

function generarHeader() {

    return `
        <header class="app-header">

            <div class="header-inner">

                <div class="brand">

                    <div class="brand-icon">
                        📚
                    </div>

                    <div>
                        <h1>Aula de Evaluaciones</h1>
                        <p>Aprender practicando</p>
                    </div>

                </div>

                <div class="top-actions">

                    <button
                        class="btn btn-secondary"
                        onclick="cerrarSesion()"
                    >
                        Cerrar sesión
                    </button>

                </div>

            </div>

        </header>
    `;
}


// =====================================================
// LOGIN
// =====================================================


const URL_APPS_SCRIPT =
    "https://script.google.com/macros/s/AKfycbwvUAgKz_l-q6IRreuCnMQhqEg6gXeRtv7br80e4cKyYr-dFruD8eCSfb0ajN0r5csjCg/exec";

let puenteAppsScript = null;
let solicitudesPuente = new Map();
let contadorSolicitudes = 0;

function obtenerPuenteAppsScript() {
    return new Promise((resolve, reject) => {
        if (puenteAppsScript && puenteAppsScript.isConnected) {
            resolve(puenteAppsScript);
            return;
        }

        const iframe = document.createElement("iframe");
        iframe.src = URL_APPS_SCRIPT + "?bridge=1";
        iframe.title = "Conexión de cuentas";
        iframe.style.display = "none";
        iframe.setAttribute("aria-hidden", "true");

        iframe.onload = () => {
            puenteAppsScript = iframe;
            puenteAppsScript.isConnected = true;
            resolve(iframe);
        };

        iframe.onerror = () => {
            iframe.remove();
            reject(new Error("No se pudo conectar con el servidor."));
        };

        document.body.appendChild(iframe);
    });
}

window.addEventListener("message", function(event) {
    if (
        !puenteAppsScript ||
        event.source !== puenteAppsScript.contentWindow ||
        !event.data ||
        event.data.tipo !== "RESPUESTA"
    ) {
        return;
    }

    const solicitud = solicitudesPuente.get(event.data.id);

    if (!solicitud) return;

    solicitudesPuente.delete(event.data.id);

    if (event.data.ok) {
        solicitud.resolve(event.data.resultado);
    } else {
        solicitud.reject(new Error(
            typeof event.data.resultado === "string"
                ? event.data.resultado
                : "No se pudo completar la solicitud."
        ));
    }
});

async function llamarAppsScript(accion, datos) {
    const iframe = await obtenerPuenteAppsScript();

    console.log("Puente cargado:", iframe.src);
console.log("Ventana del puente:", iframe.contentWindow);

    const id = String(++contadorSolicitudes);

    return new Promise((resolve, reject) => {
        solicitudesPuente.set(id, { resolve, reject });

        iframe.contentWindow.postMessage({
            tipo: "SOLICITUD",
            id: id,
            accion: accion,
            datos: datos
        }, "*");

        setTimeout(() => {
            if (solicitudesPuente.has(id)) {
                solicitudesPuente.delete(id);
                reject(new Error(
                    "El servidor tardó demasiado. Inténtalo nuevamente."
                ));
            }
        }, 20000);
    });
}


// =====================================================
// LOGIN
// =====================================================

function mostrarLogin() {
    document.getElementById("app").innerHTML = `
        <div class="container">
            <div class="card login-card">
                <div class="login-avatar">👩‍🎓</div>

                <h2>Aula de Evaluaciones</h2>

                <p class="muted">
                    Ingresa con el correo y la contraseña de tu cuenta.
                </p>

                <div class="form-group">
                    <label for="usuario">Correo electrónico</label>
                    <input
                        id="usuario"
                        class="input"
                        type="email"
                        autocomplete="username"
                        placeholder="tu correo electrónico"
                    >
                </div>

                <div class="form-group">
                    <label for="clave">Contraseña</label>
                    <input
                        id="clave"
                        class="input"
                        type="password"
                        autocomplete="current-password"
                        placeholder="Tu contraseña"
                    >
                </div>

                <button
                    id="botonIngresar"
                    class="btn btn-primary"
                    style="width:100%;"
                    onclick="iniciarSesion()"
                >
                    Ingresar
                </button>

                <button
                    class="btn btn-secondary"
                    style="width:100%; margin-top:10px;"
                    onclick="abrirRegistro()"
                >
                    Crear cuenta educativa
                </button>

                <p
                    id="mensajeLogin"
                    class="muted"
                    style="margin-top:15px;"
                    role="status"
                    aria-live="polite"
                ></p>
            </div>
        </div>
    `;
}


function abrirRegistro() {
    window.open(URL_APPS_SCRIPT, "_blank", "noopener");
}


async function iniciarSesion() {
    const campoCorreo = document.getElementById("usuario");
    const campoClave = document.getElementById("clave");
    const mensaje = document.getElementById("mensajeLogin");
    const boton = document.getElementById("botonIngresar");

    const correo = campoCorreo.value.trim().toLowerCase();
    const contrasena = campoClave.value;

    if (!correo || !contrasena) {
        mensaje.textContent = "Ingresa tu correo y contraseña.";
        return;
    }

    // Mantiene el acceso administrativo anterior.
    if (
        correo === USUARIO_ADMIN &&
        contrasena === CLAVE_ADMIN
    ) {
        localStorage.setItem("usuarioActual", USUARIO_ADMIN);
        mostrarAdmin();
        return;
    }

    boton.disabled = true;
    mensaje.textContent = "Verificando tu cuenta...";

    try {
        const resultado = await llamarAppsScript("iniciarSesion", {
            correo: correo,
            contrasena: contrasena
        });

        if (!resultado || !resultado.ok) {
            throw new Error("No se pudo validar la cuenta.");
        }

        localStorage.setItem("usuarioActual", correo);

        // Guardamos el nombre para mostrar un saludo personalizado.
        if (resultado.usuario) {
            localStorage.setItem(
                "nombreEstudiante",
                resultado.usuario.nombreEstudiante || ""
            );
        }

        mostrarDashboard();

    } catch (error) {
        mensaje.textContent =
            error.message || "No se pudo iniciar sesión.";
        boton.disabled = false;
    }
}



// =====================================================
// DASHBOARD
// =====================================================

function mostrarDashboard() {

    const usuario =
        localStorage.getItem(
            "usuarioActual"
        );

    const cursos =
        obtenerCursos();

    const historial =
        JSON.parse(
            localStorage.getItem(
                `historial_${usuario}`
            ) || "[]"
        );


    let html = generarHeader();


    html += `

        <main class="container">

            <div class="card">

                <h2>
                    👋 ¡Hola!
                </h2>

                <p class="muted">
                    Elige un curso para comenzar a practicar.
                </p>


                <!-- ESTADÍSTICAS -->

                <div class="dashboard-grid">

                    <div class="stat">

                        <div class="muted">
                            Cursos
                        </div>

                        <div class="stat-value">
                            ${cursos.length}
                        </div>

                    </div>


                    <div class="stat">

                        <div class="muted">
                            Exámenes realizados
                        </div>

                        <div class="stat-value">
                            ${historial.length}
                        </div>

                    </div>


                    <div class="stat">

                        <div class="muted">
                            Mejor nota
                        </div>

                        <div class="stat-value">

                            ${
                                historial.length
                                ? Math.max(
                                    ...historial.map(
                                        x => x.nota
                                    )
                                ) + "/20"
                                : "-"
                            }

                        </div>

                    </div>

                </div>


                <!-- RESULTADOS -->

                <div
                    style="
                        margin-top:25px;
                        padding:20px;
                        border-radius:18px;
                        background:var(--secondary);
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:15px;
                        flex-wrap:wrap;
                    "
                >

                    <div>

                        <h3 style="margin-bottom:5px;">
                            📚 Mis resultados
                        </h3>

                        <p
                            class="muted"
                            style="margin:0;"
                        >
                            Revisa tus exámenes anteriores
                            y aprende de tus errores.
                        </p>

                    </div>


                    <button
                        class="btn btn-primary"
                        onclick="mostrarHistorial()"
                    >
                        👁️ Ver mis resultados
                    </button>

                </div>


                <!-- CURSOS -->

                <h2 style="margin-top:30px;">
                    📚 Mis cursos
                </h2>


                <div class="subject-grid">
    `;


    cursos.forEach(curso => {

        const preguntas =
            obtenerPreguntasCurso(curso);

        const temas =
            obtenerTemasCurso(curso);


        html += `

            <div
                class="subject-card"
                onclick="seleccionarCurso('${curso}')"
            >

                <div class="subject-icon">
                    📖
                </div>

                <h3>
                    ${curso}
                </h3>

                <p class="muted">
                    ${temas.length} temas
                </p>

                <p class="muted">
                    ${preguntas.length} preguntas
                </p>

                <button
                    class="btn btn-primary"
                    onclick="
                        event.stopPropagation();
                        seleccionarCurso('${curso}')
                    "
                >
                    Practicar
                </button>

            </div>

        `;
    });


    html += `

                </div>

            </div>

        </main>

    `;


    document.getElementById("app").innerHTML =
        html;
}


// =====================================================
// CURSO
// =====================================================

function seleccionarCurso(curso) {

    cursoActual = curso;

    mostrarCurso();
}


function mostrarCurso() {

    const preguntas =
        obtenerPreguntasCurso(
            cursoActual
        );

    const temas =
        obtenerTemasCurso(
            cursoActual
        );


    let html = generarHeader();

    html += `

        <main class="container">

            <div class="top-actions">

                <button
                    class="btn btn-secondary"
                    onclick="mostrarDashboard()"
                >
                    ← Volver a cursos
                </button>

            </div>

            <div class="card">

                <h2>
                    📖 ${cursoActual}
                </h2>

                <p class="muted">
                    Practica con preguntas mezcladas
                    de todos los temas.
                </p>

                <div class="dashboard-grid">

                    <div class="stat">

                        <div class="muted">
                            Temas
                        </div>

                        <div class="stat-value">
                            ${temas.length}
                        </div>

                    </div>

                    <div class="stat">

                        <div class="muted">
                            Preguntas
                        </div>

                        <div class="stat-value">
                            ${preguntas.length}
                        </div>

                    </div>

                    <div class="stat">

                        <div class="muted">
                            Por examen
                        </div>

                        <div class="stat-value">
                            ${Math.min(
                                CANTIDAD_EXAMEN,
                                preguntas.length
                            )}
                        </div>

                    </div>

                </div>

                <div
                    style="
                        margin-top:25px;
                        padding:22px;
                        border-radius:18px;
                        background:var(--secondary);
                    "
                >

                    <h3>
                        🎯 Examen completo
                    </h3>

                    <p class="muted">
                        Las preguntas serán seleccionadas
                        aleatoriamente de todos los temas.
                    </p>

                    <button
                        class="btn btn-primary"
                        onclick="nuevoExamen()"
                    >
                        📝 Comenzar examen
                    </button>

                </div>

                <h2 style="margin-top:30px;">
                    📚 Temas incluidos
                </h2>

                <div class="topic-list">
    `;


    temas.forEach(tema => {

        const cantidad =
            preguntas.filter(
                p => p.tema === tema
            ).length;


        html += `

            <div class="topic-row">

                <div class="topic-info">

                    <strong>
                        ${tema}
                    </strong>

                    <span>
                        ${cantidad} ${
                            cantidad === 1
                            ? "pregunta"
                            : "preguntas"
                        }
                    </span>

                </div>

                <div
                    style="
                        min-width:120px;
                        width:120px;
                    "
                >

                    <div class="progress">

                        <div
                            class="progress-bar"
                            style="
                                width:${
                                    Math.min(
                                        cantidad * 5,
                                        100
                                    )
                                }%;
                            "
                        ></div>

                    </div>

                </div>

            </div>
        `;
    });


    html += `

                </div>

            </div>

        </main>
    `;

    document.getElementById("app").innerHTML =
        html;
}


// =====================================================
// NUEVO EXAMEN
// =====================================================

function nuevoExamen() {

    const todas =
        obtenerPreguntasCurso(
            cursoActual
        );


    if (!todas.length) {

        alert(
            "No hay preguntas disponibles para este curso."
        );

        return;
    }


    let usadas =
        obtenerPreguntasUsadas(
            cursoActual
        );


    let disponibles =
        todas.filter(
            pregunta =>
                !usadas.includes(
                    pregunta.id
                )
        );


    // Si no quedan suficientes preguntas
    if (
        disponibles.length <
        Math.min(
            CANTIDAD_EXAMEN,
            todas.length
        )
    ) {

        const reiniciar =
            confirm(
                "Ya se utilizaron las preguntas disponibles de este curso.\n\n" +
                "¿Quieres comenzar nuevamente el banco?"
            );


        if (!reiniciar) {
            return;
        }


        usadas = [];

        disponibles = [...todas];

        guardarPreguntasUsadas(
            cursoActual,
            []
        );
    }


    // =================================================
    // AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL
    //
    // NO FILTRAMOS POR TEMA.
    //
    // Tomamos TODAS las preguntas del curso.
    // =================================================

    disponibles =
        mezclar(disponibles);


    examenActual =
        disponibles.slice(
            0,
            Math.min(
                CANTIDAD_EXAMEN,
                disponibles.length
            )
        );


    // Guardamos como utilizadas
    const nuevosIds =
        examenActual.map(
            p => p.id
        );


    guardarPreguntasUsadas(
        cursoActual,
        [
            ...usadas,
            ...nuevosIds
        ]
    );


    // Guardamos copia para repetir
    examenAnterior =
        JSON.parse(
            JSON.stringify(
                examenActual
            )
        );


    respuestasUsuario =
        new Array(
            examenActual.length
        ).fill(null);


    preguntaActual = 0;


    mostrarPregunta();
}


// =====================================================
// MOSTRAR PREGUNTA
// =====================================================

function mostrarPregunta() {

    const pregunta =
        examenActual[
            preguntaActual
        ];


    if (!pregunta) {

        mostrarResultado();

        return;
    }


    // Mezclamos las alternativas
  if (!pregunta.opcionesMezcladas) {

    pregunta.opcionesMezcladas =
        mezclar(
            pregunta.opciones.map(
                (texto, indice) => ({
                    texto,
                    indice
                })
            )
        );
}

const opcionesMezcladas =
    pregunta.opcionesMezcladas;


    let html = generarHeader();


    html += `

        <main class="container">

            <div class="card">

                <div class="exam-header">

                    <div class="question-count">

                        Pregunta
                        ${preguntaActual + 1}
                        de
                        ${examenActual.length}

                    </div>

                    <div class="progress">

                        <div
                            class="progress-bar"
                            style="
                                width:${
                                    (
                                        (preguntaActual + 1)
                                        /
                                        examenActual.length
                                        * 100
                                    )
                                }%;
                            "
                        ></div>

                    </div>

                </div>

                <div class="muted">
                    Tema:
                    <strong>
                        ${pregunta.tema}
                    </strong>
                </div>

                <div class="question-text">
                    ${pregunta.pregunta}
                </div>

                <div class="answers">
    `;


    opcionesMezcladas.forEach(
        (opcion, posicion) => {

            const seleccionada =
                respuestasUsuario[
                    preguntaActual
                ] === opcion.indice;


            html += `

                <button
                    class="answer ${
                        seleccionada
                        ? "selected"
                        : ""
                    }"
                    onclick="
                        seleccionarRespuesta(
                            ${opcion.indice}
                        )
                    "
                >

                    <span class="answer-letter">
                        ${String.fromCharCode(
                            65 + posicion
                        )}
                    </span>

                    <span>
                        ${opcion.texto}
                    </span>

                </button>
            `;
        }
    );


    html += `

                </div>

                <div class="exam-actions">

                    <button
                        class="btn btn-secondary"
                        onclick="preguntaAnterior()"
                        ${
                            preguntaActual === 0
                            ? "disabled"
                            : ""
                        }
                    >
                        ← Anterior
                    </button>

                    <button
                        class="btn btn-primary"
                        onclick="siguientePregunta()"
                        ${
                            respuestasUsuario[
                                preguntaActual
                            ] === null
                            ? "disabled"
                            : ""
                        }
                    >
                        ${
                            preguntaActual ===
                            examenActual.length - 1
                            ? "Terminar"
                            : "Siguiente →"
                        }
                    </button>

                </div>

            </div>

        </main>
    `;


    document.getElementById("app").innerHTML =
        html;
}


// =====================================================
// RESPUESTA
// =====================================================

function seleccionarRespuesta(
    indice
) {

    respuestasUsuario[
        preguntaActual
    ] = indice;


    mostrarPregunta();
}


// =====================================================
// SIGUIENTE
// =====================================================

function siguientePregunta() {

    if (
        respuestasUsuario[
            preguntaActual
        ] === null
    ) {
        return;
    }


    if (
        preguntaActual <
        examenActual.length - 1
    ) {

        preguntaActual++;

        mostrarPregunta();

    } else {

        mostrarResultado();

    }
}


// =====================================================
// ANTERIOR
// =====================================================

function preguntaAnterior() {

    if (preguntaActual > 0) {

        preguntaActual--;

        mostrarPregunta();
    }
}


// =====================================================
// RESULTADO
// =====================================================

function mostrarResultado() {

    let correctas = 0;

    examenActual.forEach(
        (pregunta, indice) => {

            if (
                respuestasUsuario[indice] ===
                pregunta.correcta
            ) {
                correctas++;
            }

        }
    );

    const total =
        examenActual.length;

    const nota =
        Math.round(
            (
                correctas /
                total
            ) * 20
        );

    // Guardar resultado
    guardarResultado(
        correctas,
        total,
        nota
    );

    let mensaje;

    if (nota >= 18) {

        mensaje =
            "🌟 ¡Excelente trabajo!";

    } else if (nota >= 14) {

        mensaje =
            "👏 ¡Muy bien!";

    } else if (nota >= 11) {

        mensaje =
            "👍 ¡Buen esfuerzo!";

    } else {

        mensaje =
            "💪 Sigue practicando.";

    }

    let html = generarHeader();

    html += `

        <main class="container">

            <div class="card result">

                <h2>
                    🎉 Examen terminado
                </h2>

                <div class="score-circle">

                    <strong>
                        ${nota}/20
                    </strong>

                </div>

                <div class="result-message">
                    ${mensaje}
                </div>

                <p class="muted">

                    Respuestas correctas:

                    <strong>
                        ${correctas}/${total}
                    </strong>

                </p>

                <div
                    class="top-actions"
                    style="
                        justify-content:center;
                        margin-top:20px;
                    "
                >

                    <button
                        class="btn btn-secondary"
                        onclick="repetirExamen()"
                    >
                        🔄 Repetir examen
                    </button>

                    <button
                        class="btn btn-primary"
                        onclick="nuevoExamen()"
                    >
                        🎲 Nuevo examen
                    </button>

                    <button
                        class="btn btn-secondary"
                        onclick="mostrarCurso()"
                    >
                        📚 Volver al curso
                    </button>

                </div>

            </div>

            <div
                class="card"
                style="margin-top:20px;"
            >

                <h2>
                    📝 Revisión
                </h2>

                <div class="review">

    `;

    examenActual.forEach(
        (pregunta, indice) => {

            const respuesta =
                respuestasUsuario[indice];

            const correcta =
                respuesta ===
                pregunta.correcta;

            // =========================================
            // TRADUCCIÓN DE LA PREGUNTA
            // =========================================

            const traduccionPregunta =
                pregunta.traduccionPregunta ||
                "";

            // =========================================
            // RESPUESTA DEL ALUMNO
            // =========================================

            let respuestaUsuarioTexto =
                "Sin responder";

            let respuestaUsuarioTraduccion =
                "";

            if (
                respuesta !== null &&
                respuesta !== undefined &&
                pregunta.opciones &&
                pregunta.opciones[respuesta]
            ) {

                respuestaUsuarioTexto =
                    pregunta.opciones[respuesta];

                if (
                    pregunta.traduccionesOpciones &&
                    pregunta.traduccionesOpciones[
                        respuesta
                    ]
                ) {

                    respuestaUsuarioTraduccion =
                        pregunta.traduccionesOpciones[
                            respuesta
                        ];
                }

            }

            // =========================================
            // RESPUESTA CORRECTA
            // =========================================

            const respuestaCorrectaTexto =
                pregunta.opciones[
                    pregunta.correcta
                ];

            let respuestaCorrectaTraduccion =
                "";

            if (
                pregunta.traduccionesOpciones &&
                pregunta.traduccionesOpciones[
                    pregunta.correcta
                ]
            ) {

                respuestaCorrectaTraduccion =
                    pregunta.traduccionesOpciones[
                        pregunta.correcta
                    ];
            }

            // =========================================
            // EXPLICACIÓN
            // =========================================

            const explicacion =
                pregunta.explicacion ||
                "";

            html += `

                <div class="
                    review-item
                    ${
                        correcta
                        ? "correct"
                        : "incorrect"
                    }
                ">

                    <p class="muted">

                        Pregunta ${indice + 1}

                        ${
                            pregunta.tema
                            ? ` · ${pregunta.tema}`
                            : ""
                        }

                    </p>

                    <!-- PREGUNTA EN INGLÉS -->

                    <div
                        class="question-text"
                        style="font-size:18px;"
                    >

                        ${pregunta.pregunta}

                    </div>

                    ${
                        traduccionPregunta
                        ? `

                            <div
                                style="
                                    background:#f5f6ff;
                                    border-radius:12px;
                                    padding:12px 15px;
                                    margin:12px 0 18px;
                                "
                            >

                                🇪🇸
                                <strong>
                                    Traducción:
                                </strong>

                                ${traduccionPregunta}

                            </div>

                        `
                        : ""
                    }

                    <!-- RESPUESTA DEL ALUMNO -->

                    <p>

                        ${
                            correcta
                            ? "Tu respuesta:"
                            : "❌ Tu respuesta:"
                        }

                        <strong>
                            ${respuestaUsuarioTexto}
                        </strong>

                        ${
                            respuestaUsuarioTraduccion
                            ? `

                                <span class="muted">
                                    —
                                    ${respuestaUsuarioTraduccion}
                                </span>

                            `
                            : ""
                        }

                    </p>

                    ${
                        correcta

                        ? `

                            <div
                                style="
                                    background:#eefaf3;
                                    border-radius:12px;
                                    padding:14px;
                                    margin-top:12px;
                                "
                            >

                                <p>

                                    ✅
                                    <strong>
                                        ¡Respuesta correcta!
                                    </strong>

                                </p>

                            </div>

                        `

                        : `

                            <!-- RESPUESTA CORRECTA -->

                            <div
                                style="
                                    background:#fff5f5;
                                    border-radius:12px;
                                    padding:14px;
                                    margin-top:12px;
                                "
                            >

                                <p>

                                    ✅
                                    <strong>
                                        Respuesta correcta:
                                    </strong>

                                    ${respuestaCorrectaTexto}

                                    ${
                                        respuestaCorrectaTraduccion
                                        ? `

                                            <span class="muted">
                                                —
                                                ${respuestaCorrectaTraduccion}
                                            </span>

                                        `
                                        : ""
                                    }

                                </p>

                            </div>

                            ${
                                explicacion
                                ? `

                                    <div
                                        style="
                                            background:#fffaf0;
                                            border-radius:12px;
                                            padding:14px;
                                            margin-top:12px;
                                        "
                                    >

                                        <p>

                                            💡
                                            <strong>
                                                ¿Por qué?
                                            </strong>

                                        </p>

                                        <p>
                                            ${explicacion}
                                        </p>

                                    </div>

                                `
                                : ""
                            }

                        `
                    }

                </div>

            `;

        }
    );

    html += `

                </div>

            </div>

        </main>

    `;

    document.getElementById("app").innerHTML =
        html;
}


// =====================================================
// REPETIR EXAMEN
// =====================================================

function repetirExamen() {

    examenActual =
        JSON.parse(
            JSON.stringify(
                examenAnterior
            )
        );


    respuestasUsuario =
        new Array(
            examenActual.length
        ).fill(null);


    preguntaActual = 0;


    mostrarPregunta();
}


// =====================================================
// HISTORIAL
// =====================================================

function guardarResultado(correctas, total, nota) {

    const usuario =
        localStorage.getItem("usuarioActual");

    const clave =
        `historial_${usuario}`;

    const historial =
        JSON.parse(
            localStorage.getItem(clave) || "[]"
        );

    // Guardamos toda la información necesaria
    // para poder revisar y aprender de los errores.
    const examenGuardado =
        examenActual.map((pregunta, indice) => {

            return {
                id: pregunta.id,
                tema: pregunta.tema,

                // Pregunta original en inglés
                pregunta: pregunta.pregunta,

                // Traducción al español
                traduccionPregunta:
                    pregunta.traduccionPregunta || "",

                // Alternativas
                opciones: [...pregunta.opciones],

                // Traducción de cada alternativa
                traduccionesOpciones:
                    pregunta.traduccionesOpciones
                    ? [...pregunta.traduccionesOpciones]
                    : [],

                // Respuesta correcta
                correcta: pregunta.correcta,

                // Explicación del error
                explicacion:
                    pregunta.explicacion || "",

                // Respuesta marcada por la alumna
                respuestaUsuario:
                    respuestasUsuario[indice]
            };

        });

    historial.push({

        id: Date.now(),

        fecha:
            new Date().toLocaleString(),

        curso:
            cursoActual,

        correctas:
            correctas,

        total:
            total,

        nota:
            nota,

        preguntas:
            examenGuardado
    });

    localStorage.setItem(
        clave,
        JSON.stringify(historial)
    );
}


// =====================================================
// ADMIN
// =====================================================

function mostrarAdmin() {

    const historial =
        JSON.parse(
            localStorage.getItem(
                `historial_${USUARIO_HIJA}`
            ) || "[]"
        );


    let html = generarHeader();


    html += `

        <main class="container">

            <div class="card">

                <h2>
                    👨‍💼 Panel del administrador
                </h2>

                <p class="muted">
                    Historial de evaluaciones de tu hija.
                </p>

                <div class="topic-list">
    `;


    if (!historial.length) {

        html += `

            <div class="topic-row">

                <div class="topic-info">

                    <strong>
                        Aún no hay exámenes.
                    </strong>

                    <span>
                        Cuando se realice el primero
                        aparecerá aquí.
                    </span>

                </div>

            </div>
        `;

    } else {

        historial
            .slice()
            .reverse()
            .forEach(resultado => {

                html += `

                    <div class="topic-row">

                        <div class="topic-info">

                            <strong>
                                ${resultado.curso}
                            </strong>

                            <span>
                                ${resultado.fecha}
                                ·
                                ${resultado.correctas}/${resultado.total}
                                correctas
                            </span>

                        </div>

                        <strong>
                            ${resultado.nota}/20
                        </strong>

                    </div>
                `;
            });
    }


    html += `

                </div>

            </div>

        </main>
    `;


    document.getElementById("app").innerHTML =
        html;
}

// =====================================================
// MIS RESULTADOS
// =====================================================

function mostrarHistorial() {

    const usuario =
        localStorage.getItem("usuarioActual");

    const historial =
        JSON.parse(
            localStorage.getItem(
                `historial_${usuario}`
            ) || "[]"
        );

    let html = generarHeader();

    html += `

        <main class="container">

            <div class="top-actions">

                <button
                    class="btn btn-secondary"
                    onclick="mostrarDashboard()"
                >
                    ← Volver
                </button>

            </div>

            <div class="card">

                <h2>
                    📚 Mis resultados
                </h2>

                <p class="muted">
                    Revisa tus exámenes anteriores
                    y aprende de tus errores.
                </p>

                <div class="topic-list">
    `;

    if (historial.length === 0) {

        html += `

            <div class="topic-row">

                <div class="topic-info">

                    <strong>
                        No tienes exámenes todavía.
                    </strong>

                </div>

            </div>

        `;

    } else {

        historial
            .slice()
            .reverse()
            .forEach(resultado => {

                html += `

                    <div class="topic-row">

                        <div class="topic-info">

                            <strong>
                                ${resultado.curso}
                            </strong>

                            <span>
                                ${resultado.fecha}
                                ·
                                ${resultado.correctas}/${resultado.total}
                                correctas
                            </span>

                        </div>

                        <div class="top-actions">

                            <strong>
                                ${resultado.nota}/20
                            </strong>

                            ${
                                resultado.preguntas
                                ? `
                                    <button
                                        class="btn btn-primary"
                                        onclick="revisarExamen(${resultado.id})"
                                    >
                                        👁️ Revisar
                                    </button>
                                `
                                : `
                                    <span class="muted">
                                        Examen antiguo
                                    </span>
                                `
                            }

                        </div>

                    </div>

                `;
            });
    }

    html += `

                </div>

            </div>

        </main>
    `;

    document.getElementById("app").innerHTML =
        html;
}


// =====================================================
// REVISAR EXAMEN
// =====================================================

function revisarExamen(id) {

    const usuario =
        localStorage.getItem("usuarioActual");

    const historial =
        JSON.parse(
            localStorage.getItem(
                `historial_${usuario}`
            ) || "[]"
        );

    const examen =
        historial.find(
            resultado =>
                resultado.id === id
        );

    if (!examen) {

        alert("No se encontró el examen.");

        return;
    }

    if (!examen.preguntas) {

        alert(
            "Este examen fue realizado antes de activar el sistema de revisión."
        );

        return;
    }

    let html = generarHeader();

    html += `

        <main class="container">

            <div class="top-actions">

                <button
                    class="btn btn-secondary"
                    onclick="mostrarHistorial()"
                >
                    ← Mis resultados
                </button>

            </div>

            <div class="card">

                <div class="result">

                    <h2>
                        📖 Revisión del examen
                    </h2>

                    <p class="muted">
                        ${examen.curso}
                        ·
                        ${examen.fecha}
                    </p>

                    <div class="score-circle">

                        <strong>
                            ${examen.nota}/20
                        </strong>

                    </div>

                    <p class="result-message">
                        ${examen.correctas}
                        de
                        ${examen.total}
                        respuestas correctas
                    </p>

                </div>

                <div class="review">
    `;

    examen.preguntas.forEach(
        (pregunta, indice) => {

            const respuesta =
                pregunta.respuestaUsuario;

            const correcta =
                respuesta ===
                pregunta.correcta;

            // Traducción de la pregunta
            const traduccionPregunta =
                pregunta.traduccionPregunta ||
                "Traducción no disponible.";

            // Traducción de la respuesta marcada
            let respuestaUsuarioTexto =
                "Sin responder";

            let respuestaUsuarioTraduccion =
                "";

            if (
                respuesta !== null &&
                respuesta !== undefined &&
                pregunta.opciones &&
                pregunta.opciones[respuesta] !== undefined
            ) {

                respuestaUsuarioTexto =
                    pregunta.opciones[respuesta];

                if (
                    pregunta.traduccionesOpciones &&
                    pregunta.traduccionesOpciones[respuesta]
                ) {

                    respuestaUsuarioTraduccion =
                        pregunta.traduccionesOpciones[
                            respuesta
                        ];
                }
            }

            // Respuesta correcta
            const respuestaCorrectaTexto =
                pregunta.opciones &&
                pregunta.opciones[pregunta.correcta]
                    ? pregunta.opciones[pregunta.correcta]
                    : "";

            let respuestaCorrectaTraduccion =
                "";

            if (
                pregunta.traduccionesOpciones &&
                pregunta.traduccionesOpciones[
                    pregunta.correcta
                ]
            ) {

                respuestaCorrectaTraduccion =
                    pregunta.traduccionesOpciones[
                        pregunta.correcta
                    ];
            }

            // Explicación
            const explicacion =
                pregunta.explicacion ||
                "Revisa la respuesta correcta y vuelve a practicar esta pregunta.";

            html += `

                <div class="
                    review-item
                    ${
                        correcta
                        ? "correct"
                        : "incorrect"
                    }
                ">

                    <p class="muted">
                        Pregunta ${indice + 1}
                        · ${pregunta.tema}
                    </p>

                    <!-- PREGUNTA EN INGLÉS -->

                    <div
                        class="question-text"
                        style="font-size:18px;"
                    >
                        ${pregunta.pregunta}
                    </div>

                    <!-- TRADUCCIÓN -->

                    <div
                        style="
                            background:#f5f6ff;
                            border-radius:12px;
                            padding:12px 15px;
                            margin:12px 0 18px;
                        "
                    >

                        🇪🇸
                        <strong>
                            Traducción:
                        </strong>

                        ${traduccionPregunta}

                    </div>

                    <!-- RESPUESTA DEL ALUMNO -->

                    <p>

                        ${
                            correcta
                            ? "Tu respuesta:"
                            : "❌ Tu respuesta:"
                        }

                        <strong>
                            ${respuestaUsuarioTexto}
                        </strong>

                        ${
                            respuestaUsuarioTraduccion
                            ? `
                                <span class="muted">
                                    — ${respuestaUsuarioTraduccion}
                                </span>
                            `
                            : ""
                        }

                    </p>

                    ${
                        correcta

                        ? `

                            <div
                                style="
                                    background:#eefaf3;
                                    border-radius:12px;
                                    padding:14px;
                                    margin-top:12px;
                                "
                            >

                                <p>
                                    ✅
                                    <strong>
                                        ¡Respuesta correcta!
                                    </strong>
                                </p>

                            </div>

                        `

                        : `

                            <!-- RESPUESTA CORRECTA -->

                            <div
                                style="
                                    background:#fff5f5;
                                    border-radius:12px;
                                    padding:14px;
                                    margin-top:12px;
                                "
                            >

                                <p>

                                    ✅
                                    <strong>
                                        Respuesta correcta:
                                    </strong>

                                    ${respuestaCorrectaTexto}

                                    ${
                                        respuestaCorrectaTraduccion
                                        ? `
                                            <span class="muted">
                                                — ${respuestaCorrectaTraduccion}
                                            </span>
                                        `
                                        : ""
                                    }

                                </p>

                            </div>

                            <!-- EXPLICACIÓN -->

                            <div
                                style="
                                    background:#fffaf0;
                                    border-radius:12px;
                                    padding:14px;
                                    margin-top:12px;
                                "
                            >

                                <p>
                                    💡
                                    <strong>
                                        ¿Por qué?
                                    </strong>
                                </p>

                                <p>
                                    ${explicacion}
                                </p>

                            </div>

                        `
                    }

                </div>

            `;
        }
    );

    html += `

                </div>

            </div>

        </main>
    `;

    document.getElementById("app").innerHTML =
        html;
}
// =====================================================
// CERRAR SESIÓN
// =====================================================

function cerrarSesion() {

    localStorage.removeItem(
        "usuarioActual"
    );

    cursoActual = "";

    examenActual = [];

    respuestasUsuario = [];

    mostrarLogin();
}