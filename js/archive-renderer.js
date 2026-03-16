/**
 * Archive Content Renderer
 * Handles structured data parsing and Cinematic Dark UI rendering
 */

const ArchiveRenderer = {
    parseContent(raw) {
        if (!raw || !raw.includes('[ARCHIVE]')) return null;

        // Reset data with sections and prologue
        const data = { prologue: '', sections: [] };
        
        // Find all tags in [TAG] format
        const tagRegex = /\[([A-Z가-힣0-9_\s]+)\]/g;
        let matches = [];
        let match;
        
        while ((match = tagRegex.exec(raw)) !== null) {
            matches.push({
                tag: match[1].trim(),
                index: match.index,
                fullTag: match[0]
            });
        }

        if (matches.length === 0) return { prologue: raw, sections: [], raw };

        // Everything before the first tag is prologue (excluding [ARCHIVE])
        const firstTagIndex = matches[0].index;
        data.prologue = raw.substring(0, firstTagIndex).replace('[ARCHIVE]', '').trim();

        // Extract content for each tag
        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const next = matches[i + 1];
            const end = next ? next.index : raw.length;
            
            const content = raw.substring(current.index + current.fullTag.length, end).trim();
            
            // Map known tags to structural data, others to generic sections
            const tagUpper = current.tag.toUpperCase();
            
            if (tagUpper === 'DEFINITION') {
                data.definition = content;
            } else if (tagUpper === 'MECHANISMS') {
                data.mechanisms = content.split('\n')
                    .filter(i => i.trim() && !i.startsWith('---'))
                    .map(i => i.replace(/^[A-Z0-9][\.\)]\s*/i, '').trim());
            } else if (tagUpper === 'COMPARISON') {
                data.comparison = content.split('\n')
                    .filter(l => l.includes('|'))
                    .map(l => {
                        const [c1, c2] = l.split('|').map(s => s.trim().replace(/^['">|]+|['">|]+$/g, '').trim());
                        return { c1, c2 };
                    });
            } else if (tagUpper === 'TIP') {
                data.tip = content;
            } else if (tagUpper === 'ETHICS') {
                data.ethics = content;
            } else if (tagUpper === 'SIDE') {
                data.side = content;
            } else if (tagUpper !== 'ARCHIVE') {
                // Custom tag: treat as a generic section
                data.sections.push({ title: current.tag, content });
            }
        }

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
                .replace(/\*\*/g, '') 
                .trim();
        };

        let html = '<article class="archive-container animate-fade-in relative">';
        
        if (data.side) {
            html += `<div class="marginalia">${format(data.side)}</div>`;
        }

        // 1. Prologue (Loose text at top)
        if (data.prologue) {
            html += `<div class="archive-role-description mb-6">${format(data.prologue)}</div>`;
        }

        // 2. Definition
        if (data.definition) {
            const rawLines = data.definition.split('\n').filter(l => l.trim());
            const title = format(rawLines[0]) || '';
            const body = rawLines.slice(1).map(l => format(l)).join(' ');

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

        // 3. Custom Sections (Unknown tags like [글 내용])
        if (data.sections && data.sections.length > 0) {
            data.sections.forEach(sec => {
                html += `
                    <section class="archive-section">
                        <h3 class="archive-section-header">${sec.title}</h3>
                        <div class="archive-role-description">${format(sec.content).replace(/\n/g, '<br>')}</div>
                    </section>
                `;
            });
        }

        // 4. Mechanisms
        if (data.mechanisms && data.mechanisms.length > 0) {
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

        // 5. Comparison
        if (data.comparison && data.comparison.length > 0) {
            const rows = data.comparison.map((row, idx) => {
                const c1 = format(row.c1).replace(/<strong>(.*?)<\/strong>/g, '<span class="archive-highlight">$1</span>');
                const c2 = format(row.c2).replace(/<strong>(.*?)<\/strong>/g, '<span class="archive-highlight">$1</span>');
                
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

        // 6. Tip
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

        // 7. Ethics
        if (data.ethics) {
            const items = data.ethics.split('\n').filter(l => l.trim()).map(l => {
                const tagMatch = l.match(/\[(.*?)\]/);
                const rest = format(l.replace(/\[.*?\]/, ''));
                return `<div class="archive-ethics-item"><span class="archive-ethics-tag">${tagMatch ? tagMatch[0] : ''}</span>${rest}</div>`;
            }).join('');
            html += `
                <section class="archive-ethics-box">
                    ${items}
                </section>
            `;
        }

        html += '</article>';
        return html;
    }
};;

window.ArchiveRenderer = ArchiveRenderer;
