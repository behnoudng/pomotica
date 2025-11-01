let isRunning = false;
let isBreak = false;
let workTime = 60 * 20; 
let breakTime = 60 * 3;
let timeRemaining = workTime;
let timerInterval = null;
const alarm = new Audio("alarm.mp3");
const volSlider = document.getElementById("volume");
const importInput = document.getElementById("import");
function renderTime() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById("timer-display").textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
document.getElementById("start-pause").onclick = () => {
    if (!isRunning){
        isRunning = true;
        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                renderTime();
            } else {
                clearInterval(timerInterval);
                notifyPhaseEnd()
            }
        }, 1000);
        document.getElementById("start-pause").textContent = "Pause";
    } else {
        isRunning = false;
        clearInterval(timerInterval);
        document.getElementById("start-pause").textContent = "Start";
    }saveHabiticaBtn.disabled = locked;
};
document.getElementById("next").onclick = () => {
    clearInterval(timerInterval);
    isRunning = false;
    isBreak = !isBreak;
    timeRemaining = isBreak ? breakTime : workTime;
    renderTime();
    document.getElementById("start-pause").textContent = "Start";
};
volSlider.oninput = () => {
    alarm.volume = volSlider.value / 100;
}
document.getElementById("test-sound").onclick = () => {
    if (alarm.volume > 0) {
        alarm.play();
        new Notification("Test notification", {body: "This is a test notification!"});
    } else {
        new Notification("Test notification", {body: "Volume is 0!"});
    }
}
function notifyPhaseEnd() {
    saveSession();
    if (alarm.volume > 0) {
        alarm.play()
        new Notification(isBreak ? "Break time!" : "Work done!", {
            body: isBreak ? "Take a rest :-)" : "Back to work ;)"
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
    const data = localStorage.getItem("pomodata");
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pomodata_backup.json";
    a.click();
    URL.revokeObjectURL(url);
};
document.getElementById("import-btn").onclick = () => importInput.click();
importInput.onchange = event => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        localStorage.setItem("pomodata", e.target.result);
        alert("Data imported successfully!");
    };
    reader.readAsText(file);
}
async function getHabits() {
    const userId = localStorage.getItem("habiticaUser");
    const token = localStorage.getItem("habiticaToken");
    if (!userId || !token) {
        console.warn("Habitica credentials missing!");
        return;
    }
    const response = await fetch("https://habitica.com/api/v3/tasks/user", {
        headers: {
            "x-api-user": userId,
            "x-api-key": token,
            "Content-Type": "application/json",
            "x-client": "pomotica-" + userId
        }
    });
    if (response.ok){
        const result = await response.json()
        const habits = result.data.filter(task => task.type === "habit");
        console.log("Your habits:");
        habits.forEach(habit => console.log(` - ${habit.text} (ID: ${habit.id})`))
        return habits;
    } else {
        console.error("Error fetching habits: ", response.status, await response.text());
        return null;
    }
}
async function scoreHabit(taskId) {
    const userId = localStorage.getItem("habiticaUser");
    const token = localStorage.getItem("habiticaToken");
    if (!userId || !token || !taskId) {
        console.warn("Missing Habitica data! Make sure task ID and credentials are saved.");
        return false;
    }
    const response = await fetch(`https://habitica.com/api/v3/tasks/${taskId}/score/up`, {
        method: "POST",
        headers: {
            "x-api-user": userId,
            "x-api-key": token,
            "Content-Type": "application/json",
            "x-client": "pomotica-" + userId
        }
    });
    if (response.ok) {
        const data = await response.json();
        const newVal = data.data?.value ?? "N/A";
        console.log(`Success! New score: ${newVal}`);
        return true;
    } else {
        console.error("Error scoring habit:", response.status);
        return false;
    }
}
function pushToHabitica() {
    const taskId = localStorage.getItem("habiticaTask");
    if (!taskId) {
        console.warn("No Habitica task ID set.");
        return;
    }
    console.log("\nPomodoro completed! Scoring habit...");
    scoreHabit(taskId);
}
//-------------HABITICA SETTINGS------------------
const userIdInput = document.getElementById("userId");
const tokenInput = document.getElementById("token");
const taskIdInput = document.getElementById("taskId");
const saveHabiticaBtn = document.getElementById("save-habitica");
const checkTasksBtn = document.getElementById("check-tasks");
const resetHabiticaBtn = document.getElementById("reset-habitica");
const habiticaLog = document.getElementById("habitica-log");
function initHabiticaFields() {
    const savedUser = localStorage.getItem("habiticaUser");
    const savedToken = localStorage.getItem("habiticaToken");
    const savedTask = localStorage.getItem("habiticaTask");
    if (savedUser && savedToken) {
        userIdInput.value = savedUser;
        tokenInput.value = savedToken;
        taskIdInput.value = savedTask || "";
        setHabiticaLocked(true);
        habiticaLog.textContent = "Habitica linked! You can reset if needed.";
    } else {
        setHabiticaLocked(false);
        habiticaLog.textContent = "Enter your Habitica credentials and save.";
    }
}
function setHabiticaLocked(locked) {
    [userIdInput, tokenInput].forEach(el => el.readOnly = locked);
    // saveHabiticaBtn.disabled = locked;
    // checkTasksBtn.disabled = locked;
}
saveHabiticaBtn.onclick = () => {
    const user = userIdInput.value.trim();
    const token = tokenInput.value.trim();
    const task = taskIdInput.value.trim();
    if (!user || !token) {
        habiticaLog.textContent = "User ID and Token are required.";
        return;
    }
    localStorage.setItem("habiticaUser", user);
    localStorage.setItem("habiticaToken", token);
    if (task) localStorage.setItem("habiticaTask", task);
    setHabiticaLocked(true);
    habiticaLog.textContent = "Saved! Habitica connection established.";
};
resetHabiticaBtn.onclick = () => {
    localStorage.removeItem("habiticaUser");
    localStorage.removeItem("habiticaToken");
    localStorage.removeItem("habiticaTask");
    userIdInput.value = "";
    tokenInput.value = "";
    taskIdInput.value = "";
    setHabiticaLocked(false);
    habiticaLog.textContent = "Credentials cleared. Re-enter to reconnect.";
};
checkTasksBtn.onclick = async () => {
    const habits = await getHabits();
    if (!habits) {
        habiticaLog.textContent = "Could not fetch habits. Make sure User ID and Token are correct.";
        return;
    }
    habiticaLog.textContent = "Your Habitica habits:\n" + 
        habits.map(h => `- ${h.text}\n  ID: ${h.id}`).join("\n");
};
initHabiticaFields();


// --- Starfield backdrop ---
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
let stars = [];
function initStars() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2,
    a: Math.random() * 0.5 + 0.5,
    speed: Math.random() * 0.05
  }));
}
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  stars.forEach(s => {
    ctx.globalAlpha = s.a;
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