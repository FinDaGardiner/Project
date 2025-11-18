// scripts/dropdown.js
// Handles dropdown menu toggle (mobile tap + desktop hover fallback)

document.addEventListener('DOMContentLoaded', function () {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');

        // Toggle on click (mobile)
        dropbtn.addEventListener('click', function (e) {
            e.preventDefault();
            dropdown.classList.toggle('open');
        });

        // Optional: Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    });
});