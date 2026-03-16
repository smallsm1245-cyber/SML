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

        return { ...data, raw };
    },

    render(data) {
        if (!data) return '';

        const format = (text) => {
            if (!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\+\+(.*?)\+\+/g, '<span class="archive-highlight">$1</span>')
                .replace(/~~(.*?)~~/g, '<span class="hand-strike">$1</span>')
                .replace(/__(.*?)__/g, '<span class="hand-underline">$1</span>')
                .replace(/'(.*?)'/g, '<span class="archive-keyword-red">$1</span>')
                .replace(/\*\*/g, '') // Strip remaining literal stars
                .trim();
        };

        const sections = {
            definition: /\[DEFINITION\]\s*([\s\S]*?)(?=\[|$)/i,
            mechanisms: /\[MECHANISMS\]\s*([\s\S]*?)(?=\[|$)/i,
            comparison: /\[COMPARISON\]\s*([\s\S]*?)(?=\[|$)/i,
            tip: /\[TIP\]\s*([\s\S]*?)(?=\[|$)/i,
            ethics: /\[ETHICS\]\s*([\s\S]*?)(?=\[|$)/i,
            side: /\[SIDE\]\s*([\s\S]*?)(?=\[|$)/i
        };

        const sideMatch = data.raw ? data.raw.match(sections.side) : null;
        const sideNote = sideMatch ? format(sideMatch[1]) : '';

        let html = '<article class="archive-container animate-fade-in relative">';
        
        if (sideNote) {
            html += `<div class="marginalia">${sideNote}</div>`;
        }

        if (data.definition) {
            let processed = format(data.definition);
            const lines = processed.split('<br>').map(l => l.trim()).filter(l => l);
            // If the format(data.definition) didn't preserve <br>, split by \n first
            const rawLines = data.definition.split('\n').filter(l => l.trim());
            const title = format(rawLines[0]) || '';
            const body = rawLines.slice(1).map(l => format(l)).join('<br>');

            html += `
                <div class="archive-section">
                    <h3 class="archive-section-header">장부 기입 (Ledger Entry)</h3>
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
                const title = format(parts[0]);
                let desc = parts[1] ? format(parts.slice(1).join(':')) : '';

                return `
                    <li class="archive-mechanism-item">
                        <span class="archive-mechanism-label">${idx + 1}.</span>
                        <div class="archive-mechanism-title">${title}</div>
                    </li>
                    ${desc ? `<div class="archive-mechanism-desc">${desc}</div>` : ''}
                `;
            }).join('');
            html += `
                <section class="archive-section">
                    <h3 class="archive-section-header">수행 메커니즘</h3>
                    <ul class="archive-mechanisms-list">${listItems}</ul>
                </section>
            `;
        }

        if (data.comparison.length > 0) {
            const rows = data.comparison.map(row => {
                const c1 = format(row.c1).replace(/<strong>(.*?)<\/strong>/g, '<span class="archive-highlight">$1</span>');
                const c2 = format(row.c2).replace(/<strong>(.*?)<\/strong>/g, '<span class="archive-highlight">$1</span>');
                return `<tr><td>${c1}</td><td>${c2}</td></tr>`;
            }).join('');
            html += `
                <section class="archive-section">
                    <h3 class="archive-section-header">비교 데이터</h3>
                    <table class="archive-comparison-table">
                        <thead><tr><th class="archive-th-false">COMMON ERROR</th><th class="archive-th-true">MASTER TRUTH</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </section>
            `;
        }

        if (data.tip) {
            let processedTip = format(data.tip).replace(/^★\s*/, '');
            html += `
                <aside class="archive-tip-container">
                    <div class="secret-stamp">LEDGER ENTRY</div>
                    <div class="archive-tip-label"><i data-lucide="shield-check" class="w-3 h-3 fill-current mr-1"></i>지침 (Instructions):</div>
                    <div class="archive-tip-text">"${processedTip}"</div>
                </aside>
            `;
        }

        if (data.ethics) {
            const items = data.ethics.split('\n').filter(l => l.trim()).map(l => {
                const tagMatch = l.match(/\[(.*?)\]/);
                const rest = format(l.replace(/\[.*?\]/, ''));
                return `<div class="archive-ethics-item"><span class="archive-ethics-tag">${tagMatch ? tagMatch[0] : ''}</span>${rest}</div>`;
            }).join('');
            html += `
                <div class="ethics-box">
                    <h3 class="ethics-title">장부 기록 시 주의사항 (Ledger Caution)</h3>
                    ${items}
                </div>
            `;
        }

        html += '</article>';
        return html;
    }
};

window.ArchiveRenderer = ArchiveRenderer;
