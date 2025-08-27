
// Helper function to convert hex to rgb
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    let r, g, b;
    
    if (hex.length === 3) {
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return '0, 0, 0';
    }
    
    return `${r}, ${g}, ${b}`;
}

// Theme Management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
        localStorage.setItem('theme', 'dark');
        document.documentElement.style.setProperty('--bg-tertiary-rgb', '15, 52, 96');
        document.documentElement.style.setProperty('--bg-secondary-rgb', '22, 33, 62');
        document.documentElement.style.setProperty('--accent-rgb', '127, 90, 240');
    } else {
        body.setAttribute('data-theme', 'light');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'light');
        document.documentElement.style.setProperty('--bg-tertiary-rgb', hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary')));
        document.documentElement.style.setProperty('--bg-secondary-rgb', hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary')));
        document.documentElement.style.setProperty('--accent-rgb', hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--accent-color')));
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (savedTheme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    }
}
