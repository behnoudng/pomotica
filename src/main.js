let isRunning = false;
let isBreak = false;
let workTime = 60 * 25;
let breakTime = 60 * 5;
let timeRemaining = workTime;
let timerInterval = null;
const alarm = new Audio("src/assets/alarm.mp3");
function renderTime() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.getElementById("timer-display").textContent =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
document.getElementById("start-pause").onclick = () => {
  if (!isRunning) {
    isRunning = true;
    timerInterval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        renderTime();
      } else {
        clearInterval(timerInterval);
        notifyPhaseEnd();
      }
    }, 1000);
    document.getElementById("start-pause").textContent = "Pause";
  } else {
    isRunning = false;
    clearInterval(timerInterval);
    document.getElementById("start-pause").textContent = "Start";
  }
};
document.getElementById("next").onclick = () => {
  clearInterval(timerInterval);
  isRunning = false;
  isBreak = !isBreak;
  timeRemaining = isBreak ? breakTime : workTime;
  renderTime();
  document.getElementById("start-pause").textContent = "Start";
};
document.getElementById("volume").oninput = (e) => {
  alarm.volume = e.target.value / 100;
};
document.getElementById("test-sound").onclick = () => {
  if (alarm.volume > 0) {
    alarm.play();
    new Notification("Test notification", { body: "This is a test!" });
  } else {
    new Notification("Test notification", { body: "Volume is 0!" });
  }
};
function notifyPhaseEnd() {
  saveSession();
  if (alarm.volume > 0) {
    alarm.play();
    new Notification(isBreak ? "Break time!" : "Work done!", {
      body: isBreak ? "Take a rest" : "Back to work"
    });
  }
}
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}
function saveSession() {
  if (isBreak) return;
  let data = JSON.parse(localStorage.getItem("pomodata")) || {};
  const today = new Date().toISOString().split('T')[0];
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem("pomodata", JSON.stringify(data));
  pushToHabitica();
}
document.getElementById("export").onclick = () => {
  const data = localStorage.getItem("pomodata") || "{}";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pomodata_backup.json";
  a.click();
  URL.revokeObjectURL(url);
};
document.getElementById("import-btn").onclick = () => {
  document.getElementById("import").click();
};
document.getElementById("import").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    localStorage.setItem("pomodata", event.target.result);
    alert("Data imported!");
  };
  reader.readAsText(file);
};

async function getHabits() {
  const userId = localStorage.getItem("habiticaUser");
  const token = localStorage.getItem("habiticaToken");
  if (!userId || !token) return null;
  try {
    const response = await fetch("https://habitica.com/api/v3/tasks/user", {
      headers: {
        "x-api-user": userId,
        "x-api-key": token,
        "Content-Type": "application/json",
        "x-client": "pomotica-" + userId
      }
    });
    if (response.ok) {
      const result = await response.json();
      return result.data.filter(task => task.type === "habit");
    }
  } catch (err) {
    console.error("Error fetching habits:", err);
  }
  return null;
}
async function scoreHabit(taskId) {
  const userId = localStorage.getItem("habiticaUser");
  const token = localStorage.getItem("habiticaToken");
  if (!userId || !token || !taskId) return false;
  try {
    const response = await fetch(`https://habitica.com/api/v3/tasks/${taskId}/score/up`, {
      method: "POST",
      headers: {
        "x-api-user": userId,
        "x-api-key": token,
        "Content-Type": "application/json",
        "x-client": "pomotica-" + userId
      }
    });
    return response.ok;
  } catch (err) {
    console.error("Error scoring habit:", err);
    return false;
  }
}
function pushToHabitica() {
  const taskId = localStorage.getItem("habiticaTask");
  if (taskId) scoreHabit(taskId);
}
const habiticaLog = document.getElementById("habitica-log");
function initHabiticaFields() {
  const savedUser = localStorage.getItem("habiticaUser");
  const savedToken = localStorage.getItem("habiticaToken");
  const savedTask = localStorage.getItem("habiticaTask");
  if (savedUser && savedToken) {
    document.getElementById("userId").value = savedUser;
    document.getElementById("token").value = savedToken;
    document.getElementById("taskId").value = savedTask || "";
    setLocked(true);
    habiticaLog.textContent = "Connected";
  } else {
    setLocked(false);
    habiticaLog.textContent = "Enter credentials to connect";
  }
}
function setLocked(locked) {
  document.getElementById("userId").readOnly = locked;
  document.getElementById("token").readOnly = locked;
}
document.getElementById("save-habitica").onclick = () => {
  const user = document.getElementById("userId").value.trim();
  const token = document.getElementById("token").value.trim();
  const task = document.getElementById("taskId").value.trim();
  if (!user || !token) {
    habiticaLog.textContent = "User ID and Token required";
    return;
  }
  localStorage.setItem("habiticaUser", user);
  localStorage.setItem("habiticaToken", token);
  if (task) localStorage.setItem("habiticaTask", task);
  setLocked(true);
  habiticaLog.textContent = "Saved";
};
document.getElementById("reset-habitica").onclick = () => {
  localStorage.removeItem("habiticaUser");
  localStorage.removeItem("habiticaToken");
  localStorage.removeItem("habiticaTask");
  document.getElementById("userId").value = "";
  document.getElementById("token").value = "";
  document.getElementById("taskId").value = "";
  setLocked(false);
  habiticaLog.textContent = "Cleared";
};
document.getElementById("check-tasks").onclick = async () => {
  habiticaLog.textContent = "Checking...";
  const habits = await getHabits();
  if (!habits) {
    habiticaLog.textContent = "Could not fetch habits. Forgot to save?";
    return;
  }
  habiticaLog.textContent = habits.map(h => `${h.text}\nID: ${h.id}`).join("\n\n");
};
initHabiticaFields();
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
let stars = [];
function initStars() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 0.8 + 0.2,
    speed: Math.random() * 0.03 + 0.01
  }));
}
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  stars.forEach(s => {
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    if (s.y > canvas.height) s.y = 0;
  });
  requestAnimationFrame(drawStars);
}
window.addEventListener("resize", initStars);
initStars();
drawStars();
