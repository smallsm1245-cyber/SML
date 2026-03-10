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
                    const [c1, c2] = l.split('|').map(s => s.trim());
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
            const formatted = data.definition.replace(/\*\*(.*?)\*\*/g, '<span class="archive-highlight">$1</span>');
            html += `
                <div class="archive-section">
                    <div class="archive-definition">
                        <span class="archive-definition-quote">${formatted}</span>
                    </div>
                </div>
            `;
        }

        if (data.mechanisms.length > 0) {
            const listItems = data.mechanisms.map((m, idx) => `
                <li class="archive-mechanism-item">
                    <span class="archive-mechanism-label">${String.fromCharCode(65 + idx)}</span>
                    <span class="archive-mechanism-content">${m}</span>
                </li>
            `).join('');
            html += `
                <div class="archive-section">
                    <ul class="archive-mechanisms-list">${listItems}</ul>
                </div>
            `;
        }

        if (data.comparison.length > 0) {
            const rows = data.comparison.map(row => `
                <tr>
                    <td>${row.c1}</td>
                    <td>${row.c2}</td>
                </tr>
            `).join('');
            html += `
                <div class="archive-section">
                    <table class="archive-comparison-table">
                        <thead>
                            <tr>
                                <th class="archive-th-false">MISCONCEPTION</th>
                                <th class="archive-th-true">FACT</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }

        if (data.tip) {
            html += `
                <div class="archive-callout archive-callout-tip">
                    <span class="archive-callout-header">Professor's Tip</span>
                    ${data.tip}
                </div>
            `;
        }

        if (data.ethics) {
            html += `
                <div class="archive-callout archive-callout-ethics">
                    <span class="archive-callout-header">Ethical Responsibility</span>
                    ${data.ethics}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};

window.ArchiveRenderer = ArchiveRenderer;
