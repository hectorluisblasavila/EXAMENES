const STORAGE_KEY = "aula_estudio_v1";

const defaultData = {

  users: [
    {
      username: "hija",
      password: "1234",
      name: "Mi hija",
      role: "student"
    },
    {
      username: "admin",
      password: "admin123",
      name: "Administrador",
      role: "admin"
    }
  ],

  subjects: [

    {
      id: "mat",
      name: "Matemática",
      icon: "🔢",

      topics: [

        {
          id: "fra",
          name: "Fracciones",

          questions: [

            {
              id: "q1",

              text: "¿Cuál de estas fracciones representa la mitad?",

              options: [
                "1/3",
                "1/2",
                "2/3",
                "3/4",
                "4/5"
              ],

              answer: 1
            },

            {
              id: "q2",

              text: "¿Cuántas partes iguales tiene una fracción con denominador 4?",

              options: [
                "2",
                "3",
                "4",
                "5",
                "8"
              ],

              answer: 2
            },

            {
              id: "q3",

              text: "¿Cuál fracción es mayor?",

              options: [
                "1/4",
                "1/5",
                "1/6",
                "1/8",
                "1/10"
              ],

              answer: 0
            }

          ]
        }

      ]
    }

  ],

  attempts: []
};


let data = loadData();

let currentUser = null;

let exam = null;



function loadData() {

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultData);
  }

  try {
    return JSON.parse(saved);
  }

  catch {
    return structuredClone(defaultData);
  }
}



function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}



function escapeHtml(str) {

  return String(str).replace(
    /[&<>"']/g,

    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );

}



function shuffle(arr) {

  const copy = [...arr];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] =
      [copy[j], copy[i]];

  }

  return copy;
}



function getSubject(id) {

  return data.subjects.find(
    subject => subject.id === id
  );

}



function getTopic(subjectId, topicId) {

  const subject =
    getSubject(subjectId);

  return subject?.topics.find(
    topic => topic.id === topicId
  );

}



function appShell(content) {

  return `

    <header class="app-header">

      <div class="header-inner">

        <div class="brand">

          <div class="brand-icon">
            📚
          </div>

          <div>

            <h1>
              Aula de Estudio
            </h1>

            <p>
              ${currentUser
                ? escapeHtml(currentUser.name)
                : "Aprender, practicar y mejorar"}
            </p>

          </div>

        </div>

        ${
          currentUser
          ?
          `<button
            class="btn btn-secondary"
            onclick="logout()">
            Cerrar sesión
          </button>`
          :
          ""
        }

      </div>

    </header>

    <main class="container">

      ${content}

    </main>

  `;
}



function renderLogin() {

  document.getElementById("app").innerHTML = `

    <div class="container">

      <div class="card login-card">

        <div class="login-avatar">
          👩‍🎓
        </div>

        <h2>
          Bienvenida a tu aula
        </h2>

        <p class="muted">
          Ingresa para comenzar tus evaluaciones.
        </p>


        <form onsubmit="login(event)">

          <div class="form-group">

            <label>
              Usuario
            </label>

            <input
              id="username"
              class="input"
              required
              placeholder="Usuario">

          </div>


          <div class="form-group">

            <label>
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              class="input"
              required
              placeholder="Contraseña">

          </div>


          <button
            class="btn btn-primary"
            style="width:100%">

            Ingresar

          </button>

        </form>


        <p class="muted small">

          Demo:
          <b>hija</b>
          /
          <b>1234</b>

        </p>

      </div>

    </div>

  `;
}



function login(event) {

  event.preventDefault();

  const username =
    document.getElementById("username")
      .value.trim();

  const password =
    document.getElementById("password")
      .value;

  const user =
    data.users.find(
      u =>
        u.username === username &&
        u.password === password
    );


  if (!user) {

    alert(
      "Usuario o contraseña incorrectos."
    );

    return;
  }


  currentUser = user;


  if (user.role === "admin") {

    renderAdmin();

  } else {

    renderDashboard();

  }

}



function logout() {

  currentUser = null;

  exam = null;

  renderLogin();

}



