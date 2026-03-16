/**
 * Utility functions for SML-main
 */

const Utils = {
    /**
     * Extracts a clean summary from content, handling [ARCHIVE] tags specifically
     */
    extractSummary(content) {
        if (!content) return '';
        let plainText = content;

        // Fast path for ARCHIVE content: Try to extract the first line of [DEFINITION]
        if (plainText.includes('[ARCHIVE]')) {
            const defMatch = plainText.match(/\[DEFINITION\]\s*([\s\S]*?)(?=\[|$)/i);
            if (defMatch && defMatch[1]) {
                let defClean = defMatch[1].replace(/[#*_+~\[\]'"]/g, '').trim();
                const lines = defClean.split('\n').filter(l => l.trim());
                if (lines.length > 0) {
                    let firstLine = lines[0].trim();
                    return firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
                }
            }
        }

        // Fallback: Remove Archive format tags
        plainText = plainText.replace(/\[(ARCHIVE|DEFINITION|MECHANISMS|COMPARISON|TIP|ETHICS)\]/gi, '');
        plainText = plainText.replace(/<[^>]*>/g, '');
        plainText = plainText.replace(/[#*_+~\[\]]/g, '');
        plainText = plainText.replace(/"/g, '');
        plainText = plainText.replace(/\s+/g, ' ');
        plainText = plainText.trim();

        return plainText.length > 55 ? plainText.substring(0, 52) + '...' : plainText;
    },

    /**
     * Extracts pseudo-tags from summary text (Korean nouns)
     */
    extractTags(text) {
        if (!text) return '';
        const words = text.split(/\s+/)
            .map(w => w.replace(/[^가-힣]/g, ''))
            .filter(w => w.length >= 2 && w.length <= 4)
            .filter(w => !['하는', '입니다', '있는', '가장', '대한', '위해', '통해', '것이', '이러한', '그리고'].includes(w));
        const unique = [...new Set(words)].slice(0, 4);
        if (unique.length === 0) return '';
        return '<div class="dict-tags">' + unique.map(w => `<span class="dict-tag">#${w}</span>`).join('') + '</div>';
    },

    /**
     * Displays a toast notification
     */
    showToast(msg, type = 'info') {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm font-bold z-[200] transition-all transform translate-y-20 opacity-0';
            document.body.appendChild(toast);
        }

        toast.innerText = msg;
        toast.style.backgroundColor = type === 'success' ? 'var(--bg-paper)' : (type === 'error' ? 'var(--primary)' : 'var(--bg-paper-dark)');
        toast.style.color = type === 'success' ? 'var(--ink)' : (type === 'error' ? 'white' : 'var(--ink)');

        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    },

    formatJokboContent(html) {
        if (!html) return '';

        // 1. Convert leading numbers/letters to Circles (①, ②...)
        html = html.replace(/<p>(\(?([0-9]|[A-Z])\)?[\.\)]\s+)(.*?)(<\/p>)/gm, (match, p1, num, title, p2) => {
            const circles = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
            const label = circles[parseInt(num)] || (num + '.');
            return `<div class="section-title"><span>${label}</span> ${title}</div>`;
        });

        // 2. Highlights (Strong tags from **bold** -> Gold Highlighter)
        html = html.replace(/<strong>(.*?)<\/strong>/g, '<span class="highlight-gold">$1</span>');

        // 3. Underline keywords
        html = html.replace(/'([^']+)'/g, '<span class="keyword-red">$1</span>');
        html = html.replace(/`([^`]+)`/g, '<span class="keyword-blue">$1</span>');

        // 4. Admin tip detection (★ or Tip:)
        html = html.replace(/<p>(★|Tip:)(.*?)<\/p>/g, '<div class="admin-tip"><span class="tip-label">$1 주인장의 꿀팁</span>$2</div>');

        // 5. Academic Table styling
        html = html.replace(/<table>/g, '<table class="jokbo-table">');
        html = html.replace(/<thead>/g, '<thead class="bg-black/20">');
        html = html.replace(/<tr>\s*<th>(.*?)<\/th>\s*<th>(.*?)<\/th>\s*<\/tr>/g, (match, c1, c2) => {
            return `<tr><th class="th-red">${c1}</th><th class="th-blue">${c2}</th></tr>`;
        });

        return html;
    },

    convertInternalLinks(html) {
        if (!html) return '';
        return html.replace(/\[([^\]]+)\]/g, (match, term) => {
            return `<span class="internal-link" onclick="handleInternalLink('${term}')">${term}</span>`;
        });
    }
};

window.Utils = Utils;
