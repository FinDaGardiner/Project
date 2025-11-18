document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.hamburger');
    const menu = document.getElementById('overlayMenu');

    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        menu.classList.toggle('open');
    });

    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            btn.setAttribute('aria-expanded', 'false');
            menu.classList.remove('open');
        });
    });
});