// Tendency Comparison Script
(function () {
    'use strict';

    let supabaseClient = null;

    async function initialize() {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
            supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            await loadTendencies();
            await loadCategories(); // For sidebar consistency
        }
    }

    async function loadTendencies() {
        const grid = document.getElementById('tendencyGrid');

        try {
            const { data, error } = await supabaseClient
                .from('tendencies')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            renderGrid(data);

        } catch (error) {
            console.error('Tendencies load failed:', error);
            grid.innerHTML = '<div class="loading-state">기록을 불러오는데 실패했습니다.</div>';
        }
    }

    function renderGrid(data) {
        const grid = document.getElementById('tendencyGrid');
        grid.innerHTML = '';

        const tops = data.filter(t => t.type === 'top');
        const bottoms = data.filter(t => t.type === 'bottom');

        // Create pairs based on matched_id
        let pairs = [];
        let usedIds = new Set();

        // 1. Matched pairs
        tops.forEach(t => {
            if (t.matched_id) {
                const match = bottoms.find(b => b.id === t.matched_id);
                if (match) {
                    pairs.push({ top: t, bottom: match });
                    usedIds.add(t.id);
                    usedIds.add(match.id);
                }
            }
        });

        // 2. Unmatched items
        const remainingTops = tops.filter(t => !usedIds.has(t.id));
        const remainingBottoms = bottoms.filter(b => !usedIds.has(b.id));

        const maxLen = Math.max(remainingTops.length, remainingBottoms.length);
        for (let i = 0; i < maxLen; i++) {
            pairs.push({
                top: remainingTops[i] || null,
                bottom: remainingBottoms[i] || null
            });
        }

        pairs.forEach(pair => {
            const row = document.createElement('div');
            row.className = 'tendency-row';

            row.innerHTML = `
                <div class="tendency-cell top">
                    <span class="name">${pair.top ? pair.top.name : ''}</span>
                </div>
                <div class="tendency-cell bottom">
                    <span class="name">${pair.bottom ? pair.bottom.name : ''}</span>
                </div>
            `;
            grid.appendChild(row);
        });

        if (pairs.length === 0) {
            grid.innerHTML = '<div class="loading-state">등록된 성향이 없습니다.</div>';
        }
    }

    // Shared functions for sidebar (Simplified from main.js)
    async function loadCategories() {
        try {
            const { data: categories } = await supabaseClient
                .from('categories')
                .select('*')
                .eq('is_visible', true)
                .order('display_order', { ascending: true });

            const { data: posts } = await supabaseClient
                .from('archive_posts')
                .select('category_id')
                .eq('is_private', false);

            const counts = {};
            if (posts) posts.forEach(p => counts[p.category_id] = (counts[p.category_id] || 0) + 1);

            const nav = document.getElementById('categoryNav');
            if (nav && categories) {
                // Simplified render logic
                const roots = categories.filter(c => !c.parent_id);
                nav.innerHTML = roots.map(root => `
                    <li class="category-item">
                        <a href="index.html#category-${root.id}" class="category-link">
                            <span class="cat-name">${root.name}</span>
                            <span class="cat-count">(${counts[root.id] || 0})</span>
                        </a>
                    </li>
                `).join('');
            }
        } catch (e) { console.error(e); }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const checkConfig = setInterval(() => {
            if (window.SUPABASE_CONFIG) {
                clearInterval(checkConfig);
                initialize();
            }
        }, 100);
    });

})();
