// Run before the app renders so an explicitly chosen dark theme has no flash.
try {
  if (localStorage.getItem('pcss_theme_mode_v2') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {
  // Browsing still works when storage is unavailable.
}
