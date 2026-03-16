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
            const rawLines = data.definition.split('\n').filter(l => l.trim());
            const title = format(rawLines[0]) || '';
            const body = rawLines.slice(1).map(l => format(l)).join('<br>');

            html += `
                <section class="archive-section segment-definition">
                    <h3 class="archive-section-header">설명</h3>
                    <div class="archive-definition-content">
                        ${title ? `<div class="archive-primary-role-box">${title}</div>` : ''}
                        <div class="archive-role-description">${body}</div>
                    </div>
                </section>
            `;
        }

        if (data.mechanisms.length > 0) {
            const cards = data.mechanisms.map((m, idx) => {
                const parts = m.split(':');
                const title = format(parts[0]);
                let desc = parts[1] ? format(parts.slice(1).join(':')) : '';

                return `
                    <div class="archive-mechanism-card">
                        <div class="mechanism-header">
                            <span class="mechanism-index">${idx + 1}.</span>
                            <h4 class="mechanism-title">${title}</h4>
                        </div>
                        ${desc ? `<p class="mechanism-body">${desc}</p>` : ''}
                    </div>
                `;
            }).join('');
            
            html += `
                <section class="archive-section segment-mechanisms">
                    <h3 class="archive-section-header">주요 내용</h3>
                    <div class="archive-mechanisms-grid">${cards}</div>
                </section>
            `;
        }

        if (data.comparison.length > 0) {
            const rows = data.comparison.map((row, idx) => {
                const c1 = format(row.c1).replace(/<strong>(.*?)<\/strong>/g, '<span class="archive-highlight">$1</span>');
                const c2 = format(row.c2).replace(/<strong>(.*?)<\/strong>/g, '<span class="archive-highlight">$1</span>');
                
                // Special handling for the first row if it's a category header
                if (idx === 0 && (row.c1.includes('(') || row.c2.includes('('))) {
                    return `<tr class="comparison-sub-header"><td>${c1}</td><td>${c2}</td></tr>`;
                }
                
                return `<tr><td>${c1}</td><td>${c2}</td></tr>`;
            }).join('');
            
            html += `
                <section class="archive-section segment-comparison">
                    <h3 class="archive-section-header">비교 및 확인</h3>
                    <div class="archive-table-wrapper">
                        <table class="archive-comparison-table">
                            <thead>
                                <tr>
                                    <th class="archive-th-false">기존 생각</th>
                                    <th class="archive-th-true">핵심 포인트</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </section>
            `;
        }

        if (data.tip) {
            let processedTip = format(data.tip).replace(/^★\s*/, '');
            html += `
                <aside class="archive-premium-tip">
                    <div class="tip-header">
                        <i data-lucide="lightbulb" class="w-4 h-4 text-gold"></i>
                        <span>참고 메모</span>
                    </div>
                    <div class="tip-content">"${processedTip}"</div>
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
                <section class="archive-ethics-box">
                    <h3 class="archive-ethics-title">주의사항</h3>
                    ${items}
                </section>
            `;
        }

        html += '</article>';
        return html;
    }
};

window.ArchiveRenderer = ArchiveRenderer;
