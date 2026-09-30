// Imágenes temáticas ilustradas para cada mes (estilo Google Calendar)
const MONTH_IMAGES = [
    "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?q=80&w=1200&auto=format&fit=crop", // Enero: Nieve / Invierno acogedor
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop", // Febrero: Flores de cerezo / Primavera temprana
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop", // Marzo: Flores coloridas
    "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1200&auto=format&fit=crop", // Abril: Naturaleza / Primavera verde
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1200&auto=format&fit=crop", // Mayo: Jardín / Naturaleza viva
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop", // Junio: Playa / Verano
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop", // Julio: Paisaje verdoso
    "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=1200&auto=format&fit=crop", // Agosto: Atardecer dorado
    "https://images.unsplash.com/photo-1507181179412-1e89099e8f92?q=80&w=1200&auto=format&fit=crop", // Septiembre: Plantas / Hojas de inicio de otoño
    "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1200&auto=format&fit=crop", // Octubre: Otoño / Bosque anaranjado
    "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop", // Noviembre: Bosque sereno / Tonalidades café
    "https://images.unsplash.com/photo-1482686115713-0fbcaced6e28?q=80&w=1200&auto=format&fit=crop"  // Diciembre: Luces / Pinos de invierno
];

let customHabits = JSON.parse(localStorage.getItem("energyCustomHabits")) || {
    intenso: ["Plantilla financiera / Estrategia", "Publicaciones / Marketing", "Avance de Proyecto Principal"],
    intermedio: ["Taller de composición inglesa", "Taller Santander Open Academy", "Clases de Inglés"],
    ligero: ["Comer las 3 comidas", "Lluvia de ideas semanal", "Organización del día"]
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
const addHabitBtn = document.getElementById("addHabitBtn");
const customHabitsContainer = document.getElementById("customHabitsContainer");

function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function updateBackgroundImage(monthIndex) {
    const imageUrl = MONTH_IMAGES[monthIndex];
    document.styleSheets[0].insertRule(`body::before { background-image: url('${imageUrl}'); }`, document.styleSheets[0].cssRules.length);
}

function init() {
    const todayKey = getTodayKey();
    quickTodayTitle.textContent = `Hoy (${todayKey})`;

    renderCalendar();
    renderCustomHabitsSettings();
    
    prevMonthBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    closeModalBtn.addEventListener("click", () => dayModal.classList.add("hidden"));
    saveDayBtn.addEventListener("click", saveDayData);
    openTodayBtn.addEventListener("click", () => openDayModal(todayKey, appData[todayKey]));

    if (addHabitBtn) {
        addHabitBtn.addEventListener("click", addNewHabit);
    }

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
    
    updateBackgroundImage(month);
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

    const habits = customHabits[currentEnergy] || [];
    if (habits.length === 0) {
        habitsList.innerHTML = "<p><em>No tienes metas registradas para este nivel. Agrégalas abajo.</em></p>";
        dailyPercentage.textContent = "0%";
        return;
    }

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

function addNewHabit() {
    const energySelect = document.getElementById("newHabitEnergy").value;
    const habitText = document.getElementById("newHabitText").value.trim();

    if (!habitText) return;

    if (!customHabits[energySelect]) customHabits[energySelect] = [];
    customHabits[energySelect].push(habitText);

    localStorage.setItem("energyCustomHabits", JSON.stringify(customHabits));
    document.getElementById("newHabitText").value = "";
    renderCustomHabitsSettings();
}

function deleteHabit(energy, index) {
    customHabits[energy].splice(index, 1);
    localStorage.setItem("energyCustomHabits", JSON.stringify(customHabits));
    renderCustomHabitsSettings();
}

function renderCustomHabitsSettings() {
    if (!customHabitsContainer) return;
    customHabitsContainer.innerHTML = "";
    ["intenso", "intermedio", "ligero"].forEach(energy => {
        (customHabits[energy] || []).forEach((habit, index) => {
            const row = document.createElement("div");
            row.classList.add("custom-habit-row");
            row.innerHTML = `
                <span><strong>[${energy.toUpperCase()}]</strong> ${habit}</span>
                <button class="delete-h-btn" onclick="deleteHabit('${energy}', ${index})">✕</button>
            `;
            customHabitsContainer.appendChild(row);
        });
    });
}

window.deleteHabit = deleteHabit;
init();
