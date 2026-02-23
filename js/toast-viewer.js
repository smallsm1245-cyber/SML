/**
 * toast-viewer.js
 * Centralized configuration for Toast UI Viewer integration.
 * Handles theme application and TOC generation.
 */

const PrivateLabViewer = {
    /**
     * Initialize a Toast UI Viewer instance
     * @param {string} elementId - ID of the container element
     * @param {string} content - Markdown content to render
     * @returns {object} Viewer instance
     */
    init: function (elementId, content) {
        const el = document.querySelector(elementId);
        if (!el) {
            console.error(`Element ${elementId} not found`);
            return null;
        }

        try {
            const viewer = new toastui.Editor.factory({
                el: el,
                viewer: true,
                initialValue: content,
                // Plugins can be added here if needed (e.g., code syntax highlighting)
            });

            // Apply custom adjustments after render if necessary
            return viewer;
        } catch (e) {
            console.error('Toast UI Viewer Init Error:', e);
            el.innerHTML = `<div class="error-message">Content load failed.</div>`;
            return null;
        }
    },

    /**
     * Generate Table of Contents (TOC) from Markdown headers
     * @param {string} content - Markdown content
     * @param {string} containerId - ID of the TOC container element
     */
    generateTOC: function (content, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return; // TOC container might not exist on all pages

        // improved regex to capture headers # to ######
        const headers = content.match(/^#{1,6}\s+.+$/gm);

        if (!headers || headers.length === 0) {
            container.innerHTML = '<p class="toc-empty">목차가 없습니다.</p>';
            return;
        }

        let html = '<ul class="toc-list">';

        headers.forEach(header => {
            const level = header.match(/^#+/)[0].length;
            const text = header.replace(/^#+\s+/, '');
            const slug = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣-]/g, ''); // Simple slugify

            // Verify if anchor exists or create a mechanism to scroll (Toast UI viewer creates IDs based on text)
            // Note: Toast UI Viewer auto-generates IDs for headers. We might need to match their logic or inject IDs.
            // For now, we assume simple text matching or just use scroll-to-text logic if possible.
            // Actually, Toast UI Viewer usually adds id attributes to headers. 
            // We'll trust the default behavior and match the ID generation.

            html += `<li class="toc-item toc-level-${level}">
                <a href="#${slug}" class="toc-link">${text}</a>
            </li>`;
        });

        html += '</ul>';
        container.innerHTML = html;

        // Add smooth scroll behavior
        const links = container.querySelectorAll('.toc-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                // Try to find the element by ID (Toast UI default)
                let target = document.getElementById(targetId);

                // Fallback: Try to find by text content if ID doesn't match
                if (!target) {
                    const headings = document.querySelectorAll('.toastui-editor-contents h1, .toastui-editor-contents h2, .toastui-editor-contents h3');
                    for (let h of headings) {
                        if (h.textContent.trim().toLowerCase().replace(/\s+/g, '-') === targetId) {
                            target = h;
                            break;
                        }
                    }
                }

                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
};

// Expose to global scope
window.PrivateLabViewer = PrivateLabViewer;
