const { useState, useEffect, useMemo } = React;

const EncyclopediaApp = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [data, setData] = useState([]);
    const [activeDoc, setActiveDoc] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load data from separate JSON file with cache-busting
        fetch('data.json?v=' + Date.now())
            .then(res => res.json())
            .then(json => {
                setData(json);
                setActiveDoc(json[0]);
                setLoading(false);
            })
            .catch(err => console.error('Data loading failed:', err));
    }, []);

    useEffect(() => {
        // Initialize Lucide icons after render or data change
        if (window.lucide && !loading) {
            window.lucide.createIcons();
        }
    }, [activeDoc, isMobileMenuOpen, selectedCategory, searchTerm, loading]);

    const categories = useMemo(() => ['전체', ...new Set(data.map(item => item.category))], [data]);

    const filteredData = data.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#FDFDFD]">
                <div className="text-xl font-serif font-bold animate-pulse text-slate-300">
                    Loading Encyclopedia...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-[#0F172A] font-sans selection:bg-red-100">
            {/* Search Header */}
            <header className="sticky top-0 z-40 w-full bg-[#FDFDFD]/90 backdrop-blur-md border-b border-slate-200 px-4 py-3">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <i data-lucide="menu" className="w-6 h-6"></i>
                        </button>
                        <h1 className="font-serif text-xl font-bold tracking-tight text-[#0F172A] hidden sm:block">
                            SMALLSM <span className="text-[#B91C1C]">ENCYCLOPEDIA</span>
                        </h1>
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <i data-lucide="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"></i>
                        <input
                            type="text"
                            placeholder="용어 또는 개념 검색..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-[#B91C1C]/20 transition-all text-sm outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-screen-2xl mx-auto w-full flex">
                {/* Desktop Sidebar Index */}
                <aside className="hidden lg:block w-80 h-[calc(100vh-120px)] overflow-y-auto border-r border-slate-200 sticky top-[64px] p-6 lg:bg-[#FDFDFD]">
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B91C1C] mb-4">Categories</h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${selectedCategory === cat
                                            ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-200'
                                            : 'bg-white border border-slate-200 text-slate-400 hover:border-[#B91C1C] hover:text-[#B91C1C]'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-4">Document Index</h3>
                            <div className="space-y-1">
                                {filteredData.map(item => (
                                    <button
                                        key={item.code}
                                        onClick={() => setActiveDoc(item)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${activeDoc?.code === item.code
                                            ? 'bg-slate-100 text-[#0F172A] font-bold'
                                            : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span>{item.title}</span>
                                        <i data-lucide="chevron-right" className={`w-4 h-4 transition-transform ${activeDoc?.code === item.code ? 'translate-x-1 opacity-100 text-[#B91C1C]' : 'opacity-0 group-hover:opacity-100'}`}></i>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </aside>

                {/* Mobile Drawer */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                        <aside className="absolute inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-serif font-bold text-xl">Encyclopedia</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <i data-lucide="x" className="w-6 h-6"></i>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B91C1C] mb-4">Sections</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${selectedCategory === cat ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600'}`}
                                                onClick={() => { setSelectedCategory(cat); setIsMobileMenuOpen(false); }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-4">Terms</h4>
                                    {filteredData.map(item => (
                                        <button
                                            key={item.code}
                                            onClick={() => { setActiveDoc(item); setIsMobileMenuOpen(false); }}
                                            className={`w-full text-left p-4 rounded-xl text-sm flex items-center gap-4 transition-colors ${activeDoc?.code === item.code ? 'bg-slate-100' : 'bg-slate-50'}`}
                                        >
                                            <i data-lucide="book-open" className="w-4 h-4 text-[#B91C1C]"></i>
                                            <span className={activeDoc?.code === item.code ? 'font-bold' : ''}>{item.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {/* Document Viewer */}
                <main className="flex-1 min-h-screen p-6 md:p-12 lg:p-20 content-fade">
                    {activeDoc ? (
                        <article className="max-w-3xl mx-auto space-y-16">
                            <header className="space-y-6">
                                <div className="flex items-center gap-3 text-[#B91C1C] text-[11px] font-bold tracking-[0.2em] uppercase">
                                    <span className="bg-[#B91C1C]/10 px-2 py-0.5 rounded border border-[#B91C1C]/20">{activeDoc.code}</span>
                                    <span className="opacity-30">/</span>
                                    <span>{activeDoc.category}</span>
                                </div>
                                <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#0F172A] leading-[1.1] tracking-tight">
                                    {activeDoc.title}
                                </h2>
                                <div className="flex items-center gap-4 py-4 border-y border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">SM</div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">SMALLSM Archive Editorial</span>
                                        <span className="text-[10px] text-slate-400">Revised on {activeDoc.date}</span>
                                    </div>
                                </div>
                            </header>

                            <div className="space-y-12">
                                <section>
                                    <h4 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                                        <i data-lucide="info" className="w-4 h-4 text-[#B91C1C]"></i>
                                        Abstract
                                    </h4>
                                    <div className="p-8 bg-slate-50 rounded-3xl border-l-[6px] border-[#B91C1C] shadow-sm">
                                        <p className="text-xl md:text-2xl text-[#0F172A] leading-relaxed font-serif italic">
                                            "{activeDoc.definition}"
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                                        <i data-lucide="list" className="w-4 h-4 text-[#B91C1C]"></i>
                                        Core Principles
                                    </h4>
                                    <ul className="grid gap-4">
                                        {activeDoc.principles.map((pr, idx) => (
                                            <li key={idx} className="flex gap-5 p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#B91C1C]/30 hover:shadow-md transition-all group">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono group-hover:bg-[#B91C1C] transition-colors">
                                                    0{idx + 1}
                                                </span>
                                                <p className="text-lg text-slate-600 leading-relaxed">{pr}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="pt-12 border-t border-slate-100">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-8">Detailed Analysis</h4>
                                    <div className="prose prose-slate max-w-none text-slate-600 leading-[1.8] text-lg whitespace-pre-line font-sans">
                                        {activeDoc.analysis}
                                    </div>
                                </section>
                            </div>
                        </article>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-slate-300">
                            <i data-lucide="search" className="w-16 h-16 mb-6 opacity-20"></i>
                            <p className="text-sm font-medium">검색 결과가 없습니다.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Active Safety Status Bar */}
            <footer className="sticky bottom-0 left-0 right-0 z-50 bg-[#0F172A] text-white border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] backdrop-blur-lg">
                <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-20" />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-400">System Active</span>
                        </div>
                        <div className="hidden md:flex items-center gap-3 pl-6 border-l border-white/10 opacity-40">
                            <i data-lucide="shield" className="w-3.5 h-3.5"></i>
                            <span className="text-[10px] font-bold tracking-widest uppercase">Safe-Core Protocol v4.2</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-3 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20">
                            <i data-lucide="alert-triangle" className="w-3.5 h-3.5"></i>
                            <span className="hidden xs:block">Alert Widget</span>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EncyclopediaApp />);
