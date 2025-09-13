// Get references to HTML elements
const authSection = document.getElementById('auth-section');
const mainAppSection = document.getElementById('main-app-section');
const registerFormContainer = document.getElementById('register-form-container');
const loginFormContainer = document.getElementById('login-form-container');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const allMoviesBtn = document.getElementById('all-movies-btn');
const watchlistBtn = document.getElementById('watchlist-btn');
const watchedBtn = document.getElementById('watched-btn');
const searchInput = document.getElementById('search-input');
const logoutBtn = document.getElementById('logout-btn');
const movieContainer = document.getElementById('movie-list-container');

const regMessage = document.getElementById('reg-message');
const logMessage = document.getElementById('log-message');

// Отримуємо посилання на main елемент
const mainElement = document.querySelector('main');

// Smart navigation scroll functionality
let lastScrollTop = 0;
let isScrolling = false;

const handleScroll = () => {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const header = document.querySelector('header');

    if (!header) return;

    // Ignore small scroll movements
    if (Math.abs(currentScrollTop - lastScrollTop) < 5) return;

    if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
        // Scrolling down and past threshold - hide header
        header.style.transform = 'translateY(-100%)';
        header.style.transition = 'transform 0.3s ease-in-out';
    } else if (currentScrollTop < lastScrollTop) {
        // Scrolling up - show header
        header.style.transform = 'translateY(0)';
        header.style.transition = 'transform 0.3s ease-in-out';
    }

    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
};

// Throttle scroll events for better performance
const throttleScroll = () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleScroll();
            isScrolling = false;
        });
        isScrolling = true;
    }
};

// Add scroll event listener
window.addEventListener('scroll', throttleScroll);

let allMoviesData = [];
let currentView = 'all';

// Base URL for the backend to correctly fetch images
const backendBaseUrl = 'http://127.0.0.1:5000';

const hideAuthForms = () => {
    registerFormContainer.style.display = 'none';
    loginFormContainer.style.display = 'none';
    registerForm.reset();
    loginForm.reset();
    regMessage.textContent = '';
    logMessage.textContent = '';
};

const setAuthMode = (isAuthMode) => {
    if (isAuthMode) {
        mainElement.classList.add('auth-mode');
        // Remove scroll listener when in auth mode
        window.removeEventListener('scroll', throttleScroll);
    } else {
        mainElement.classList.remove('auth-mode');
        // Add scroll listener when in main app mode
        window.addEventListener('scroll', throttleScroll);
    }
};

const renderMovies = (filter = 'all', searchTerm = '') => {
    movieContainer.innerHTML = '';
    let filteredMovies = allMoviesData;

    if (filter !== 'all') {
        filteredMovies = allMoviesData.filter(movie => movie.status === filter);
    }

    if (searchTerm) {
        filteredMovies = filteredMovies.filter(movie => movie.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    filteredMovies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.id = movie.id;

        let controlsHtml = '';
        if (currentView === 'all') {
            controlsHtml = `
                <button class="status-btn add-btn" data-status="watchlist">Add to Watchlist</button>
                <button class="status-btn add-btn" data-status="watched">Add to Watched</button>
            `;
        } else if (currentView === 'watchlist') {
            controlsHtml = `
                <button class="status-btn move-btn" data-status="watched">Move to Watched</button>
                <button class="status-btn remove-btn" data-status="all">Remove from Watchlist</button>
            `;
        } else if (currentView === 'watched') {
            controlsHtml = `
                <button class="status-btn move-btn" data-status="watchlist">Move to Watchlist</button>
                <button class="status-btn remove-btn" data-status="all">Remove from Watched</button>
            `;
        }

        movieCard.innerHTML = `
            <img src="${movie.image_url}" alt="${movie.title}" class="movie-poster">
            <div class="description-overlay">
                <p>${movie.description}</p>
            </div>
            <div class="movie-info">
                <h3>${movie.title} (${movie.year})</h3>
            </div>
            <div class="movie-controls">
                ${controlsHtml}
            </div>
        `;
        movieContainer.appendChild(movieCard);
    });

    document.querySelectorAll('.movie-controls .status-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const movieId = e.target.closest('.movie-card').dataset.id;
            const newStatus = e.target.dataset.status;

            const response = await sendRequest('http://127.0.0.1:5000/api/movies/status', { id: movieId, status: newStatus });
            if (response.ok) {
                const movieToUpdate = allMoviesData.find(m => m.id == movieId);
                if (movieToUpdate) {
                    movieToUpdate.status = newStatus;
                }
                renderMovies(currentView, searchInput.value);
            } else {
                console.error('Failed to update movie status.');
            }
        });
    });
};

const fetchAndRenderMovies = async () => {
    const response = await fetch('http://127.0.0.1:5000/api/movies');
    if (response.ok) {
        allMoviesData = await response.json();
        renderMovies();
    } else {
        console.error('Failed to fetch movies.');
    }
};

const showMainApp = () => {
    authSection.style.display = 'none';
    mainAppSection.style.display = 'block';
    setAuthMode(false); // Вимикаємо режим авторизації і включаємо scroll listener
    fetchAndRenderMovies();
};

const showAuthSection = () => {
    mainAppSection.style.display = 'none';
    authSection.style.display = 'block';
    setAuthMode(true); // Вмикаємо режим авторизації і вимикаємо scroll listener
    // Reset header position when going to auth
    const header = document.querySelector('header');
    if (header) {
        header.style.transform = 'translateY(0)';
    }
};

// При завантаженні сторінки встановлюємо режим авторизації
document.addEventListener('DOMContentLoaded', () => {
    setAuthMode(true);
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideAuthForms();
    loginFormContainer.style.display = 'block';
    setAuthMode(true);
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    hideAuthForms();
    registerFormContainer.style.display = 'block';
    setAuthMode(true);
});

const sendRequest = async (url, data) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response;
};

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const backendUrl = 'http://127.0.0.1:5000/api/register';
    const response = await sendRequest(backendUrl, { username, password });
    if (response.ok) {
        const result = await response.json();
        regMessage.textContent = result.message;
        regMessage.style.color = 'green';
        registerForm.reset();
        showMainApp();
    } else {
        const error = await response.json();
        regMessage.textContent = 'Registration Error: ' + error.error;
        regMessage.style.color = 'red';
    }
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('log-username').value;
    const password = document.getElementById('log-password').value;
    const backendUrl = 'http://127.0.0.1:5000/api/login';
    const response = await sendRequest(backendUrl, { username, password });
    if (response.ok) {
        const result = await response.json();
        logMessage.textContent = result.message;
        logMessage.style.color = 'green';
        loginForm.reset();
        showMainApp();
    } else {
        const error = await response.json();
        logMessage.textContent = 'Login Error: ' + error.error;
        logMessage.style.color = 'red';
    }
});

allMoviesBtn.addEventListener('click', () => {
    currentView = 'all';
    renderMovies(currentView, searchInput.value);
});

watchlistBtn.addEventListener('click', () => {
    currentView = 'watchlist';
    renderMovies(currentView, searchInput.value);
});

watchedBtn.addEventListener('click', () => {
    currentView = 'watched';
    renderMovies(currentView, searchInput.value);
});

searchInput.addEventListener('input', (e) => {
    renderMovies(currentView, e.target.value);
});

logoutBtn.addEventListener('click', () => {
    showAuthSection(); // Використовуємо нову функцію
    hideAuthForms();
    registerFormContainer.style.display = 'block';
});