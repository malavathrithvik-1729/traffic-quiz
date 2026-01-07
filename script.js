/************************************************
 * GLOBAL VARIABLES
 ************************************************/
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];
let visitedQuestions = [];
let username = "";

/************************************************
 * LOAD QUESTIONS
 ************************************************/
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data;
    console.log("Loaded:", allQuestions.length);
  })
  .catch(err => {
    console.error(err);
    alert("Failed to load questions");
  });

/************************************************
 * START QUIZ
 ************************************************/
function startQuiz() {

  const nameInput = document.getElementById("usernameInput");
  if (nameInput) {
    username = nameInput.value.trim();
    if (!username) {
      alert("Please enter your name");
      return;
    }
  }

  if (allQuestions.length < 5) {
    alert("Not enough questions");
    return;
  }

  quizQuestions = [...allQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  currentIndex = 0;
  score = 0;
  userAnswers = [];
  visitedQuestions = [];

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");

  loadQuestion();
  createQuestionNav();

}
function createQuestionNav() {
  const nav = document.getElementById("questionNav");
  if (!nav) return;

  nav.innerHTML = "";

  quizQuestions.forEach((_, i) => {
    const item = document.createElement("div");
    item.className = "q-nav-item";
    item.innerText = i + 1;

    item.onclick = () => goToQuestion(i);

    nav.appendChild(item);
  });

  updateQuestionNav();
}

/************************************************
 * LOAD QUESTION
 ************************************************/
function loadQuestion() {
  const q = quizQuestions[currentIndex];
  visitedQuestions[currentIndex] = true;

  document.getElementById("attempted").innerText = currentIndex + 1;
  document.getElementById("progressBar").style.width =
    ((currentIndex + 1) / quizQuestions.length) * 100 + "%";

  document.getElementById("question").innerText = q.QUESTION;
  document.getElementById("o1").innerText = q.OPTION1;
  document.getElementById("o2").innerText = q.OPTION2;
  document.getElementById("o3").innerText = q.OPTION3;

  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.classList.remove("selected");
    const opt = Number(btn.dataset.option);
    if (userAnswers[currentIndex] === opt) btn.classList.add("selected");
  });

  const img = document.getElementById("qImage");
img.src = ""; // 🔥 force reset to stop image reuse

if (q.IMAGE && q.IMAGE.trim() !== "") {
  img.src = "images/" + q.IMAGE;
  img.classList.remove("hidden");
} else {
  img.classList.add("hidden");
}
}

/************************************************
 * SELECT OPTION
 ************************************************/
function selectOption(value, btn) {
  userAnswers[currentIndex] = value;

  document.querySelectorAll(".option-btn").forEach(b =>
    b.classList.remove("selected")
  );

  btn.classList.add("selected");
  updateQuestionNav();
}

/************************************************
 * NEXT / SUBMIT
 ************************************************/
function nextQuestion() {
  if (userAnswers[currentIndex] === undefined) {
    alert("Please select an option");
    return;
  }

  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    calculateScore();
    showResult();
  }
}

/************************************************
 * BACK
 ************************************************/
function goBack() {
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
  }
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
function getOptionText(q, optionNumber) {
  if (optionNumber === 1) return "A. " + q.OPTION1;
  if (optionNumber === 2) return "B. " + q.OPTION2;
  if (optionNumber === 3) return "C. " + q.OPTION3;
  if (optionNumber === 0) return "D. None of the above";
  return "Not Answered";
}

/************************************************
 * RESULT PAGE
 ************************************************/
function showResult() {
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  document.getElementById("finalScore").innerText =
    `${username ? username + ", " : ""}Your Score: ${score} / ${quizQuestions.length}`;

  const review = document.getElementById("reviewSection");
  review.innerHTML = "";

  animateScoreRing();
  launchConfettiIfHighScore();
  saveResultToFirebase();

  quizQuestions.forEach((q, i) => {
    const userAns = userAnswers[i];
    const correctAns = q.ANSWER;

    const block = document.createElement("div");
    block.style.margin = "18px 0";
    block.style.padding = "15px";
    block.style.borderRadius = "10px";
    block.style.border = "1px solid #ccc";
    block.style.background =
      userAns === correctAns ? "#e9f9ef" : "#fdecea";

    block.innerHTML = `
  <p><b>Q${i + 1}.</b> ${q.QUESTION}</p>

  ${
    userAns === correctAns
      ? `<p class="correct">✅ Your Answer: <b>${getOptionText(q, userAns)}</b></p>`
      : `
        <p class="wrong">❌ Your Answer: <b>${getOptionText(q, userAns)}</b></p>
        <p class="correct">✅ Correct Answer: <b>${getOptionText(q, correctAns)}</b></p>
      `
  }
`;


    review.appendChild(block);
  });
}


/************************************************
 * QUESTION NAV COLORS
 ************************************************/
function updateQuestionNav() {
  document.querySelectorAll(".q-nav-item").forEach((item, i) => {
    item.classList.remove("current", "answered", "visited");

    if (i === currentIndex) item.classList.add("current");
    else if (userAnswers[i] !== undefined) item.classList.add("answered");
    else if (visitedQuestions[i]) item.classList.add("visited");
  });
}

/************************************************
 * NAV CLICK
 ************************************************/
function goToQuestion(index) {
  currentIndex = index;
  loadQuestion();
}

/************************************************
 * SCORE RING ANIMATION
 ************************************************/
function animateScoreRing() {
  const percent = Math.round((score / quizQuestions.length) * 100);
  const circle = document.querySelector(".ring-progress");
  const text = document.getElementById("ringScore");

  if (!circle || !text) return;

  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset =
    circumference - (percent / 100) * circumference;

  let current = 0;
  const timer = setInterval(() => {
    if (current >= percent) clearInterval(timer);
    else text.innerText = ++current;
  }, 15);
}

/************************************************
 * CONFETTI (HIGH SCORE ONLY)
 ************************************************/
function launchConfettiIfHighScore() {
  if ((score / quizQuestions.length) * 100 < 60) return;

  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 }
  });
}

/************************************************
 * FIREBASE SAVE (KEEP)
 ************************************************/
function saveResultToFirebase() {
  if (typeof db === "undefined") return;

  db.collection("results").add({
    name: username || "Anonymous",
    score: score,
    total: quizQuestions.length,
    percentage: Math.round((score / quizQuestions.length) * 100),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => console.log("Result saved to Firebase"))
  .catch(err => console.error("Firebase save error:", err));
}