function renderDashboard() {

  const attempts =
    data.attempts.filter(
      a =>
        a.username ===
        currentUser.username
    );


  const best =
    attempts.length
      ? Math.max(
          ...attempts.map(a => a.score)
        )
      : 0;


  document.getElementById("app").innerHTML =
    appShell(`

      <div class="card">

        <h2>
          Hola,
          ${escapeHtml(currentUser.name)}
          👋
        </h2>

        <p class="muted">
          Elige un curso y luego un tema.
        </p>


        <div
          class="dashboard-grid"
          style="margin-top:20px">


          <div class="stat">

            <div class="muted">
              Evaluaciones
            </div>

            <div class="stat-value">
              ${attempts.length}
            </div>

          </div>


          <div class="stat">

            <div class="muted">
              Mejor puntuación
            </div>

            <div class="stat-value">
              ${best}/20
            </div>

          </div>


          <div class="stat">

            <div class="muted">
              Temas disponibles
            </div>

            <div class="stat-value">

              ${
                data.subjects.reduce(
                  (total, subject) =>
                    total + subject.topics.length,
                  0
                )
              }

            </div>

          </div>

        </div>

      </div>


      <div class="subject-grid">

        ${
          data.subjects.map(subject => `

            <div
              class="subject-card"
              onclick="showTopics('${subject.id}')">

              <div class="subject-icon">
                ${subject.icon}
              </div>

              <h3>
                ${escapeHtml(subject.name)}
              </h3>

              <div class="muted">
                ${subject.topics.length}
                tema(s)
              </div>

            </div>

          `).join("")
        }

      </div>


      <div
        class="card"
        style="margin-top:20px">

        <h3>
          Últimos resultados
        </h3>

        ${
          renderHistory(
            attempts
              .slice(-5)
              .reverse()
          )
        }

      </div>

    `);

}



function renderHistory(attempts) {

  if (!attempts.length) {

    return `
      <p class="muted">
        Todavía no hay evaluaciones.
      </p>
    `;

  }


  return attempts.map(a => `

    <div class="topic-row">

      <div class="topic-info">

        <strong>
          ${escapeHtml(a.subjectName)}
          ·
          ${escapeHtml(a.topicName)}
        </strong>

        <span>
          ${new Date(a.date)
            .toLocaleString("es-PE")}
        </span>

      </div>

      <strong>
        ${a.score}/20
      </strong>

    </div>

  `).join("");

}



function showTopics(subjectId) {

  const subject =
    getSubject(subjectId);


  document.getElementById("app").innerHTML =
    appShell(`

      <div class="card">

        <div class="top-actions">

          <button
            class="btn btn-secondary"
            onclick="renderDashboard()">

            ← Volver

          </button>

        </div>


        <h2 style="margin-top:18px">

          ${subject.icon}
          ${escapeHtml(subject.name)}

        </h2>


        <p class="muted">
          Selecciona un tema para practicar.
        </p>


        <div class="topic-list">

          ${
            subject.topics.map(topic => {

              const attempts =
                data.attempts.filter(
                  a =>
                    a.username === currentUser.username &&
                    a.subjectId === subjectId &&
                    a.topicId === topic.id
                );


              const best =
                attempts.length
                  ? Math.max(
                      ...attempts.map(
                        a => a.score
                      )
                    )
                  : 0;


              return `

                <div class="topic-row">

                  <div
                    class="topic-info"
                    style="flex:1">

                    <strong>

                      ${escapeHtml(topic.name)}

                      ${
                        best === 20
                          ? " 🏆"
                          : ""
                      }

                    </strong>


                    <span>

                      ${topic.questions.length}
                      preguntas disponibles

                      · Mejor:
                      ${best}/20

                    </span>


                    <div class="progress">

                      <div
                        class="progress-bar"
                        style="width:${best * 5}%">
                      </div>

                    </div>

                  </div>


                  <button
                    class="btn btn-primary"
                    onclick="
                      startExam(
                        '${subjectId}',
                        '${topic.id}'
                      )
                    ">

                    Empezar

                  </button>

                </div>

              `;

            }).join("")
          }

        </div>

      </div>

    `);

}



