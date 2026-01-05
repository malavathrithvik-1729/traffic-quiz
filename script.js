/************************************************
 * GLOBAL VARIABLES
 ************************************************/
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let userAnswers = [];

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
    console.error("Error loading questions.json", err);
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
  answered = false;
  userAnswers = [];

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("quizScreen").classList.remove("hidden");

  // Reset progress bar
  document.getElementById("progressBar").style.width = "20%";

  loadQuestion();
}

/************************************************
 * LOAD QUESTION
 ************************************************/
function loadQuestion() {
  answered = false;

  const q = quizQuestions[currentIndex];

  // Update question count
  document.getElementById("attempted").innerText = currentIndex + 1;

  // ✅ Update progress bar (FIXED)
  const progressPercent = ((currentIndex + 1) / 5) * 100;
  document.getElementById("progressBar").style.width = progressPercent + "%";

  // Set question text
  document.getElementById("question").innerText = q.QUESTION;

  // Set options
  document.getElementById("o1").innerText = q.OPTION1;
  document.getElementById("o2").innerText = q.OPTION2;
  document.getElementById("o3").innerText = q.OPTION3;

  // Reset option buttons
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });

  // Image handling
  const img = document.getElementById("qImage");
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
function selectOption(selectedValue, btn) {
  if (answered) return;

  answered = true;

  // Save user answer
  userAnswers[currentIndex] = selectedValue;

  // Disable all buttons
  document.querySelectorAll(".option-btn").forEach(button => {
    button.disabled = true;
  });
}

/************************************************
 * NEXT QUESTION
 ************************************************/
function nextQuestion() {
  if (!answered) {
    alert("Please select an option");
    return;
  }

  currentIndex++;

  if (currentIndex < quizQuestions.length) {
    loadQuestion();
  } else {
    calculateScore();
    showResult();
  }
}

/************************************************
 * CALCULATE SCORE
 ************************************************/
function calculateScore() {
  score = 0;

  quizQuestions.forEach((q, index) => {
    if (userAnswers[index] === q.ANSWER) {
      score++;
    }
  });
}

/************************************************
 * SHOW RESULT + REVIEW
 ************************************************/
function showResult() {
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  document.getElementById("finalScore").innerText =
    `Your Score: ${score} / ${quizQuestions.length}`;

  const reviewDiv = document.getElementById("reviewSection");
  reviewDiv.innerHTML = "";

  quizQuestions.forEach((q, index) => {
    const userAns = userAnswers[index];
    const correctAns = q.ANSWER;

    const block = document.createElement("div");
    block.style.margin = "20px 0";
    block.style.padding = "15px";
    block.style.border = "1px solid #ccc";
    block.style.borderRadius = "8px";

    block.innerHTML = `
      <p><b>Q${index + 1}.</b> ${q.QUESTION}</p>

      <p class="${correctAns === 1 ? 'correct' : userAns === 1 ? 'wrong' : ''}">
        A. ${q.OPTION1}
      </p>

      <p class="${correctAns === 2 ? 'correct' : userAns === 2 ? 'wrong' : ''}">
        B. ${q.OPTION2}
      </p>

      <p class="${correctAns === 3 ? 'correct' : userAns === 3 ? 'wrong' : ''}">
        C. ${q.OPTION3}
      </p>

      <p class="${correctAns === 0 ? 'correct' : userAns === 0 ? 'wrong' : ''}">
        D. None of the above
      </p>
    `;

    reviewDiv.appendChild(block);
  });
}

/************************************************
 * SAVE RESULT TO FIREBASE
 ************************************************/
function saveResult() {
  const name = document.getElementById("username").value.trim();

  if (!name) {
    alert("Please enter your name");
    return;
  }

  db.collection("results").add({
    name: name,
    score: score,
    total: quizQuestions.length,
    time: new Date().toISOString()
  })
  .then(() => {
    alert("Result saved successfully ✅");
  })
  .catch(err => {
    console.error(err);
    alert("Error saving result ❌");
  });
}
