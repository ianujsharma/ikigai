    // Sidebar toggle
    function toggleSidebar() {
        const isDesktop = window.innerWidth > 768;
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (isDesktop) {
            // Desktop behavior - toggle hidden state
            const isHidden = sidebar.classList.contains('hidden');
            sidebar.classList.toggle('hidden', !isHidden);
            mainContent.classList.toggle('sidebar-hidden', !isHidden);
            
            // Show/hide mobile menu button on desktop
            if (!isHidden) {
                // Sidebar is being hidden, show the menu button
                mobileMenuBtn.classList.add('show-desktop');
            } else {
                // Sidebar is being shown, hide the menu button
                mobileMenuBtn.classList.remove('show-desktop');
            }
            
            // Remove mobile classes if they exist
            sidebar.classList.remove('open');
            removeSidebarBackdrop();
        } else {
            // Mobile behavior - toggle open state
            isSidebarOpen = !isSidebarOpen;
            sidebar.classList.toggle('open', isSidebarOpen);
            
            // Add backdrop when sidebar is open on mobile
            if (isSidebarOpen) {
                addSidebarBackdrop();
            } else {
                removeSidebarBackdrop();
            }   
        }
    }

    // Helper function to add backdrop
    function addSidebarBackdrop() {
        if (!document.getElementById('sidebar-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'sidebar-backdrop';
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.width = '100%';
            backdrop.style.height = '100%';
            backdrop.style.background = 'rgba(0,0,0,0.5)';
            backdrop.style.zIndex = '19';
            backdrop.style.transition = 'opacity 0.3s ease';
            backdrop.onclick = toggleSidebar;
            document.body.appendChild(backdrop);
            
            // Trigger animation
            requestAnimationFrame(() => {
                backdrop.style.opacity = '1';
            });
        }
    }

    // Helper function to remove backdrop
    function removeSidebarBackdrop() {
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.remove();
                }
            }, 300);
        }
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        const isDesktop = window.innerWidth > 768;
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (isDesktop) {
            // Reset mobile states
            sidebar.classList.remove('open');
            removeSidebarBackdrop();
            isSidebarOpen = false;
            
            // Restore desktop sidebar if it was hidden
            if (sidebar.classList.contains('hidden')) {
                mainContent.classList.add('sidebar-hidden');
                mobileMenuBtn.classList.add('show-desktop');
            } else {
                mainContent.classList.remove('sidebar-hidden');
                mobileMenuBtn.classList.remove('show-desktop');
            }
        } else {
            // Reset desktop states
            sidebar.classList.remove('hidden');
            mainContent.classList.remove('sidebar-hidden');
            mobileMenuBtn.classList.remove('show-desktop');
            
            // Close sidebar on mobile
            if (isSidebarOpen) {
                sidebar.classList.add('open');
            }
        }
    });

    // Initialize sidebar state on page load
    document.addEventListener('DOMContentLoaded', function() {
        const isDesktop = window.innerWidth > 768;
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (isDesktop) {
            // Desktop: sidebar visible by default
            sidebar.classList.remove('hidden', 'open');
            mainContent.classList.remove('sidebar-hidden');
            mobileMenuBtn.classList.remove('show-desktop');
        } else {
            // Mobile: sidebar hidden by default
            sidebar.classList.remove('hidden', 'open');
            mainContent.classList.remove('sidebar-hidden');
            mobileMenuBtn.classList.remove('show-desktop');
            isSidebarOpen = false;
        }
    });