function startExam(subjectId, topicId) {

  const topic =
    getTopic(
      subjectId,
      topicId
    );


  if (
    !topic ||
    topic.questions.length < 1
  ) {

    alert(
      "Este tema todavía no tiene preguntas."
    );

    return;

  }


  const count =
    Math.min(
      20,
      topic.questions.length
    );


  const questions =
    shuffle(topic.questions)
      .slice(0, count)
      .map(q => {

        const pairs =
          q.options.map(
            (text, index) => ({
              text,
              correct:
                index === q.answer
            })
          );


        const shuffledOptions =
          shuffle(pairs);


        return {

          ...q,

          options:
            shuffledOptions.map(
              x => x.text
            ),

          answer:
            shuffledOptions.findIndex(
              x => x.correct
            ),

          selected: null

        };

      });


  exam = {

    subjectId,

    topicId,

    subjectName:
      getSubject(subjectId).name,

    topicName:
      topic.name,

    questions,

    current: 0

  };


  renderQuestion();

}



function renderQuestion() {

  const q =
    exam.questions[exam.current];


  const total =
    exam.questions.length;


  const letters =
    ["A", "B", "C", "D", "E", "F"];


  document.getElementById("app").innerHTML =
    appShell(`

      <div class="card">

        <div class="exam-header">

          <div class="top-actions">

            <button
              class="btn btn-secondary"
              onclick="
                showTopics(
                  '${exam.subjectId}'
                )
              ">

              Salir

            </button>

          </div>


          <p class="question-count">

            Pregunta
            ${exam.current + 1}
            de
            ${total}

          </p>


          <div class="progress">

            <div
              class="progress-bar"
              style="
                width:
                ${
                  ((exam.current + 1) /
                  total) * 100
                }%
              ">

            </div>

          </div>

        </div>


        <div class="question-text">

          ${escapeHtml(q.text)}

        </div>


        <div class="answers">

          ${
            q.options.map(
              (option, i) => `

                <button
                  class="
                    answer
                    ${
                      q.selected === i
                        ? "selected"
                        : ""
                    }
                  "
                  onclick="
                    selectAnswer(${i})
                  ">

                  <span
                    class="answer-letter">

                    ${letters[i]}

                  </span>


                  <span>

                    ${escapeHtml(option)}

                  </span>

                </button>

              `
            ).join("")
          }

        </div>


        <div class="exam-actions">

          <button
            class="btn btn-secondary"
            ${
              exam.current === 0
                ? "disabled"
                : ""
            }
            onclick="
              previousQuestion()
            ">

            ← Anterior

          </button>


          <button
            class="btn btn-primary"
            ${
              q.selected === null
                ? "disabled"
                : ""
            }
            onclick="
              nextQuestion()
            ">

            ${
              exam.current === total - 1
                ? "Terminar evaluación"
                : "Siguiente →"
            }

          </button>

        </div>

      </div>

    `);

}



function selectAnswer(index) {

  exam.questions[
    exam.current
  ].selected = index;

  renderQuestion();

}



function previousQuestion() {

  if (exam.current > 0) {

    exam.current--;

    renderQuestion();

  }

}



function nextQuestion() {

  if (
    exam.questions[
      exam.current
    ].selected === null
  ) {

    return;

  }


  if (
    exam.current <
    exam.questions.length - 1
  ) {

    exam.current++;

    renderQuestion();

  } else {

    finishExam();

  }

}



function finishExam() {

  const score =
    exam.questions.reduce(
      (total, q) =>
        total +
        (
          q.selected === q.answer
            ? 1
            : 0
        ),
      0
    );


  data.attempts.push({

    username:
      currentUser.username,

    subjectId:
      exam.subjectId,

    topicId:
      exam.topicId,

    subjectName:
      exam.subjectName,

    topicName:
      exam.topicName,

    score,

    total:
      exam.questions.length,

    date:
      new Date().toISOString()

  });


  saveData();

  renderResult(score);

}



