// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ FIREBASE И АВТОРИЗАЦИЯ
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDu8YF2HbCcO7IYxHrJoOhoV6VGCNQkdJM",
    authDomain: "podarok-dd0af.firebaseapp.com",
    databaseURL: "https://podarok-dd0af-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "podarok-dd0af",
    storageBucket: "podarok-dd0af.firebasestorage.app",
    messagingSenderId: "725191612077",
    appId: "1:725191612077:web:6d2278f411d45e0fa3d824",
    measurementId: "G-YZ16WS10KX"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Уникальный ID вашей пары (должен совпадать с тем, что в правилах Firebase)
const COUPLE_ID = "secret_love_123";

let userPoints = 0;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDateString = "";
const monthsRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

// Слушатель: проверяем, вошел ли пользователь
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        console.log("Авторизован как:", user.email);

        // Загружаем очки только после успешного входа
        db.ref(`${COUPLE_ID}/score/points`).on('value', (snapshot) => {
            userPoints = snapshot.val() !== null ? snapshot.val() : 0;
            const ptsElement = document.getElementById('pts-val');
            if (ptsElement) ptsElement.innerText = userPoints;
            renderCoupons();
        });
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-content').style.display = 'none';
    }
});

window.loginWithGoogle = function() {
    auth.signInWithPopup(provider).catch((error) => {
        console.error("Ошибка входа:", error);
        alert("Не удалось войти: " + error.message);
    });
};

function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// ==========================================
// 2. НАВИГАЦИЯ И БАЛАНС (ГЛОБАЛЬНЫЕ)
// ==========================================
window.showTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById(`${tabId}-tab`);
    if (targetTab) targetTab.classList.add('active');
    
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
    
    if (tabId === 'calendar') renderCalendar();
    if (tabId === 'games') checkGamesLimits();
    if (tabId === 'coupons') renderCoupons();
};

window.toggleMusic = function() {
    const audio = document.getElementById('bg-music');
    const icon = document.getElementById('music-icon');
    if (!audio) return;
    if (audio.paused) {
        audio.play().catch(e => console.log("Музыка ждет клика"));
        icon.classList.remove('fa-music');
        icon.classList.add('fa-pause');
    } else {
        audio.pause();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-music');
    }
};

window.updatePoints = function(amount) {
    userPoints += amount;
    const ptsElement = document.getElementById('pts-val');
    if (ptsElement) ptsElement.innerText = userPoints;
    db.ref(`${COUPLE_ID}/score/points`).set(userPoints);
    renderCoupons();
};

// ==========================================
// 3. ТАЙМЕР
// ==========================================
function updateTimer() {
    const startDate = new Date("2024-02-14T00:00:00"); 
    const now = new Date();
    const diff = now - startDate;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.innerHTML = `
            <div class="time-block">❤️ Мы вместе уже: <b>${days}</b> дн.</div>
            <div class="time-block"><b>${hours}</b> ч. <b>${minutes}</b> мин. <b>${seconds}</b> сек.</div>
        `;
    }
}
setInterval(updateTimer, 1000);
updateTimer();

