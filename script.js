const HABITS_BY_ENERGY = {
    intenso: ["Plantilla financiera / Estrategia", "Publicaciones / Marketing", "Avance de Proyecto Principal", "Lectura compleja / Análisis"],
    intermedio: ["Taller de composición inglesa (Coursera)", "Taller Santander Open Academy", "Clases de Inglés", "Práctica guiada"],
    ligero: ["Comer las 3 comidas", "Lluvia de ideas semanal", "Pasar apuntes a bloc de notas", "Organización básica del día"],
    descanso: []
};

let currentDate = new Date();
let selectedDay = null;
let appData = JSON.parse(localStorage.getItem("energyTrackerData")) || {};
let currentEnergy = null;

const currentMonthYear = document.getElementById("currentMonthYear");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const dayModal = document.getElementById("dayModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalDateTitle = document.getElementById("modalDateTitle");
const habitsList = document.getElementById("habitsList");
const dailyPercentage = document.getElementById("dailyPercentage");
const dayNotes = document.getElementById("dayNotes");
const saveDayBtn = document.getElementById("saveDayBtn");
const openTodayBtn = document.getElementById("openTodayBtn");
const quickTodayTitle = document.getElementById("quickTodayTitle");

function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function init() {
    const todayKey = getTodayKey();
    quickTodayTitle.textContent = `Hoy (${todayKey})`;

    renderCalendar();
    
    prevMonthBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    closeModalBtn.addEventListener("click", () => dayModal.classList.add("hidden"));
    saveDayBtn.addEventListener("click", saveDayData);
    openTodayBtn.addEventListener("click", () => openDayModal(todayKey, appData[todayKey]));

    document.querySelectorAll(".energy-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".energy-btn").forEach(b => b.classList.remove("selected"));
            e.target.classList.add("selected");
            currentEnergy = e.target.dataset.energy;
            renderHabitsChecklist();
        });
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    currentMonthYear.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("day-cell", "empty");
        calendarGrid.appendChild(emptyCell);
    }

    let monthStats = { intenso: 0, intermedio: 0, ligero: 0, descanso: 0, total: 0 };

    for (let day = 1; day <= totalDays; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = appData[dateKey];

        const dayCell = document.createElement("div");
        dayCell.classList.add("day-cell");
        let cellHTML = `<span class="day-number">${day}</span>`;

        if (dayData && dayData.energy) {
            dayCell.setAttribute("data-energy", dayData.energy);
            cellHTML += `<span class="day-pct">${dayData.percentage}%</span>`;
            monthStats[dayData.energy]++;
            monthStats.total++;
        }

        dayCell.innerHTML = cellHTML;
        dayCell.addEventListener("click", () => openDayModal(dateKey, dayData));
        calendarGrid.appendChild(dayCell);
    }

    updateDashboard(monthStats);
}

function updateDashboard(stats) {
    if (stats.total === 0) {
        ["Intenso", "Intermedio", "Ligero", "Descanso"].forEach(type => {
            document.getElementById(`bar${type}`).style.width = "0%";
            document.getElementById(`pct${type}`).textContent = "0";
        });
        return;
    }

    const pInt = Math.round((stats.intenso / stats.total) * 100);
    const pMed = Math.round((stats.intermedio / stats.total) * 100);
    const pLig = Math.round((stats.ligero / stats.total) * 100);
    const pDes = Math.round((stats.descanso / stats.total) * 100);

    document.getElementById("barIntenso").style.width = `${pInt}%`;
    document.getElementById("barIntermedio").style.width = `${pMed}%`;
    document.getElementById("barLigero").style.width = `${pLig}%`;
    document.getElementById("barDescanso").style.width = `${pDes}%`;

    document.getElementById("pctIntenso").textContent = pInt;
    document.getElementById("pctIntermedio").textContent = pMed;
    document.getElementById("pctLigero").textContent = pLig;
    document.getElementById("pctDescanso").textContent = pDes;
}

function openDayModal(dateKey, dayData) {
    selectedDay = dateKey;
    modalDateTitle.textContent = `Registro: ${dateKey}`;
    dayNotes.value = dayData ? dayData.notes || "" : "";
    
    document.querySelectorAll(".energy-btn").forEach(b => b.classList.remove("selected"));
    currentEnergy = dayData ? dayData.energy : null;
    
    if (currentEnergy) {
        const selectedBtn = document.querySelector(`.energy-btn[data-energy="${currentEnergy}"]`);
        if (selectedBtn) selectedBtn.classList.add("selected");
    }

    renderHabitsChecklist(dayData ? dayData.completedHabits : []);
    dayModal.classList.remove("hidden");
}

function renderHabitsChecklist(completedHabits = []) {
    habitsList.innerHTML = "";
    if (!currentEnergy || currentEnergy === "descanso") {
        if (currentEnergy === "descanso") {
            habitsList.innerHTML = "<p><em>Día de recarga. Avance permitido del 0%.</em></p>";
            dailyPercentage.textContent = "100%";
        } else {
            habitsList.innerHTML = "<p><em>Selecciona un nivel de energía arriba.</em></p>";
            dailyPercentage.textContent = "0%";
        }
        return;
    }

    const habits = HABITS_BY_ENERGY[currentEnergy];
    habits.forEach((habit, index) => {
        const isChecked = completedHabits.includes(habit);
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("habit-item");
        itemDiv.innerHTML = `
            <input type="checkbox" id="habit_${index}" value="${habit}" ${isChecked ? "checked" : ""}>
            <label for="habit_${index}">${habit}</label>
        `;
        habitsList.appendChild(itemDiv);
    });

    calculateModalPercentage();
    habitsList.querySelectorAll("input").forEach(cb => cb.addEventListener("change", calculateModalPercentage));
}

function calculateModalPercentage() {
    if (currentEnergy === "descanso") {
        dailyPercentage.textContent = "100%";
        return 100;
    }
    const checkboxes = habitsList.querySelectorAll("input[type='checkbox']");
    if (checkboxes.length === 0) return 0;

    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const pct = Math.round((checkedCount / checkboxes.length) * 100);
    dailyPercentage.textContent = `${pct}%`;
    return pct;
}

function saveDayData() {
    if (!currentEnergy) {
        alert("Selecciona un estado de energía.");
        return;
    }

    const selectedCheckboxes = Array.from(habitsList.querySelectorAll("input[type='checkbox']:checked")).map(cb => cb.value);
    const pct = calculateModalPercentage();

    appData[selectedDay] = {
        energy: currentEnergy,
        completedHabits: selectedCheckboxes,
        percentage: pct,
        notes: dayNotes.value
    };

    localStorage.setItem("energyTrackerData", JSON.stringify(appData));
    dayModal.classList.add("hidden");
    renderCalendar();
}

init();
