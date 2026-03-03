/**
 * ═══════════════════════════════════════════════════════
 *  POSITION MIGRATION TOOL
 *  성향백과 > 탑포지션 / 바텀포지션 서브카테고리 자동 분류
 * ═══════════════════════════════════════════════════════
 *
 * 사용법: 관리자 페이지에서 브라우저 콘솔에 아래 함수 호출:
 *   migratePositions()
 *
 * 동작:
 *  1. '성향백과' 카테고리를 찾음
 *  2. 없으면 '탑포지션', '바텀포지션' 서브카테고리 생성
 *  3. 성향백과 하위 포스트를 키워드 기반으로 분류하여 이동
 */

window.migratePositions = async function () {
    const db = window.supabaseClient;
    if (!db) {
        alert('❌ Supabase 클라이언트를 찾을 수 없습니다. 관리자 페이지에서 실행하세요.');
        return;
    }

    // ─── 1. 키워드 정의 ─────────────────────────────────────────
    const topKeywords = ['탑', '상위', '지배', '마스터', '대디', '마미', '새디스트', 'sadist', 'dominant', 'dom', 'daddy', 'mommy'];
    const bottomKeywords = ['바텀', '하위', '복종', '슬레이브', '섭', 'submissive', 'sub', 'slave', 'masochist'];

    const getPosition = (title) => {
        const t = title.toLowerCase();
        if (topKeywords.some(kw => t.includes(kw))) return 'top';
        if (bottomKeywords.some(kw => t.includes(kw))) return 'bottom';
        return 'other';
    };

    console.log('🚀 포지션 마이그레이션 시작...');

    try {
        // ─── 2. 성향백과 카테고리 찾기 ──────────────────────────────
        const { data: allCats } = await db.from('categories').select('*');
        const tendencycat = allCats.find(c => c.name === '성향백과' || c.name.includes('성향 백과'));
        if (!tendencycat) {
            alert('❌ 성향백과 카테고리를 찾을 수 없습니다. 카테고리 이름을 확인해주세요.');
            console.error('Available categories:', allCats.map(c => c.name));
            return;
        }
        console.log('✅ 성향백과 발견:', tendencycat.id, tendencycat.name);

        // ─── 3. 서브카테고리 확인/생성 ──────────────────────────────
        const existingSubs = allCats.filter(c => c.parent_id === tendencycat.id);

        let topCat = existingSubs.find(c => c.name.includes('탑'));
        let bottomCat = existingSubs.find(c => c.name.includes('바텀'));

        const maxOrder = allCats.reduce((max, c) => Math.max(max, c.display_order || 0), 0);

        if (!topCat) {
            console.log('📁 탑포지션 서브카테고리 생성 중...');
            const { data } = await db.from('categories').insert({
                name: '탑 포지션',
                parent_id: tendencycat.id,
                is_visible: true,
                display_order: maxOrder + 1
            }).select().single();
            topCat = data;
            console.log('✅ 탑포지션 생성:', topCat?.id);
        } else {
            console.log('ℹ️ 탑포지션 이미 존재:', topCat.id);
        }

        if (!bottomCat) {
            console.log('📁 바텀포지션 서브카테고리 생성 중...');
            const { data } = await db.from('categories').insert({
                name: '바텀 포지션',
                parent_id: tendencycat.id,
                is_visible: true,
                display_order: maxOrder + 2
            }).select().single();
            bottomCat = data;
            console.log('✅ 바텀포지션 생성:', bottomCat?.id);
        } else {
            console.log('ℹ️ 바텀포지션 이미 존재:', bottomCat.id);
        }

        // ─── 4. 성향백과 직속 포스트 가져오기 ───────────────────────
        const { data: posts } = await db
            .from('archive_posts')
            .select('id, title, category_id')
            .eq('category_id', tendencycat.id);

        if (!posts || posts.length === 0) {
            alert('ℹ️ 성향백과 직속 포스트가 없습니다. 이미 이동되었을 수 있습니다.');
            return;
        }

        console.log(`📝 이동 대상 포스트: ${posts.length}개`);

        // ─── 5. 포스트 분류 및 이동 ─────────────────────────────────
        let topMoved = 0, bottomMoved = 0, otherKept = 0;
        const results = [];

        for (const post of posts) {
            const pos = getPosition(post.title);

            if (pos === 'top' && topCat) {
                await db.from('archive_posts').update({ category_id: topCat.id }).eq('id', post.id);
                results.push(`⬆ [탑] ${post.title}`);
                topMoved++;
            } else if (pos === 'bottom' && bottomCat) {
                await db.from('archive_posts').update({ category_id: bottomCat.id }).eq('id', post.id);
                results.push(`⬇ [바텀] ${post.title}`);
                bottomMoved++;
            } else {
                results.push(`⚪ [기타] ${post.title} (성향백과에 유지)`);
                otherKept++;
            }
        }

        console.log('\n📊 마이그레이션 결과:');
        results.forEach(r => console.log(' ', r));
        console.log(`\n✅ 완료! 탑: ${topMoved}개, 바텀: ${bottomMoved}개, 기타(유지): ${otherKept}개`);

        alert(
            `✅ 마이그레이션 완료!\n\n` +
            `⬆ 탑 포지션으로 이동: ${topMoved}개\n` +
            `⬇ 바텀 포지션으로 이동: ${bottomMoved}개\n` +
            `⚪ 공통/기타 (성향백과 유지): ${otherKept}개\n\n` +
            `콘솔(F12)에서 상세 내역을 확인하세요.`
        );

    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        alert('❌ 오류 발생: ' + error.message);
    }
};

console.log('📦 PositionMigration 로드 완료. migratePositions() 를 실행하세요.');