// ==========================================
// 4. КАЛЕНДАРЬ
// ==========================================
window.renderCalendar = function() {
    const grid = document.getElementById('calendar-days');
    if (!grid) return;
    grid.innerHTML = "";
    document.getElementById('current-month-year').innerText = `${monthsRu[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    let startShift = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < startShift; i++) {
        grid.appendChild(document.createElement('div'));
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-day');
        dayEl.innerText = day;
        dayEl.onclick = () => openModal(day);
        grid.appendChild(dayEl);
    }

    db.ref(`${COUPLE_ID}/calendar/${currentYear}/${currentMonth}`).once('value', (snapshot) => {
        const eventsData = snapshot.val() || {};
        grid.querySelectorAll('.calendar-day').forEach(el => {
            if (eventsData[parseInt(el.innerText)]) el.classList.add('has-event');
        });
    });
};

window.changeMonth = function(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
};

window.openModal = function(day) {
    selectedDateString = `${COUPLE_ID}/calendar/${currentYear}/${currentMonth}/${day}`;
    document.getElementById('modal-date-title').innerText = `${day} ${monthsRu[currentMonth]} ${currentYear}`;
    document.getElementById('event-modal').style.display = 'flex';
    closeEditMode();
    
    db.ref(selectedDateString).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('modal-note-display').innerText = data.note || "Заметки нет.";
            document.getElementById('modal-photos-display').innerHTML = data.photo ? `<img src="${data.photo}" style="max-width:100%; border-radius:10px; margin-top:10px;">` : "";
        } else {
            document.getElementById('modal-note-display').innerText = "Пустой день. Добавьте фото или запись!";
            document.getElementById('modal-photos-display').innerHTML = "";
        }
    });
};

window.closeModal = function() { document.getElementById('event-modal').style.display = 'none'; };
window.openEditMode = function() { 
    document.getElementById('modal-view-mode').style.display = 'none'; 
    document.getElementById('modal-edit-mode').style.display = 'block'; 
};
window.closeEditMode = function() { 
    document.getElementById('modal-view-mode').style.display = 'block'; 
    document.getElementById('modal-edit-mode').style.display = 'none'; 
};

window.saveEventData = function() {
    const noteText = document.getElementById('modal-note-input').value;
    const fileInput = document.getElementById('modal-file-input');
    
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            db.ref(selectedDateString).set({ note: noteText, photo: e.target.result }).then(() => {
                updatePoints(50);
                closeModal();
                renderCalendar();
            });
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        db.ref(selectedDateString).set({ note: noteText }).then(() => {
            closeModal();
            renderCalendar();
        });
    }
};

// ==========================================
// 5. ИГРЫ И ЛИМИТИРОВАНИЕ
// ==========================================
let quizPlayedToday = false;
let catchPlayedToday = false;

window.checkGamesLimits = function() {
    db.ref(`${COUPLE_ID}/games_played/${getTodayString()}`).once('value', (snapshot) => {
        const data = snapshot.val() || {};
        quizPlayedToday = !!data.quiz;
        catchPlayedToday = !!data.catch;
        
        const qStatus = document.getElementById('quiz-status');
        const cStatus = document.getElementById('catch-status');
        
        if (qStatus) qStatus.innerText = quizPlayedToday ? "❌ Уже сыграно" : "✅ Доступно";
        if (cStatus) cStatus.innerText = catchPlayedToday ? "❌ Уже сыграно" : "✅ Доступно";
    });
};

window.backToGames = function() {
    document.getElementById('games-menu').style.display = 'grid';
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('love-catch-screen').style.display = 'none';
    checkGamesLimits();
};

const quizQuestions = [
    { q: "Какого цвета были мои глаза при первой встрече?", o: ["Карие", "Голубыми/Зелеными", "Не помню!"], a: 0 },
    { q: "В какой день мы начали встречаться?", o: ["14 января", "14 февраля", "8 марта"], a: 1 },
    { q: "Куда мы пошли на наше первое свидание?", o: ["В кино", "Просто гуляли", "В кафе"], a: 1 }
];
let currentQ = 0, quizEarned = 0;

window.startQuiz = function() {
    if (quizPlayedToday) return alert("Викторину можно проходить только 1 раз в день!");
    document.getElementById('games-menu').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    currentQ = 0; quizEarned = 0;
    showQuestion();
};

function showQuestion() {
    const qBox = document.getElementById('quiz-box');
    if (currentQ >= quizQuestions.length) {
        qBox.innerHTML = `<h3>Потрясающе! Ты прошла квиз и получила +${quizEarned} pts! 🎉</h3>`;
        updatePoints(quizEarned);
        db.ref(`${COUPLE_ID}/games_played/${getTodayString()}/quiz`).set(true);
        setTimeout(backToGames, 3000);
        return;
    }
    
    const q = quizQuestions[currentQ];
    qBox.innerHTML = `<h3 id="quiz-question">${q.q}</h3><div id="quiz-options" class="quiz-options"></div>`;
    
    q.o.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "quiz-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            if (idx === q.a) { alert("Правильно! +30 pts!"); quizEarned += 30; } 
            else { alert("Ой, не угадала!"); }
            currentQ++; showQuestion();
        };
        document.getElementById('quiz-options').appendChild(btn);
    });
}

let gameInterval, timerInterval, gamePoints = 0, timeLeft = 60;

window.startLoveCatch = function() {
    if (catchPlayedToday) return alert("В 'Ловец Сердечек' можно играть только 1 раз в день!");
    document.getElementById('games-menu').style.display = 'none';
    document.getElementById('love-catch-screen').style.display = 'block';
    
    gamePoints = 0; timeLeft = 60;
    document.getElementById('game-score').innerText = gamePoints;
    document.getElementById('game-timer').innerText = timeLeft;
    
    const area = document.getElementById('game-area');
    const basket = document.getElementById('basket');
    
    area.onmousemove = (e) => {
        const rect = area.getBoundingClientRect();
        let x = e.clientX - rect.left - 20;
        if (x < 0) x = 0;
        if (x > rect.width - 40) x = rect.width - 40;
        basket.style.left = `${x}px`;
    };

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('game-timer').innerText = timeLeft;
        if (timeLeft <= 0) stopLoveCatch();
    }, 1000);

    gameInterval = setInterval(() => {
        const item = document.createElement('div');
        item.classList.add('falling-item');
        const isHeart = Math.random() > 0.3;
        item.innerText = isHeart ? "❤️" : "⏰";
        item.style.left = `${Math.random() * (area.clientWidth - 30)}px`;
        item.style.top = "0px";
        area.appendChild(item);

        let fall = setInterval(() => {
            let top = parseInt(item.style.top);
            if (top > 360) {
                let bLeft = parseInt(basket.style.left || 0);
                let iLeft = parseInt(item.style.left);
                if (iLeft >= bLeft - 20 && iLeft <= bLeft + 40) {
                    if (isHeart) gamePoints += 10; else gamePoints = Math.max(0, gamePoints - 20);
                    document.getElementById('game-score').innerText = gamePoints;
                }
                clearInterval(fall);
                item.remove();
            } else {
                item.style.top = `${top + 5}px`;
            }
        }, 30);
    }, 800);
};

window.stopLoveCatch = function() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    if (gamePoints > 0) {
        updatePoints(gamePoints);
        db.ref(`${COUPLE_ID}/games_played/${getTodayString()}/catch`).set(true);
        alert(`Время вышло! Ты заработала ${gamePoints} pts!`);
    }
    backToGames();
};

// ==========================================
// 6. КУПОНЫ, ЦЕНЫ И 2-ДНЕВНЫЙ КУЛДАУН + TELEGRAM
// ==========================================
const couponsData = [
    { id: 1, title: "Массаж", cost: 500, icon: "fa-spa" },
    { id: 2, title: "Кола", cost: 800, icon: "fa-bottle-droplet" },
    { id: 3, title: "Ресторан", cost: 2500, icon: "fa-utensils" },
    { id: 4, title: "Суши", cost: 3000, icon: "fa-bowl-food" },
    { id: 5, title: "Пицца", cost: 1000, icon: "fa-pizza-slice" },
    { id: 6, title: "Уборка дома", cost: 1200, icon: "fa-broom" }
];

window.renderCoupons = function() {
    const container = document.getElementById('coupons-container');
    if (!container) return;
    
    container.innerHTML = "";
    
    // Загружаем данные об активациях из Firebase, чтобы проверить таймер кулдауна (2 дня)
    db.ref(`${COUPLE_ID}/coupons/active`).once('value').then((snapshot) => {
        const activeCoupons = snapshot.val() || {};
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 дня в миллисекундах
        const now = Date.now();

        couponsData.forEach(c => {
            const activeRecord = activeCoupons[c.id];
            let isCooldownActive = false;
            let cooldownText = "";

            if (activeRecord) {
                const activatedAt = typeof activeRecord === 'object' ? activeRecord.activatedAt : 0;
                const elapsed = now - activatedAt;

                if (elapsed < TWO_DAYS_MS) {
                    isCooldownActive = true;
                    const remainingMs = TWO_DAYS_MS - elapsed;
                    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
                    
                    if (remainingHours > 24) {
                        const days = Math.ceil(remainingHours / 24);
                        cooldownText = `Обновится через ${days} дн.`;
                    } else {
                        cooldownText = `Обновится через ${remainingHours} ч.`;
                    }
                } else {
                    // Время вышло, удаляем устаревшую запись из БД, купон снова доступен
                    db.ref(`${COUPLE_ID}/coupons/active/${c.id}`).remove();
                }
            }

            const isLockedByPoints = userPoints < c.cost;
            const item = document.createElement('div');
            item.className = `coupon-item ${isLockedByPoints || isCooldownActive ? 'locked' : ''}`;
            item.id = `coupon-card-${c.id}`;
            
            item.innerHTML = `
                <div class="coupon-cost">${c.cost} pts</div>
                <i class="fa-solid ${c.icon}" style="font-size:35px; color:#e91e63; margin:10px 0;"></i>
                <h4>${c.title}</h4>
                <button class="coupon-btn" id="btn-coupon-${c.id}" ${isLockedByPoints || isCooldownActive ? 'disabled' : ''}>
                    ${isCooldownActive ? cooldownText : 'Применить купон'}
                </button>
            `;
            
            if (!isLockedByPoints && !isCooldownActive) {
                item.querySelector('button').onclick = () => activateCoupon(c.id, c.cost);
            }
            
            container.appendChild(item);
        });
    }).catch(e => {
        console.warn("Ошибка загрузки купонов из БД:", e);
    });
};

window.activateCoupon = function(id, cost) {
    if (userPoints >= cost) {
        try {
            // Сохраняем время активации для отсчета 2 дней
            db.ref(`${COUPLE_ID}/coupons/active/${id}`).set({
                activatedAt: Date.now()
            });
        } catch(e) {
            console.warn("Не удалось сохранить в БД", e);
        }
        
        updatePoints(-cost);
        alert("Купон успешно активирован! Он обновится через 2 дня.");
        renderCoupons();

        // Отправка уведомления в Telegram
        const activatedCoupon = couponsData.find(c => c.id === id);
        if (activatedCoupon) {
            const botToken = "ВСТАВЬ_СЮДА_ТОКЕН_ОТ_BOTFATHER";
            const chatId = "ВСТАВЬ_СЮДА_ТВОЙ_CHAT_ID";
            const message = `❤️ Внимание! Девушка только что активировала купон: "${activatedCoupon.title}" за ${cost} pts!`;
            
            const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
            
            fetch(telegramUrl).catch(err => console.error("Ошибка отправки в TG:", err));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderCoupons();
});

// ==========================================
// 7. WISHLIST
// ==========================================
let localWishlist = JSON.parse(localStorage.getItem('my_wishlist')) || {};

window.renderWishlist = function(data = localWishlist) {
    const list = document.getElementById('wishlist-items');
    if (!list) return;
    list.innerHTML = "";
    
    const keys = Object.keys(data);
    if (keys.length === 0) {
        list.innerHTML = "<p style='color:#aaa; font-size:0.9rem; margin-top:10px;'>Список пока пуст...</p>";
        return;
    }
    
    keys.forEach(key => {
        const item = data[key];
        const text = typeof item === 'object' ? item.text : item;
        const li = document.createElement('li');
        li.className = "wish-item";
        li.innerHTML = `
            <span>✨ ${text}</span>
            <button onclick="deleteWish('${key}')" class="delete-btn"><i class="fa-solid fa-trash"></i></button>
        `;
        list.appendChild(li);
    });
};

window.addWish = function() {
    const input = document.getElementById('wish-input');
    if (!input || input.value.trim() === "") return;
    
    const text = input.value.trim();
    const tempId = 'local_' + Date.now();
    
    localWishlist[tempId] = { text: text };
    localStorage.setItem('my_wishlist', JSON.stringify(localWishlist));
    renderWishlist();
    input.value = "";
    
    try {
        db.ref(`${COUPLE_ID}/wishlist`).push({ text: text });
    } catch(e) {
        console.warn("Нет подключения к БД, сохранено локально.");
    }
};

window.deleteWish = function(key) {
    delete localWishlist[key];
    localStorage.setItem('my_wishlist', JSON.stringify(localWishlist));
    renderWishlist();
    
    try {
        db.ref(`${COUPLE_ID}/wishlist/${key}`).remove();
    } catch(e) {}
};

try {
    db.ref(`${COUPLE_ID}/wishlist`).on('value', (snapshot) => {
        if (snapshot.val()) {
            localWishlist = snapshot.val();
            localStorage.setItem('my_wishlist', JSON.stringify(localWishlist));
            renderWishlist(localWishlist);
        }
    });
} catch(e) {}

document.addEventListener('DOMContentLoaded', renderWishlist);
