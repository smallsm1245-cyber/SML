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
            <div class="archive-sheet-header p-6 border-b border-primary/10 bg-paper flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                            <i data-lucide="shield" class="w-5 h-5 text-primary"></i>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-600 border-2 border-paper ring-2 ring-red-500/20"></div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-black text-ink tracking-widest uppercase">DUNGEON MASTER</span>
                            <span class="px-1.5 py-0.5 rounded-sm bg-primary text-[8px] font-black text-white uppercase">MASTER</span>
                        </div>
                        <div class="text-[9px] font-bold text-primary/40 uppercase tracking-tighter mt-0.5">
                            Forbidden Codex Access Level: Ω
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="list-category-chip !m-0">${item.category}</span>
                    <button class="p-2 hover:bg-white/5 rounded-lg transition-colors bookmark-btn ${(window.bookmarkedIds || []).includes(item.id) ? 'text-primary' : 'text-ink-dim'}" 
                            onclick="window.toggleBookmark('${item.id}', this, event)">
                        <i data-lucide="bookmark" class="w-4 h-4 ${(window.bookmarkedIds || []).includes(item.id) ? 'fill-current' : ''}"></i>
                    </button>
                    ${isAdmin ? `
                        <button class="p-2 hover:bg-primary/10 rounded-lg text-ink-dim hover:text-primary transition-colors" onclick="window.showEditForm('${item.id}')">
                            <i data-lucide="lock" class="w-4 h-4"></i>
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
                <div class="secret-stamp">MASTER'S NOTE</div>
                <div class="jokbo-meta">SUMMARY NOTE // ITEM #${item.id.substring(0, 8)}</div>
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
                        <span class="tip-label">주인장의 한마디:</span>
                        ${item.tip}
                    </aside>
                ` : ''}
            </div>
            <div class="jokbo-footer border-t border-primary/10 mt-8 pt-4 italic opacity-50 text-[10px]">본 기록은 금기된 고문서(Dungeon Codex)의 일부이며, 무단 배포를 엄격히 금합니다.</div>
        `;
    },

    renderEditForm(item) {
        return `
            <div class="p-8">
                <header class="flex justify-between items-center mb-8 pb-4 border-b border-primary/10">
                    <h2 class="text-xl font-black text-primary">코덱스 기입 수정</h2>
                    <button class="text-ink-dim text-xs font-bold hover:text-primary transition-colors" onclick="deleteItem('${item.id}')">항목 말소</button>
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
                        <button onclick="saveItem('${item.id}')" class="flex-1 py-4 bg-primary text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-95 uppercase tracking-widest">저장하기</button>
                        <button onclick="closeBottomSheet()" class="px-6 py-4 bg-paper-dark text-ink-dim font-bold rounded-xl hover:text-ink transition-colors">닫기</button>
                    </div>
                </div>
            </div>
        `;
    }
};

window.UIRenderer = UIRenderer;
