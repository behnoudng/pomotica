let isRunning = false;
let isBreak = false;
let workTime = 25 * 60; 
let breakTime = 5 * 60;
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
  pushToHabitica()
}
document.getElementById("export").onclick = () => {
    const data = localStorage.getItem("pomodata");
    const blob = new Blog([data], {type: "application/json"});
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
document.getElementById("save-habitica").onclick = () => {
    localStorage.setItem("habiticaUser", document.getElementById("userId").value);
    localStorage.setItem("habiticaToken", document.getElementById("token").value);
}
function pushToHabitica() {
    const userId = localStorage.getItem("habiticaUser");
    const token = localStorage.getItem("habiticaToken");
    if (!userId || !token) return;
    fetch("https://habitica.com/api/v3/tasks/user", {
        headers: {
            "x-api-user": userId,
            "x-api-key": token
        }
    }).then(r => r.json())
    .then(data => console.log("Habitica data:", data));
}