function renderResult(score) {

  const total =
    exam.questions.length;


  const normalizedScore =
    total === 20
      ? score
      : Math.round(
          (score / total) * 20
        );


  let message =
    "¡Sigue practicando! 💪";


  if (
    normalizedScore >= 16 &&
    normalizedScore < 20
  ) {

    message =
      "¡Muy bien! Ya casi lo logras 🌟";

  }


  if (normalizedScore === 20) {

    message =
      "¡Excelente! Tema dominado 🏆";

  }


  document.getElementById("app").innerHTML =
    appShell(`

      <div class="card result">

        <div class="score-circle">

          <strong>
            ${normalizedScore}/20
          </strong>

        </div>


        <div class="result-message">

          ${message}

        </div>


        <p class="muted">

          ${score}
          respuestas correctas
          de
          ${total}
          preguntas.

        </p>


        <div
          class="top-actions"
          style="
            justify-content:center;
            margin-top:22px
          ">

          <button
            class="btn btn-primary"
            onclick="
              startExam(
                '${exam.subjectId}',
                '${exam.topicId}'
              )
            ">

            🔄 Nuevo intento

          </button>


          <button
            class="btn btn-secondary"
            onclick="
              showTopics(
                '${exam.subjectId}'
              )
            ">

            Ver tema

          </button>

        </div>


        <div class="review">

          <h3>
            Revisión
          </h3>


          ${
            exam.questions.map(
              (q, i) => {

                const ok =
                  q.selected === q.answer;


                return `

                  <div
                    class="
                      review-item
                      ${
                        ok
                          ? "correct"
                          : "incorrect"
                      }
                    ">

                    <strong>

                      ${i + 1}.
                      ${escapeHtml(q.text)}

                    </strong>


                    <p>

                      Tu respuesta:

                      ${
                        q.selected === null
                          ? "Sin responder"
                          : escapeHtml(
                              q.options[
                                q.selected
                              ]
                            )
                      }

                    </p>


                    ${
                      !ok
                        ?
                        `
                          <p>

                            Respuesta correcta:

                            <strong>

                              ${escapeHtml(
                                q.options[
                                  q.answer
                                ]
                              )}

                            </strong>

                          </p>
                        `
                        :
                        ""
                    }

                  </div>

                `;

              }
            ).join("")
          }

        </div>

      </div>

    `);

}



function renderAdmin() {

  document.getElementById("app").innerHTML =
    appShell(`

      <div class="card">

        <h2>
          👨‍💻 Panel del administrador
        </h2>

        <p class="muted">

          Crea temas y carga preguntas
          para tu hija.

        </p>

      </div>


      <div
        class="admin-grid"
        style="margin-top:20px">


        <div class="card">

          <h3>
            Crear tema
          </h3>


          <div class="form-group">

            <label>
              Curso
            </label>

            <select
              id="adminSubject"
              class="select">

              ${
                data.subjects.map(
                  s => `

                    <option
                      value="${s.id}">

                      ${escapeHtml(
                        s.name
                      )}

                    </option>

                  `
                ).join("")
              }

            </select>

          </div>


          <div class="form-group">

            <label>
              Nombre del tema
            </label>

            <input
              id="newTopicName"
              class="input"
              placeholder="
                Ej. Multiplicación
              ">

          </div>


          <button
            class="btn btn-primary"
            onclick="addTopic()">

            Crear tema

          </button>


          <hr
            style="
              margin:25px 0;
              border:0;
              border-top:
              1px solid var(--border)
            ">


          <h3>
            Cargar pregunta
          </h3>


          <div class="form-group">

            <label>
              Tema
            </label>

            <select
              id="adminTopic"
              class="select">
            </select>

          </div>


          <div class="form-group">

            <label>
              Pregunta
            </label>

            <textarea
              id="questionText"
              class="textarea"
              rows="3"
              placeholder="
                Escribe la pregunta...
              ">
            </textarea>

          </div>


          <div class="form-group">

            <label>
              Alternativas
            </label>

            <div id="optionsContainer">
            </div>

          </div>


          <div class="form-group">

            <label>
              Respuesta correcta
            </label>

            <select
              id="correctOption"
              class="select">

              <option value="0">
                A
              </option>

              <option value="1">
                B
              </option>

              <option value="2">
                C
              </option>

              <option value="3">
                D
              </option>

              <option value="4">
                E
              </option>

              <option value="5">
                F
              </option>

            </select>

          </div>


          <button
            class="btn btn-primary"
            onclick="addQuestion()">

            Guardar pregunta

          </button>

        </div>


        <div class="card">

          <h3>
            Banco de preguntas
          </h3>

          <div id="questionBank">
          </div>

        </div>

      </div>

    `);


  updateAdminTopics();

  renderQuestionBank();

}



