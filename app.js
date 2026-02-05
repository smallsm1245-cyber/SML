// 초기화
const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
});

// 1. 카테고리 불러오기 (기획서 2.1 반영)
async function fetchCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_visible', true) // 공개된 것만
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    renderCategories(data);
}

// 2. 카테고리 화면 출력
function renderCategories(categories) {
    const listElement = document.getElementById('categoryList');
    listElement.innerHTML = ''; // 로딩 문구 제거

    categories.forEach(cat => {
        const li = document.createElement('li');
        li.textContent = cat.name;
        li.onclick = () => {
            console.log(`${cat.name} 클릭됨`);
            // 추후 게시글 목록 불러오기 함수 연결
        };
        listElement.appendChild(li);
    });
}
