const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

menuToggle.addEventListener('click', toggleSidebar);
closeSidebar.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar); 