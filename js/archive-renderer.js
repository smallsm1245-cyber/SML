/**
 * Archive Content Renderer
 * Handles structured data parsing and Cinematic Dark UI rendering
 */

const ArchiveRenderer = {
    parseContent(raw) {
        if (!raw || !raw.includes('[ARCHIVE]')) return null;

        const data = { definition: null, mechanisms: [], comparison: [], tip: null, ethics: null };
        const sections = {
            definition: /\[DEFINITION\]\s*([\s\S]*?)(?=\[|$)/i,
            mechanisms: /\[MECHANISMS\]\s*([\s\S]*?)(?=\[|$)/i,
            comparison: /\[COMPARISON\]\s*([\s\S]*?)(?=\[|$)/i,
            tip: /\[TIP\]\s*([\s\S]*?)(?=\[|$)/i,
            ethics: /\[ETHICS\]\s*([\s\S]*?)(?=\[|$)/i
        };

        const defMatch = raw.match(sections.definition);
        if (defMatch) data.definition = defMatch[1].trim();

        const techMatch = raw.match(sections.mechanisms);
        if (techMatch) {
            data.mechanisms = techMatch[1].trim().split('\n')
                .filter(i => i.trim() && !i.startsWith('---'))
                .map(i => i.replace(/^[A-Z0-9][\.\)]\s*/i, '').trim());
        }

        const compMatch = raw.match(sections.comparison);
        if (compMatch) {
            data.comparison = compMatch[1].trim().split('\n')
                .filter(l => l.includes('|'))
                .map(l => {
                    const [c1, c2] = l.split('|').map(s => s.trim().replace(/^['">|]+|['">|]+$/g, '').trim());
                    return { c1, c2 };
                });
        }

        const tipMatch = raw.match(sections.tip);
        if (tipMatch) data.tip = tipMatch[1].trim();

        const ethicsMatch = raw.match(sections.ethics);
        if (ethicsMatch) data.ethics = ethicsMatch[1].trim();

        return data;
    },

    render(data) {
        if (!data) return '';
        let html = '<div class="archive-container animate-fade-in">';

        if (data.definition) {
            let processed = data.definition
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\+\+(.*?)\+\+/g, '<span class="archive-highlight">$1</span>')
                .replace(/'(.*?)'/g, '<span class="archive-keyword-red">$1</span>');

            const lines = processed.split('\n').filter(l => l.trim());
            const title = lines[0] || '';
            const body = lines.slice(1).join('<br>');

            html += `
                <div class="archive-section">
                    <div class="archive-section-header"><span class="archive-circle-num">1</span> 개념 정의 (Definition)</div>
                    <div class="archive-definition-content">
                        ${title ? `<span class="archive-quote-box">${title}</span>` : ''}
                        ${body}
                    </div>
                </div>
            `;
        }

        if (data.mechanisms.length > 0) {
            const listItems = data.mechanisms.map((m, idx) => {
                const parts = m.split(':');
                return `
                    <li class="archive-mechanism-item">
                        <span class="archive-mechanism-label">${String.fromCharCode(65 + idx)}.</span>
                        <div class="archive-mechanism-title">${parts[0].trim()}</div>
                    </li>
                    ${parts[1] ? `<div class="archive-mechanism-desc">${parts.slice(1).join(':').trim()}</div>` : ''}
                `;
            }).join('');
            html += `
                <div class="archive-section">
                    <div class="archive-section-header"><span class="archive-circle-num">2</span> 핵심 작동 메커니즘 (Key Mechanisms)</div>
                    <ul class="archive-mechanisms-list">${listItems}</ul>
                </div>
            `;
        }

        if (data.comparison.length > 0) {
            const rows = data.comparison.map(row => {
                const c1 = row.c1.replace(/\*\*(.*?)\*\*/g, '<span class="archive-highlight">$1</span>');
                const c2 = row.c2.replace(/\*\*(.*?)\*\*/g, '<span class="archive-highlight">$1</span>');
                return `<tr><td>${c1}</td><td>${c2}</td></tr>`;
            }).join('');
            html += `
                <div class="archive-section">
                    <div class="archive-section-header"><span class="archive-circle-num">3</span> 오해와 실제 비교 (Comparative Analysis)</div>
                    <table class="archive-comparison-table">
                        <thead><tr><th class="archive-th-false">COMMON MIS (오해)</th><th class="archive-th-true">DYNAMICS TRUTH (실제)</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }

        if (data.tip) {
            let processedTip = data.tip
                .replace(/\*\*(.*?)\*\*/g, '<strong class="archive-highlight">$1</strong>')
                .replace(/'(.*?)'/g, '<span class="archive-keyword-red">$1</span>')
                .replace(/^★\s*/, '');
            html += `
                <div class="archive-tip-container">
                    <div class="archive-tip-label"><i data-lucide="star" class="w-3 h-3 fill-current mr-1"></i>PROFESSOR'S CRITICAL TIP:</div>
                    <div class="archive-tip-text">"${processedTip}"</div>
                </div>
            `;
        }

        if (data.ethics) {
            const items = data.ethics.split('\n').filter(l => l.trim()).map(l => {
                const tagMatch = l.match(/\[(.*?)\]/);
                const rest = l.replace(/\[.*?\]/, '').trim();
                return `<div class="archive-ethics-item"><span class="archive-ethics-tag">${tagMatch ? tagMatch[0] : ''}</span>${rest}</div>`;
            }).join('');
            html += `
                <div class="archive-ethics-box">
                    <div class="archive-ethics-title">윤리적 책임 및 실전 주의사항</div>
                    ${items}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};

window.ArchiveRenderer = ArchiveRenderer;
