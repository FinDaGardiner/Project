// Mobile hamburger menu – opens/closes overlay
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.hamburger');
    const menu = document.getElementById('overlayMenu');

    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        menu.classList.toggle('open');
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            btn.setAttribute('aria-expanded', 'false');
            menu.classList.remove('open');
        });
    });
});