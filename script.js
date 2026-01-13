/*************************************************
 * SEEKHOSATHI – FINAL SCRIPT.JS
 *************************************************/

/* =========================
   API KEY (ONLY HERE)
========================= */
const API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initFadeUp();
  initCursorGlow();
  initMagneticButtons();
  initTiltCards();
  loadUserProfile();
  handleLearnPage();
  handleQuizPage();
});

/* =========================
   FADE-UP SCROLL ANIMATION
========================= */
function initFadeUp() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll(".fade-up").forEach(el => {
    observer.observe(el);
  });
}

/* =========================
   CURSOR GLOW
========================= */
function initCursorGlow() {
  const glow = document.getElementById("cursor-glow");
  if (!glow) return;

  document.addEventListener("mousemove", e => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
}

/* =========================
   MAGNETIC BUTTONS
========================= */
function initMagneticButtons() {
  document.querySelectorAll(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0,0)";
    });
  });
}

/* =========================
   3D TILT CARDS
========================= */
function initTiltCards() {
  document.querySelectorAll(".tilt-card").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = -(y - rect.height / 2) / 20;
      const rotateY = (x - rect.width / 2) / 20;
      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(800px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

/* =========================
   USER PROFILE
========================= */
function loadUserProfile() {
  const nameEl = document.getElementById("userName");
  const name = localStorage.getItem("userName");
  if (nameEl && name) nameEl.innerText = name;
}

function toggleProfileMenu() {
  const menu = document.getElementById("profileMenu");
  if (!menu) return;
  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

/* =========================
   DARK MODE
========================= */
function toggleDark() {
  document.documentElement.classList.toggle("dark");
}

/* =========================
   TYPING EFFECT
========================= */
function typeText(elementId, text, speed = 25) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerText = "";
  let i = 0;

  const interval = setInterval(() => {
    el.innerText += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

/* =========================
   LEARN PAGE (AI EXPLANATION)
========================= */
function handleLearnPage() {
  const topic = localStorage.getItem("topic");
  if (!document.getElementById("topicTitle") || !topic) return;

  document.getElementById("topicTitle").innerText = topic;
  fetchAIExplanation(topic);
}

async function fetchAIExplanation(topic) {
  const prompt = `
Explain "${topic}" in three parts:

1. Definition (simple English)
2. Easy Explanation (English)
3. Easy Explanation (Hinglish)

Keep it short and beginner-friendly.
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();
    const text = data.candidates[0].content.parts[0].text;
    const parts = text.split("\n\n");

    typeText("definition", parts[0] || "Not available");
    typeText("easyEng", parts[1] || "Not available", 20);
    typeText("easyHin", parts[2] || "Not available", 18);

  } catch (e) {
    document.getElementById("definition").innerText =
      "AI error occurred. Please refresh.";
  }
}

/* =========================
   QUIZ PAGE (AI MCQ)
========================= */
let quizData = [];
let currentQuestion = 0;
let score = 0;

function handleQuizPage() {
  if (!document.getElementById("quizBox")) return;
  const topic = localStorage.getItem("topic");
  if (!topic) return;

  document.getElementById("quizTopic").innerText =
    "Quiz on " + topic;

  loadQuiz(topic);
}

async function loadQuiz(topic) {
  const prompt = `
Create 3 multiple choice questions on "${topic}".
Each question should have 4 options.
Mention correct option.

Format:
Q: question
A) option
B) option
C) option
D) option
Correct: A
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await res.json();
  quizData = parseQuiz(data.candidates[0].content.parts[0].text);
  showQuestion();
}

function parseQuiz(text) {
  return text.split("\n\n").map(block => {
    const lines = block.split("\n");
    return {
      q: lines[0].replace("Q: ", ""),
      options: lines.slice(1, 5),
      correct: lines[5].split(": ")[1]
    };
  });
}

function showQuestion() {
  const q = quizData[currentQuestion];
  const box = document.getElementById("quizBox");

  box.innerHTML = `<p><b>${q.q}</b></p>` +
    q.options.map(opt =>
      `<p onclick="checkAnswer('${opt[0]}')">${opt}</p>`
    ).join("");

  document.getElementById("scoreBox").innerText =
    `Score: ${score}/${quizData.length}`;
}

function checkAnswer(ans) {
  if (ans === quizData[currentQuestion].correct) score++;
  document.getElementById("nextBtn").style.display = "block";
}

function nextQuestion() {
  currentQuestion++;
  document.getElementById("nextBtn").style.display = "none";

  if (currentQuestion < quizData.length) {
    showQuestion();
  } else {
    document.getElementById("quizBox").innerHTML =
      "<h3>Quiz Completed 🎉</h3>";
    document.getElementById("scoreBox").innerText =
      `Final Score: ${score}/${quizData.length}`;
  }
}