function updateAdminTopics() {

  const subject =
    getSubject(
      document.getElementById(
        "adminSubject"
      ).value
    );


  const select =
    document.getElementById(
      "adminTopic"
    );


  select.innerHTML =
    subject.topics.map(
      topic => `

        <option value="${topic.id}">

          ${escapeHtml(topic.name)}

        </option>

      `
    ).join("");


  document.getElementById(
    "adminSubject"
  ).onchange =
    updateAdminTopics;


  renderQuestionInputs();

}



function renderQuestionInputs() {

  document.getElementById(
    "optionsContainer"
  ).innerHTML =

    [0,1,2,3,4,5]
      .map(
        i => `

          <div class="option-line">

            <input
              class="
                input
                admin-option
              "
              placeholder="
                Alternativa
                ${String.fromCharCode(
                  65 + i
                )}
              ">

          </div>

        `
      )
      .join("");

}



function addTopic() {

  const subject =
    getSubject(
      document.getElementById(
        "adminSubject"
      ).value
    );


  const name =
    document.getElementById(
      "newTopicName"
    ).value.trim();


  if (!name) {

    alert(
      "Escribe el nombre del tema."
    );

    return;

  }


  subject.topics.push({

    id:
      "topic_" +
      Date.now(),

    name,

    questions: []

  });


  saveData();


  document.getElementById(
    "newTopicName"
  ).value = "";


  renderAdmin();

}



function addQuestion() {

  const topic =
    getTopic(

      document.getElementById(
        "adminSubject"
      ).value,

      document.getElementById(
        "adminTopic"
      ).value

    );


  const text =
    document.getElementById(
      "questionText"
    ).value.trim();


  const inputs =
    [
      ...document.querySelectorAll(
        ".admin-option"
      )
    ];


  const options =
    inputs
      .map(input =>
        input.value.trim()
      )
      .filter(Boolean);


  const answer =
    Number(
      document.getElementById(
        "correctOption"
      ).value
    );


  if (
    !text ||
    options.length < 2
  ) {

    alert(
      "Debes escribir la pregunta y al menos 2 alternativas."
    );

    return;

  }


  if (
    answer >= options.length
  ) {

    alert(
      "La respuesta correcta no existe."
    );

    return;

  }


  topic.questions.push({

    id:
      "q_" +
      Date.now(),

    text,

    options,

    answer

  });


  saveData();


  alert(
    "Pregunta guardada correctamente."
  );


  renderAdmin();

}



function renderQuestionBank() {

  const box =
    document.getElementById(
      "questionBank"
    );


  const rows = [];


  data.subjects.forEach(
    subject => {

      subject.topics.forEach(
        topic => {

          topic.questions.forEach(
            q => {

              rows.push(`

                <div
                  class="question-admin">

                  <div
                    class="small muted">

                    ${escapeHtml(
                      subject.name
                    )}

                    ·

                    ${escapeHtml(
                      topic.name
                    )}

                  </div>


                  <strong>

                    ${escapeHtml(
                      q.text
                    )}

                  </strong>


                  <div
                    class="small"
                    style="
                      margin-top:8px
                    ">

                    ${
                      q.options
                        .map(
                          (option, i) => `

                            ${String.fromCharCode(
                              65 + i
                            )})
                            ${escapeHtml(
                              option
                            )}

                            ${
                              i === q.answer
                                ? " ✓"
                                : ""
                            }

                          `
                        )
                        .join(" · ")
                    }

                  </div>

                </div>

              `);

            }
          );

        }
      );

    }
  );


  box.innerHTML =
    rows.length
      ? rows.join("")
      :
      `
        <p class="muted">
          No hay preguntas todavía.
        </p>
      `;

}



renderLogin();