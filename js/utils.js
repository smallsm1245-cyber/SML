// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ SMALLSM ARCHIVE - UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Wait for global configuration to be loaded from /api/config
 */
export function waitForConfig() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.supabase) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

/**
 * Format relative time (e.g., "5 minutes ago")
 */
export function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
}

/**
 * Basic Authentication Check
 * @param {object} supabaseClient - Initialized Supabase client
 * @param {string} adminEmail - Expected admin email
 */
export async function checkAuth(supabaseClient, adminEmail) {
    if (!supabaseClient) return false;

    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) return false;

        if (user.email !== adminEmail) {
            await supabaseClient.auth.signOut();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}
