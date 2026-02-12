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

        const tops = data.sort((a, b) => a.display_order - b.display_order).filter(t => t.type === 'top');
        const bottoms = data.sort((a, b) => a.display_order - b.display_order).filter(t => t.type === 'bottom');

        // Match by current order for strict 1:1 visualization
        const maxLen = Math.max(tops.length, bottoms.length);
        let pairs = [];

        for (let i = 0; i < maxLen; i++) {
            pairs.push({
                top: tops[i] || null,
                bottom: bottoms[i] || null
            });
        }

        pairs.forEach(pair => {
            const row = document.createElement('div');
            row.className = 'tendency-row';

            const topCell = document.createElement('div');
            topCell.className = 'tendency-cell top';
            if (pair.top) {
                topCell.innerHTML = `<span class="name">${pair.top.name}</span>`;
                topCell.onclick = () => showDetail(pair.top, topCell);
            }

            const bottomCell = document.createElement('div');
            bottomCell.className = 'tendency-cell bottom';
            if (pair.bottom) {
                bottomCell.innerHTML = `<span class="name">${pair.bottom.name}</span>`;
                bottomCell.onclick = () => showDetail(pair.bottom, bottomCell);
            }

            row.appendChild(topCell);
            row.appendChild(bottomCell);
            grid.appendChild(row);
        });

        if (pairs.length === 0) {
            grid.innerHTML = '<div class="loading-state">등록된 성향이 없습니다.</div>';
        }
    }

    function showDetail(item, cell) {
        const pane = document.getElementById('detailPane');
        const placeholder = pane.querySelector('.detail-placeholder');
        const content = pane.querySelector('.detail-content');

        placeholder.style.display = 'none';
        content.style.display = 'block';

        content.querySelector('.detail-title').textContent = item.name;
        content.querySelector('.detail-type-badge').textContent = item.type.toUpperCase();
        content.querySelector('.detail-description').textContent = item.description || '상세 설명이 등록되지 않았습니다.';

        // Highlight active cell
        document.querySelectorAll('.tendency-cell').forEach(c => c.classList.remove('active-cell'));
        cell.classList.add('active-cell');

        // On mobile, scroll to detail
        if (window.innerWidth <= 768) {
            pane.scrollIntoView({ behavior: 'smooth' });
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
