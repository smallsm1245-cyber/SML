document.addEventListener('DOMContentLoaded', () => {
    const categoryList = document.getElementById('categoryList');
    const articleContent = document.getElementById('articleContent');
    const searchInput = document.getElementById('searchInput');
    const relatedTerms = document.getElementById('relatedTerms');
    const breadcrumb = document.getElementById('breadcrumb');

    // Initialize Sidebar
    function initSidebar() {
        categoryList.innerHTML = '';
        encyclopediaData.categories.forEach(category => {
            const categoryElement = document.createElement('li');
            categoryElement.className = 'category-item';
            
            let html = `<div class="category-title">${category.name}</div>`;
            category.terms.forEach(termId => {
                const term = encyclopediaData.articles[termId];
                if (term) {
                    html += `<li><a href="#" class="nav-link" data-id="${termId}">${term.title}</a></li>`;
                }
            });
            
            categoryElement.innerHTML = `<ul>${html}</ul>`;
            categoryList.appendChild(categoryElement);
        });

        // Add Click Events
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const termId = e.target.getAttribute('data-id');
                loadArticle(termId);
            });
        });
    }

    // Load Article
    function loadArticle(termId) {
        const article = encyclopediaData.articles[termId];
        if (!article) return;

        // Update Active Link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-id') === termId) {
                link.classList.add('active');
            }
        });

        // Update Breadcrumb
        breadcrumb.textContent = `Home / ${article.category} / ${article.title}`;

        // Render Content
        articleContent.innerHTML = `
            <div class="article-header">
                <div class="article-meta">
                    <span class="category-tag">${article.category}</span>
                    <div class="tags">
                        ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <h1>${article.title}</h1>
                <p class="summary-lead">${article.summary}</p>
            </div>
            <div class="article-body">
                ${article.content}
            </div>
        `;

        // Render Related Terms
        renderRelated(termId, article.category);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render Related Terms
    function renderRelated(currentTermId, currentCategory) {
        const related = Object.keys(encyclopediaData.articles)
            .filter(id => id !== currentTermId && encyclopediaData.articles[id].category === currentCategory)
            .slice(0, 3);

        if (related.length === 0) {
            relatedTerms.innerHTML = '';
            return;
        }

        let html = `<h3 class="related-title">관련 용어</h3><div class="term-grid">`;
        related.forEach(id => {
            const term = encyclopediaData.articles[id];
            html += `
                <div class="term-card" data-id="${id}">
                    <h4>${term.title}</h4>
                    <p>${term.summary}</p>
                </div>
            `;
        });
        html += `</div>`;
        relatedTerms.innerHTML = html;

        // Add Click Events for cards
        document.querySelectorAll('.term-card').forEach(card => {
            card.addEventListener('click', () => {
                const termId = card.getAttribute('data-id');
                loadArticle(termId);
            });
        });
    }

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
            initSidebar();
            return;
        }

        const filteredTerms = Object.keys(encyclopediaData.articles).filter(id => {
            const article = encyclopediaData.articles[id];
            return article.title.toLowerCase().includes(query) || 
                   article.summary.toLowerCase().includes(query);
        });

        categoryList.innerHTML = '<div class="category-title">검색 결과</div>';
        const resultsList = document.createElement('ul');
        filteredTerms.forEach(id => {
            const term = encyclopediaData.articles[id];
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="nav-link" data-id="${id}">${term.title}</a>`;
            resultsList.appendChild(li);
        });
        categoryList.appendChild(resultsList);

        // Re-attach events
        resultsList.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadArticle(link.getAttribute('data-id'));
            });
        });
    });

    // Initialize App
    initSidebar();
});
