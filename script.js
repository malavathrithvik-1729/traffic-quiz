/************************************************
 * GLOBAL STATE
 ************************************************/
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let userAnswers = [];
let visited = [];
let score = 0;
let submitted = false;
let username = "";

/************************************************
 * LOAD QUESTIONS
 ************************************************/
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data;
    console.log("Questions loaded:", allQuestions.length);
  })
  .catch(err => {
    console.error("Failed to load questions", err);
    alert("Unable to load questions");
  });

/************************************************
 * START QUIZ
 ************************************************/
function startQuiz() {
  const nameInput = document.getElementById("usernameInput");
username = nameInput.value.trim();

if (!username) {
  alert("Please enter your name");
  return;
}


  quizQuestions = [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  currentIndex = 0;
  userAnswers = [];
  visited = [];
  score = 0;
  submitted = false;

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");

  loadQuestion();
}

/************************************************
 * LOAD QUESTION
 ************************************************/
function loadQuestion() {
  const q = quizQuestions[currentIndex];
  visited[currentIndex] = true;

  document.getElementById("attempted").innerText = currentIndex + 1;
  document.getElementById("question").innerText = q.QUESTION;

  document.getElementById("o1").innerText = q.OPTION1;
  document.getElementById("o2").innerText = q.OPTION2;
  document.getElementById("o3").innerText = q.OPTION3;

  // Progress bar
  document.getElementById("progressBar").style.width =
    ((currentIndex + 1) / quizQuestions.length) * 100 + "%";

  // Restore option selection
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.classList.remove("selected");
    const val = Number(btn.dataset.option);
    if (userAnswers[currentIndex] === val) {
      btn.classList.add("selected");
    }
  });

  // IMAGE HANDLING (SAFE)
  const imgBox = document.getElementById("imageBox");
  const img = document.getElementById("qImage");

  imgBox.classList.add("hidden");
  img.src = "";

  if (q.IMAGE && q.IMAGE.trim() !== "") {
    img.onload = () => imgBox.classList.remove("hidden");
    img.onerror = () => imgBox.classList.add("hidden");
    img.src = "images/" + q.IMAGE;
  }

  updateNav();
}

/************************************************
 * SELECT OPTION
 ************************************************/
function selectOption(value, btn) {
  if (submitted) return;

  userAnswers[currentIndex] = value;

  document.querySelectorAll(".option-btn").forEach(b =>
    b.classList.remove("selected")
  );
  btn.classList.add("selected");

  updateNav();
}

/************************************************
 * NEXT / SUBMIT
 ************************************************/
function nextQuestion() {
  if (submitted) return;

  if (userAnswers[currentIndex] === undefined) {
    alert("Please answer this question");
    return;
  }

  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    loadQuestion();
    return;
  }

  // Final submit
  submitted = true;
  calculateScore();
  showResult();
}

/************************************************
 * BACK
 ************************************************/
function goBack() {
  if (currentIndex > 0 && !submitted) {
    currentIndex--;
    loadQuestion();
  }
}

/************************************************
 * NAVIGATION CLICK
 ************************************************/
function goToQuestion(i) {
  if (!submitted) {
    currentIndex = i;
    loadQuestion();
  }
}

/************************************************
 * UPDATE NAV COLORS
 ************************************************/
function updateNav() {
  document.querySelectorAll(".q-nav-item").forEach((item, i) => {
    item.classList.remove("current", "answered", "visited");

    if (i === currentIndex) item.classList.add("current");
    else if (userAnswers[i] !== undefined) item.classList.add("answered");
    else if (visited[i]) item.classList.add("visited");
  });
}

/************************************************
 * SCORE
 ************************************************/
function calculateScore() {
  score = 0;
  quizQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.ANSWER) score++;
  });
}

/************************************************
 * RESULT SCREEN
 ************************************************/
function showResult() {
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  const correct = score;
  const wrong = quizQuestions.length - score;
  const percent = Math.round((score / quizQuestions.length) * 100);

  document.getElementById("correctCount").innerText = correct;
  document.getElementById("wrongCount").innerText = wrong;
  document.getElementById("finalScore").innerText =
    `${score}/${quizQuestions.length} (${percent}%)`;
document.getElementById("correctCountBox").innerText = correct;
document.getElementById("wrongCountBox").innerText = wrong;

  renderReview();
  drawChart(correct, wrong);
  saveResult(percent);
}


/************************************************
 * REVIEW SECTION
 ************************************************/
function renderReview() {
  const review = document.getElementById("reviewSection");
  review.innerHTML = "";

  quizQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "review-block";

    let opts = "";
    for (let o = 1; o <= 3; o++) {
      let cls = "";
      if (q.ANSWER === o) cls = "correct";
      else if (userAnswers[i] === o) cls = "wrong";

      opts += `<div class="${cls}">
        ${String.fromCharCode(64 + o)}. ${q["OPTION" + o]}
      </div>`;
    }

    div.innerHTML = `
      <p><b>Q${i + 1}.</b> ${q.QUESTION}</p>
      ${opts}
    `;
    review.appendChild(div);
  });
}

/************************************************
 * SAVE RESULT (FIRESTORE)
 ************************************************/
function saveResult(percent) {
  if (typeof db === "undefined") return;

  db.collection("results").add({
    name: username,
    score: score,
    total: quizQuestions.length,
    percentage: percent,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => console.log("Result saved with name"))
  .catch(err => console.error("Firestore error:", err));
}

/************************************************
 * RESTART
 ************************************************/
function restartQuiz() {
  location.reload();
}
function drawChart(correct, wrong) {
  const ctx = document.getElementById("resultChart");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        data: [correct, wrong],
        backgroundColor: ["#2ecc71", "#e74c3c"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}
