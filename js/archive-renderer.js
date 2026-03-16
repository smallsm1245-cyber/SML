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

        const format = (text) => {
            if (!text) return '';
            let cleaned = text
                // 1. Initial safety: remove stray brackets and attribute-like patterns first
                .replace(/[<>]/g, '') 
                .replace(/[a-z-]+=".*?"/g, '')
                .replace(/text-\[.*?\]|tracking-.*?|border-.*?|font-.*?|uppercase|p-\d+|rounded-.*?|opacity-.*?|transition-.*?|group-hover:.*?/g, '');
            
            // 2. Apply markdown-style formatting
            return cleaned
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\+\+(.*?)\+\+/g, '<span class="archive-highlight">$1</span>')
                .replace(/'(.*?)'/g, '<span class="archive-keyword-red">$1</span>')
                .replace(/\*\*/g, '') // Strip remaining literal stars
                .trim();
        };

        let html = '<article class="archive-container animate-fade-in">';

        if (data.definition) {
            let processed = format(data.definition);
            const lines = processed.split('<br>').map(l => l.trim()).filter(l => l);
            // If the format(data.definition) didn't preserve <br>, split by \n first
            const rawLines = data.definition.split('\n').filter(l => l.trim());
            const title = format(rawLines[0]) || '';
            const rawTitle = rawLines[0] ? rawLines[0].replace(/[\*\+']/g, '').replace(/"/g, '&quot;').replace(/'/g, "\\'").trim() : '';
            const body = rawLines.slice(1).map(l => format(l)).join('<br>');

            html += `
                <section class="archive-section">
                    <h3 class="archive-section-header"><span class="archive-circle-num">1</span> 개념 정의</h3>
                    <div class="archive-definition-content">
                        ${title ? `<span class="archive-quote-box cursor-pointer relative group transition-all" title="클릭하여 복사" onclick="typeof Utils !== 'undefined' && Utils.copyToClipboard('${rawTitle}')">
                            <span class="relative z-10">${title}</span>
                            <span class="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-all bg-black/60 px-2 py-1.5 rounded-md flex items-center gap-1.5 text-[10px] uppercase font-black text-white tracking-[0.2em] border border-white/10 pointer-events-none scale-90 group-hover:scale-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-gold"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy</span>
                            </span>
                        </span>` : ''}
                        ${body}
                    </div>
                </section>
            `;
        }

        if (data.mechanisms.length > 0) {
            const listItems = data.mechanisms.map((m, idx) => {
                const parts = m.split(':');
                const title = format(parts[0]);
                let desc = parts.length > 1 ? format(parts.slice(1).join(':')) : '';

                return `
                    <li class="archive-mechanism-item">
                        <span class="archive-mechanism-label">${String.fromCharCode(65 + idx)}.</span>
                        <div class="archive-mechanism-title">${title}</div>
                    </li>
                    ${desc ? `<div class="archive-mechanism-desc">${desc}</div>` : ''}
                `;
            }).join('');
            html += `
                <section class="archive-section">
                    <h3 class="archive-section-header"><span class= "archive-circle-num">2</span> 핵심 작동 메커니즘</h3>
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
                    <h3 class="archive-section-header"><span class="archive-circle-num">3</span> 오해와 실제 비교</h3>
                    <table class="archive-comparison-table">
                        <thead><tr><th class="archive-th-false">COMMON MIS (오해)</th><th class="archive-th-true">DYNAMICS TRUTH (실제)</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </section>
            `;
        }

        if (data.tip) {
            let processedTip = format(data.tip).replace(/^★\s*/, '');
            html += `
                <aside class="archive-tip-container">
                    <div class="archive-tip-label"><i data-lucide="star" class="w-3 h-3 fill-current mr-1"></i>ADMIN'S CRITICAL TIP:</div>
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
                <section class="archive-ethics-box">
                    <h3 class="archive-ethics-title">윤리적 책임 및 실전 주의사항</h3>
                    ${items}
                </section>
            `;
        }

        html += '</article>';
        return html;
    }
};

window.ArchiveRenderer = ArchiveRenderer;
