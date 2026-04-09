document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.hamburger');
  const menu = document.getElementById('overlayMenu');

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    menu.classList.toggle('open');

    // NEW: toggle a body class so CSS can react
    document.body.classList.toggle('menu-open', !expanded);
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');

      // NEW: ensure class removed when closing via link
      document.body.classList.remove('menu-open');
    });
  });
});
