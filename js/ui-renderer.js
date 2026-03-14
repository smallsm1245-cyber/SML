/**
 * SmallSM Dictionary - UI Rendering Component
 * Handles complex HTML templates for the bottom sheet
 */

const UIRenderer = {
    renderArchiveSheet(item, isAdmin) {
        const archiveData = ArchiveRenderer.parseContent(item.content);
        let html = ArchiveRenderer.render(archiveData);
        html = Utils.convertInternalLinks(html);

        return `
            <div class="archive-sheet-header p-6 border-b border-white/5 bg-paper-dark flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                            <i data-lucide="user" class="w-5 h-5 text-gold"></i>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-paper-dark ring-2 ring-green-500/20"></div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-black text-ink tracking-widest uppercase">SMALLSM</span>
                            <span class="px-1.5 py-0.5 rounded-sm bg-gold text-[8px] font-black text-paper uppercase">ADMIN</span>
                        </div>
                        <div class="text-[9px] font-bold text-ink-dim opacity-50 uppercase tracking-tighter mt-0.5">
                            Level 7 Archive Clearance
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="list-category-chip !m-0">${item.category}</span>
                    <button class="p-2 hover:bg-white/5 rounded-lg transition-colors bookmark-btn ${(window.bookmarkedIds || []).includes(item.id) ? 'text-gold' : 'text-ink-dim'}" 
                            onclick="window.toggleBookmark('${item.id}', this, event)">
                        <i data-lucide="star" class="w-4 h-4 ${(window.bookmarkedIds || []).includes(item.id) ? 'fill-current' : ''}"></i>
                    </button>
                    ${isAdmin ? `
                        <button class="p-2 hover:bg-gold/10 rounded-lg text-ink-dim hover:text-gold transition-colors" onclick="window.showEditForm('${item.id}')">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="p-6">
                ${html}
            </div>
        `;
    },

    renderJokboSheet(item, isAdmin) {
        let contentHtml = window.marked ? marked.parse(item.content) : item.content;
        contentHtml = Utils.formatJokboContent(contentHtml);
        contentHtml = Utils.convertInternalLinks(contentHtml);

        return `
            <div class="jokbo-header p-8 relative overflow-hidden">
                <div class="secret-stamp">TOP SECRET</div>
                <div class="jokbo-meta">CLASSIFIED ARCHIVE // ITEM #${item.id.substring(0, 8)}</div>
                <div class="flex justify-between items-start mb-6">
                    <h2 class="sheet-title">${item.term}</h2>
                    <div class="flex gap-2">
                         <button class="p-2 hover:bg-white/5 rounded-lg transition-colors bookmark-btn ${(window.bookmarkedIds || []).includes(item.id) ? 'text-gold' : 'text-ink-dim'}" 
                                onclick="window.toggleBookmark('${item.id}', this, event)">
                            <i data-lucide="star" class="w-5 h-5 ${(window.bookmarkedIds || []).includes(item.id) ? 'fill-current' : ''}"></i>
                        </button>
                        ${isAdmin ? `
                            <button class="p-2 hover:bg-gold/10 rounded-lg text-ink-dim hover:text-gold transition-colors" onclick="window.showEditForm('${item.id}')">
                                <i data-lucide="edit-3" class="w-5 h-5"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="jokbo-fields">
                    <div class="flex flex-col gap-1">
                        <span class="text-[9px] uppercase tracking-widest text-gold/50">Category</span>
                        <span class="jokbo-field">${item.category}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[9px] uppercase tracking-widest text-gold/50">Last Update</span>
                        <span class="jokbo-field">${new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div class="prose prose-invert max-w-none p-8 pt-0 body-text">
                ${contentHtml}
                ${item.tip ? `
                    <aside class="admin-tip mt-8">
                        <span class="tip-label">ARCHIVE ADVISORY:</span>
                        ${item.tip}
                    </aside>
                ` : ''}
            </div>
            <div class="jokbo-footer">SmallSM PRIVATE ARCHIVE - UNAUTHORIZED DISCLOSURE IS PROHIBITED</div>
        `;
    },

    renderEditForm(item) {
        return `
            <div class="p-8">
                <header class="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                    <h2 class="text-xl font-black text-gold">기록 수정</h2>
                    <button class="text-primary text-xs font-bold hover:underline" onclick="deleteItem('${item.id}')">항목 삭제</button>
                </header>
                <div class="space-y-6">
                    <div>
                        <label class="block text-[10px] font-black text-ink-dim uppercase tracking-widest mb-2">Term (Title)</label>
                        <input type="text" id="editTerm" class="edit-input !mb-0" value="${item.term}">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-ink-dim uppercase tracking-widest mb-2">Content (Markdown / Archive Format)</label>
                        <textarea id="editContent" class="edit-input !mb-0 min-h-[300px] leading-relaxed">${item.content}</textarea>
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button onclick="saveItem('${item.id}')" class="flex-1 py-4 bg-gold text-paper font-black rounded-xl hover:bg-gold-bright transition-all shadow-lg active:scale-95">변동사항 저장</button>
                        <button onclick="closeBottomSheet()" class="px-6 py-4 bg-paper-dark text-ink-dim font-bold rounded-xl hover:text-ink transition-colors">취소</button>
                    </div>
                </div>
            </div>
        `;
    }
};

window.UIRenderer = UIRenderer;
