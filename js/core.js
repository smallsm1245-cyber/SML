/**
 * 🎬 SMALLSM ARCHIVE - CORE SCRIPT
 * Centralizes shared logic for all public pages:
 * - Supabase Initialization
 * - Age Verification (Gatekeeping)
 * - Dark Mode State management
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════
    // 1. CONSTANTS & GLOBALS
    // ═══════════════════════════════════════════════════
    const VERIFICATION_KEY = 'age_verified';
    const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const THEME_KEY = 'theme';
    const ADMIN_EMAIL = 'dptpal0@gmail.com'; // Standardized admin email

    window.ADMIN_EMAIL = ADMIN_EMAIL;
    window.supabaseClient = null;
    window.supabaseClientInitialized = false;

    // ═══════════════════════════════════════════════════
    // 2. IMMEDIATE STATE CHECKS (Run before DOM)
    // ═══════════════════════════════════════════════════
    function applyInitialState() {
        // Dark Mode
        if (localStorage[THEME_KEY] === 'dark' ||
            (!localStorage[THEME_KEY] && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Age Verification Gate
        const verified = localStorage.getItem(VERIFICATION_KEY);
        if (verified) {
            const timestamp = parseInt(verified);
            if (Date.now() - timestamp < VERIFICATION_DURATION) {
                document.documentElement.classList.add('verified');
                // Inject style to hide disclaimer immediately
                const head = document.head || document.getElementsByTagName('head')[0];
                const style = document.createElement('style');
                style.textContent = '#disclaimerOverlay { display: none !important; } .content-blur { filter: none !important; pointer-events: auto !important; }';
                head.appendChild(style);
            }
        }
    }
    applyInitialState();

    // ═══════════════════════════════════════════════════
    // 3. CORE LOGIC
    // ═══════════════════════════════════════════════════

    /**
     * Wait for Supabase Config (from /api/config)
     */
    function waitForConfig(callback) {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
            callback();
            return;
        }
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
                clearInterval(interval);
                callback();
            }
        }, 50);
        // Timeout after 5s
        setTimeout(() => clearInterval(interval), 5000);
    }

    /**
     * Initialize Supabase Client
     */
    function initializeSupabase() {
        if (window.supabaseClient) return true;

        if (!window.supabase || !window.SUPABASE_CONFIG) {
            console.error('❌ Supabase dependency missing');
            return false;
        }

        try {
            window.supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            window.supabaseClientInitialized = true;
            return true;
        } catch (e) {
            console.error('❌ Supabase Init Error:', e);
            return false;
        }
    }

    /**
     * Inject Disclaimer Overlay if not present
     */
    function injectDisclaimer() {
        if (document.getElementById('disclaimerOverlay')) return;
        if (document.documentElement.classList.contains('verified')) return;

        const overlay = document.createElement('div');
        overlay.id = 'disclaimerOverlay';
        overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md px-6';
        overlay.innerHTML = `
            <div class="bg-white dark:bg-slate-900 p-8 rounded-lg max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
                <h2 class="text-2xl font-bold mb-4 font-serif text-brand-primary">성인 인증</h2>
                <p class="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    본 사이트는 성인 지향 콘텐츠를 포함하고 있습니다.<br>
                    귀하는 만 19세 이상이십니까?
                </p>
                <div class="flex flex-col gap-3">
                    <button id="btnYes" class="w-full py-4 bg-brand-primary text-black rounded-lg font-bold hover:bg-brand-primary/80 transition-colors">예 (19세 이상)</button>
                    <button id="btnNo" class="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">아니요</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btnYes').addEventListener('click', () => {
            localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
            document.documentElement.classList.add('verified');
            overlay.style.display = 'none';
            const container = document.getElementById('appContainer');
            if (container) container.classList.remove('content-blur');
        });

        document.getElementById('btnNo').addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });

        const container = document.getElementById('appContainer');
        if (container) container.classList.add('content-blur');
    }

    // Initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        // Init Lucide if available
        if (window.lucide) window.lucide.createIcons();

        // Auto-inject Disclaimer if needed
        injectDisclaimer();

        // Standard Theme Toggle support
        const themeToggle = document.getElementById('headerModeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
            });
        }

        // Shared Supabase Waiter for other scripts
        waitForConfig(() => {
            initializeSupabase();
        });
    });

    // Exports
    window.SML_CORE = {
        waitForConfig,
        initializeSupabase,
        isAdmin: (email) => email === ADMIN_EMAIL
    };

})();
