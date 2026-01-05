/************************************************
 * GLOBAL VARIABLES
 ************************************************/
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = [];
let visitedQuestions = [];

/************************************************
 * LOAD QUESTIONS FROM JSON
 ************************************************/
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    allQuestions = data;
    console.log("Questions loaded:", allQuestions.length);
  })
  .catch(err => {
    console.error(err);
    alert("Failed to load questions");
  });

/************************************************
 * START QUIZ
 ************************************************/
function startQuiz() {
  if (allQuestions.length < 5) {
    alert("Not enough questions available");
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

  document.getElementById("progressBar").style.width = "20%";

  loadQuestion();
}

/************************************************
 * LOAD QUESTION (FIXED)
 ************************************************/
function loadQuestion() {
  const q = quizQuestions[currentIndex];

  // Mark visited
  visitedQuestions[currentIndex] = true;

  // Question count
  document.getElementById("attempted").innerText = currentIndex + 1;

  // Progress bar
  const progressPercent =
    ((currentIndex + 1) / quizQuestions.length) * 100;
  document.getElementById("progressBar").style.width =
    progressPercent + "%";

  // Question text
  document.getElementById("question").innerText = q.QUESTION;

  // Options text
  document.getElementById("o1").innerText = q.OPTION1;
  document.getElementById("o2").innerText = q.OPTION2;
  document.getElementById("o3").innerText = q.OPTION3;

  // Reset + restore selected option
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.classList.remove("selected");

    const optValue = Number(btn.getAttribute("data-option"));
    if (userAnswers[currentIndex] === optValue) {
      btn.classList.add("selected");
    }
  });

  // Image handling
  const img = document.getElementById("qImage");
  if (q.IMAGE && q.IMAGE.trim() !== "") {
    img.src = "images/" + q.IMAGE;
    img.classList.remove("hidden");
  } else {
    img.classList.add("hidden");
  }

  // Back button visibility
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.style.display =
      currentIndex === 0 ? "none" : "inline-block";
  }

  // Next / Submit button text
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    nextBtn.innerText =
      currentIndex === quizQuestions.length - 1
        ? "Submit"
        : "Next";
  }

  updateQuestionNav();
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
    alert("Please answer this question first");
    return;
  }

  if (currentIndex < quizQuestions.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    // Final validation (SAFE – no blank page)
    for (let i = 0; i < quizQuestions.length; i++) {
      if (userAnswers[i] === undefined) {
        alert("Please answer all 5 questions before submitting");
        return;
      }
    }

    calculateScore();
    showResult();
  }
}

/************************************************
 * BACK BUTTON
 ************************************************/
function goBack() {
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
  }
}

/************************************************
 * CALCULATE SCORE
 ************************************************/
function calculateScore() {
  score = 0;
  quizQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.ANSWER) score++;
  });
}

/************************************************
 * SHOW RESULT
 ************************************************/
function showResult() {
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  document.getElementById("finalScore").innerText =
    `Your Score: ${score} / ${quizQuestions.length}`;

  const review = document.getElementById("reviewSection");
  review.innerHTML = "";

  quizQuestions.forEach((q, i) => {
    const block = document.createElement("div");
    block.style.margin = "15px 0";
    block.style.padding = "12px";
    block.style.border = "1px solid #ccc";

    block.innerHTML = `
      <p><b>Q${i + 1}.</b> ${q.QUESTION}</p>
      <p class="${q.ANSWER === 1 ? "correct" : userAnswers[i] === 1 ? "wrong" : ""}">A. ${q.OPTION1}</p>
      <p class="${q.ANSWER === 2 ? "correct" : userAnswers[i] === 2 ? "wrong" : ""}">B. ${q.OPTION2}</p>
      <p class="${q.ANSWER === 3 ? "correct" : userAnswers[i] === 3 ? "wrong" : ""}">C. ${q.OPTION3}</p>
      <p class="${q.ANSWER === 0 ? "correct" : userAnswers[i] === 0 ? "wrong" : ""}">D. None of the above</p>
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

    if (i === currentIndex) {
      item.classList.add("current");     // 🔵
    } else if (userAnswers[i] !== undefined) {
      item.classList.add("answered");    // 🟢
    } else if (visitedQuestions[i]) {
      item.classList.add("visited");     // 🟡
    }
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
 * SAVE RESULT
 ************************************************/
function saveResult() {
  const name = document.getElementById("username").value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }

  db.collection("results").add({
    name,
    score,
    total: quizQuestions.length,
    time: new Date().toISOString()
  }).then(() => alert("Result saved successfully ✅"));
}
