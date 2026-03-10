/**
 * Archive Content Renderer
 * Handles structured data parsing and Cinematic Dark UI rendering
 */

const ArchiveRenderer = {
    /**
     * Parses raw content into a structured archive object
     * Supports tags like [DEFINITION], [MECHANISMS], [COMPARISON], [TIP], [ETHICS]
     */
    parseContent(raw) {
        if (!raw || !raw.includes('[ARCHIVE]')) return null;

        const data = {
            definition: null,
            mechanisms: [],
            comparison: [],
            tip: null,
            ethics: null
        };

        // Regex for sections
        const sections = {
            definition: /\[DEFINITION\]\s*([\s\S]*?)(?=\[|$)/i,
            mechanisms: /\[MECHANISMS\]\s*([\s\S]*?)(?=\[|$)/i,
            comparison: /\[COMPARISON\]\s*([\s\S]*?)(?=\[|$)/i,
            tip: /\[TIP\]\s*([\s\S]*?)(?=\[|$)/i,
            ethics: /\[ETHICS\]\s*([\s\S]*?)(?=\[|$)/i
        };

        // Parse Definition
        const defMatch = raw.match(sections.definition);
        if (defMatch) data.definition = defMatch[1].trim();

        // Parse Mechanisms (A., B., C. or 1., 2., 3.)
        const techMatch = raw.match(sections.mechanisms);
        if (techMatch) {
            const items = techMatch[1].trim().split(/\n/);
            data.mechanisms = items
                .filter(i => i.trim())
                .map(i => i.replace(/^[A-Z0-9][\.\)]\s*/i, '').trim());
        }

        // Parse Comparison (Key: Value | Key: Value)
        const compMatch = raw.match(sections.comparison);
        if (compMatch) {
            const lines = compMatch[1].trim().split(/\n/);
            data.comparison = lines
                .filter(l => l.includes('|'))
                .map(l => {
                    const [c1, c2] = l.split('|').map(s => s.trim().replace(/^['">|]+|['">|]+$/g, '').trim());
                    return { c1, c2 };
                });
        }

        // Callouts
        const tipMatch = raw.match(sections.tip);
        if (tipMatch) data.tip = tipMatch[1].trim();

        const ethicsMatch = raw.match(sections.ethics);
        if (ethicsMatch) data.ethics = ethicsMatch[1].trim();

        return data;
    },

    /**
     * Renders the archive data into HTML string
     */
    render(data) {
        if (!data) return '';

        let html = '<div class="archive-container animate-fade-in">';

        if (data.definition) {
            // Process bold, tags and highlights
            let processed = data.definition
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[DEFINITION\]/i, '')
                .replace(/\+\+(.*?)\+\+/g, '<span class="archive-highlight">$1</span>')
                .replace(/'(.*?)'/g, '<span class="archive-keyword-red">$1</span>');

            const [title, ...body] = processed.split('\n');

            html += `
                <div class="archive-section">
                    <div class="archive-section-header">
                        <span class="archive-circle-num">1</span> 개념 정의 (Definition)
                    </div>
                    <div class="archive-definition-content">
                        ${title ? `<span class="archive-quote-box">${title}</span>` : ''}
                        ${body.join('<br>')}
                    </div>
                </div>
            `;
        }

        if (data.mechanisms.length > 0) {
            const listItems = data.mechanisms.map((m, idx) => {
                const parts = m.split(':');
                const title = parts[0] || '';
                const desc = parts.slice(1).join(':') || '';
                return `
                    <li class="archive-mechanism-item">
                        <span class="archive-mechanism-label">${String.fromCharCode(65 + idx)}</span>
                        <div class="flex-1">
                            <div class="archive-mechanism-title">${title}</div>
                        </div>
                    </li>
                    <div class="archive-mechanism-desc">${desc}</div>
                `;
            }).join('');
            html += `
                <div class="archive-section">
                    <div class="archive-section-header">
                        <span class="archive-circle-num">2</span> 핵심 작동 메커니즘 (Key Mechanisms)
                    </div>
                    <ul class="archive-mechanisms-list">${listItems}</ul>
                </div>
            `;
        }

        if (data.comparison.length > 0) {
            const rows = data.comparison.map(row => {
                const c1 = row.c1.replace(/\*\*(.*?)\*\*/g, '<span class="archive-highlight">$1</span>');
                const c2 = row.c2.replace(/\*\*(.*?)\*\*/g, '<span class="archive-highlight">$1</span>');
                return `
                    <tr>
                        <td>${c1}</td>
                        <td>${c2}</td>
                    </tr>
                `;
            }).join('');
            html += `
                <div class="archive-section">
                    <div class="archive-section-header">
                        <span class="archive-circle-num">3</span> 오해와 실제 비교 (Comparative Analysis)
                    </div>
                    <table class="archive-comparison-table">
                        <thead>
                            <tr>
                                <th class="archive-th-false">COMMON MIS (오해)</th>
                                <th class="archive-th-true">DYNAMICS TRUTH (실제)</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }

        if (data.tip) {
            let processedTip = data.tip
                .replace(/\*\*(.*?)\*\*/g, '<strong class="archive-highlight">$1</strong>')
                .replace(/'(.*?)'/g, '<span class="archive-keyword-red">$1</span>');

            html += `
                <div class="archive-tip-container">
                    <div class="archive-tip-label">
                        <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                        PROFESSOR'S CRITICAL TIP:
                    </div>
                    <div class="archive-tip-text">"${processedTip}"</div>
                </div>
            `;
        }

        if (data.ethics) {
            const items = data.ethics.split('\n').filter(l => l.trim()).map(l => {
                const tag = l.match(/\[(.*?)\]/);
                const rest = l.replace(/\[.*?\]/, '').trim();
                return `
                    <div class="archive-ethics-item">
                        <span class="archive-ethics-tag">${tag ? tag[0] : ''}</span>
                        ${rest}
                    </div>
                `;
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
