/**
 * BDSM Compatibility Chart Logic
 */

(function () {
    let currentChartData = null;
    let isEditMode = false;

    // 성향 명칭 한글화
    const tops = ["도미넌트", "사디스트", "리거", "마스터/미스", "디그레이더", "오너", "브랫테이머", "헌터", "대디/마미", "스팽커"];
    const bottoms = ["서브미시브", "마조히스트", "로프버니", "슬레이브", "디그레이디", "펫", "브랫", "프레이", "리들", "스팽키"];

    const states = [
        { label: "최적", class: "cell-optimal" },
        { label: "좋음", class: "cell-good" },
        { label: "무난한", class: "cell-fine" },
        { label: "그닥", class: "cell-bad" },
        { label: "최악", class: "cell-worst" }
    ];

    const initialData = [
        ["최적", "그닥", "그닥", "좋음", "그닥", "좋음", "그닥", "그닥", "좋음", "최악"],
        ["무난한", "최적", "그닥", "좋음", "무난한", "최악", "최악", "무난한", "최악", "좋음"],
        ["무난한", "그닥", "최적", "좋음", "최악", "그닥", "최악", "그닥", "그닥", "최악"],
        ["좋음", "무난한", "그닥", "최적", "그닥", "무난한", "최악", "최악", "그닥", "최악"],
        ["그닥", "무난한", "최악", "무난한", "최적", "최악", "최악", "무난한", "최악", "무난한"],
        ["좋음", "최악", "무난한", "그닥", "최악", "최적", "무난한", "최악", "무난한", "최악"],
        ["무난한", "그닥", "최적", "그닥", "최악", "무난한", "최적", "최악", "좋음", "그닥"],
        ["그닥", "좋음", "최악", "무난한", "좋음", "최악", "그닥", "최적", "최악", "좋음"],
        ["무난한", "최악", "그닥", "좋음", "최악", "좋음", "무난한", "최악", "최적", "최악"],
        ["최악", "좋음", "최악", "좋음", "최악", "최악", "최악", "최악", "최악", "최적"]
    ];

    function init() {
        // Wait for Supabase to be ready from core.js
        window.SML_CORE.waitForConfig(async () => {
            // Load data from DB
            currentChartData = await loadChartData();
            renderChart();
            loadCategories();

            // Check if admin to show Edit button
            if (window.supabaseClient) {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user && window.SML_CORE.isAdmin(user.email)) {
                    // Note: adminToolsContainer might not exist in wiki-layout version, 
                    // usually handles via inline toolbar but let's keep logic safe
                    const herramientas = document.getElementById('adminToolsContainer');
                    if (herramientas) herramientas.style.display = 'flex';
                    setupEditToggle();
                }
            }
        });
    }

    async function loadCategories() {
        if (!window.supabaseClient) return;
        try {
            const { data: categories } = await window.supabaseClient
                .from('categories')
                .select('*')
                .eq('is_visible', true)
                .order('display_order', { ascending: true });

            const { data: posts } = await window.supabaseClient
                .from('archive_posts')
                .select('category_id, is_private')
                .eq('is_private', false);

            const counts = {};
            if (posts) {
                posts.forEach(p => {
                    counts[p.category_id] = (counts[p.category_id] || 0) + 1;
                });
            }
            renderSidebarNav(categories || [], counts);
        } catch (e) {
            console.error('BDSM Chart category load failed:', e);
        }
    }

    function renderSidebarNav(categories, counts) {
        const nav = document.getElementById('categoryNav');
        if (!nav) return;

        const isDesktop = window.innerWidth >= 1024;
        const backButton = `
            <li class="mb-4">
                <a href="index.html" 
                   class="flex items-center gap-2 text-xs font-bold text-[var(--wiki-gold)] hover:text-white transition-colors uppercase tracking-widest font-mono">
                    <i data-lucide="arrow-left" class="w-3 h-3"></i> Back to Archive
                </a>
            </li>
        `;

        nav.innerHTML = `
            ${isDesktop ? backButton : ''}
            <div class="wiki-nav-header mb-4">
                <h2 class="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase font-mono">Archive Categories</h2>
            </div>
            ${categories.filter(c => !c.parent_id).map(root => `
                <li class="category-item mb-2">
                    <a href="index.html#category-${root.id}" class="text-sm text-slate-400 hover:text-[var(--wiki-gold)] transition-colors">
                        ${root.name} <span class="text-[10px] opacity-50 ml-1">(${counts[root.id] || 0})</span>
                    </a>
                </li>
            `).join('')}
        `;
        if (window.lucide) window.lucide.createIcons();
    }



    async function loadChartData() {
        try {
            const { data, error } = await window.supabaseClient
                .from('settings')
                .select('value')
                .eq('key', 'bdsm_chart_data')
                .single();

            if (data && data.value) {
                return JSON.parse(data.value);
            }
        } catch (e) {
            console.log("No custom chart data found, using fallback");
        }
        return JSON.parse(JSON.stringify(initialData)); // deep copy fallback
    }

    function renderChart() {
        const colHeaders = document.getElementById('colHeaders');
        colHeaders.innerHTML = `<th class="w-32 text-[#d1d5db] text-[11px] tracking-widest font-sans">TYPE</th>` + bottoms.map(b => `<th class="text-[11px] tracking-tighter text-[#b68d6a] font-sans">${b}</th>`).join('');

        const chartBody = document.getElementById('chartBody');
        chartBody.innerHTML = '';

        tops.forEach((top, rowIndex) => {
            const tr = document.createElement('tr');
            let cellsHtml = `<td class="row-header text-[11px] font-sans">${top}</td>`;

            currentChartData[rowIndex].forEach((cellText, colIndex) => {
                const state = states.find(s => s.label === cellText) || states[2];
                cellsHtml += `<td class="${state.class} font-sans" data-row="${rowIndex}" data-col="${colIndex}">${cellText}</td>`;
            });

            tr.innerHTML = cellsHtml;
            chartBody.appendChild(tr);
        });

        // Event delegation for cell clicking
        chartBody.addEventListener('click', handleCellClick);
    }

    function handleCellClick(e) {
        // Only allow clicking if our manual Edit Mode button says CONFIRM
        // Global admin-inline.js edit mode also has to be considered if we want full integration,
        // but the independent "EDIT MODE" toggle is requested by user.
        if (!isEditMode) return;

        const td = e.target.closest('td');
        if (!td || td.classList.contains('row-header')) return;

        const rowIndex = td.dataset.row;
        const colIndex = td.dataset.col;
        const currentText = td.innerText;

        const currentIndex = states.findIndex(s => s.label === currentText);
        const nextIndex = (currentIndex + 1) % states.length;
        const nextState = states[nextIndex];

        // Update UI
        states.forEach(s => td.classList.remove(s.class));
        td.classList.add(nextState.class);
        td.innerText = nextState.label;

        // Update data matrix
        currentChartData[rowIndex][colIndex] = nextState.label;
    }

    function setupEditToggle() {
        const toggleBtn = document.getElementById('toggleEdit');
        const chartTable = document.getElementById('compChart');
        const editStatus = document.getElementById('editStatus');

        toggleBtn.addEventListener('click', async function () {
            if (isEditMode) {
                // Switching from EDIT -> VIEW (Saving)
                toggleBtn.innerText = "저장 중...";
                await saveChartData(currentChartData);

                isEditMode = false;
                toggleBtn.innerText = "EDIT MODE";
                toggleBtn.classList.remove('border-amber-600', 'text-amber-500');
                chartTable.classList.remove('edit-mode');
                editStatus.classList.add('hidden');
                alert("궁합표가 저장되었습니다.");
            } else {
                // Switching from VIEW -> EDIT
                isEditMode = true;
                toggleBtn.innerText = "CONFIRM";
                toggleBtn.classList.add('border-amber-600', 'text-amber-500');
                chartTable.classList.add('edit-mode');
                editStatus.classList.remove('hidden');
            }
        });
    }

    async function saveChartData(dataMatrix) {
        try {
            const { error } = await window.supabaseClient.from('settings').upsert({
                key: 'bdsm_chart_data',
                value: JSON.stringify(dataMatrix),
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

            if (error) throw error;
        } catch (e) {
            console.error('Failed to save chart data:', e);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    // Standard DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
