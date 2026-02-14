// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - PDF REPORT MODULE
// Supabase 데이터를 PDF로 변환하는 관리자 전용 모듈
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📄 PDF Module loading...');

/**
 * Noto Sans KR Regular Font (Base64 Encoded)
 * 주의: 실제 운영 환경에서는 경량화된 서브셋 폰트를 사용하는 것을 권장합니다.
 * 현재는 데모용으로 축약된 Base64 문자열을 사용합니다.
 * 
 * TODO: Google Fonts에서 Noto Sans KR Regular TTF 다운로드 후
 * https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
 * 에서 변환하여 전체 Base64 문자열로 교체 필요
 */

// 실제 구현 시 여기에 Noto Sans KR의 전체 Base64 문자열이 들어갑니다.
// 파일 크기 제한으로 인해 현재는 기본 폰트 사용 후 추후 업데이트 예정
const NOTO_SANS_KR_BASE64 = null; // 실제 Base64 문자열로 교체 필요

/**
 * PDF에 한글 폰트 설정
 * @param {jsPDF} doc - jsPDF 인스턴스
 */
function setupKoreanFont(doc) {
    if (NOTO_SANS_KR_BASE64) {
        try {
            doc.addFileToVFS("NotoSansKR-Regular.ttf", NOTO_SANS_KR_BASE64);
            doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
            doc.setFont("NotoSansKR");
            console.log('✅ Noto Sans KR 폰트 로드 완료');
        } catch (error) {
            console.warn('⚠️ 커스텀 폰트 로드 실패, 기본 폰트 사용:', error);
            // 기본 폰트 사용 (한글은 유니코드로 표시되나 깨질 수 있음)
        }
    } else {
        console.warn('⚠️ 한글 폰트가 설정되지 않음. 폰트 깨짐이 발생할 수 있습니다.');
        // 임시 대안: 브라우저 기본 폰트 사용
    }
}

/**
 * 관리자 권한 확인
 * @param {Object} supabaseClient - Supabase 클라이언트 인스턴스
 * @returns {Promise<boolean>}
 */
async function checkAdminAuth(supabaseClient) {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
            throw new Error('로그인이 필요합니다.');
        }

        if (user.email !== window.ADMIN_EMAIL) {
            throw new Error('관리자 권한이 필요합니다.');
        }

        return true;
    } catch (error) {
        console.error('권한 확인 실패:', error);
        throw error;
    }
}

/**
 * Supabase에서 게시글 데이터 조회
 * @param {Object} supabaseClient - Supabase 클라이언트 인스턴스
 * @returns {Promise<Array>}
 */
async function fetchPostsData(supabaseClient) {
    try {
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select(`
                id,
                title,
                content,
                created_at,
                updated_at,
                is_private,
                category_id,
                categories(name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`📊 ${posts.length}개의 게시글 데이터 조회 완료`);
        return posts || [];
    } catch (error) {
        console.error('데이터 조회 실패:', error);
        throw new Error('게시글 데이터를 불러오는데 실패했습니다: ' + error.message);
    }
}

/**
 * 통계 데이터 계산
 * @param {Array} posts - 게시글 배열
 * @returns {Object}
 */
function calculateStats(posts) {
    const total = posts.length;
    const publicPosts = posts.filter(p => !p.is_private).length;
    const privatePosts = total - publicPosts;

    // 카테고리 중복 제거
    const categories = new Set(posts.map(p => p.categories?.name).filter(Boolean));

    return {
        total,
        public: publicPosts,
        private: privatePosts,
        categories: categories.size
    };
}

/**
 * 간단한 Markdown을 일반 텍스트로 변환 (제한적)
 * @param {string} markdown - Markdown 텍스트
 * @returns {string}
 */
function markdownToPlainText(markdown) {
    if (!markdown) return '';

    let text = markdown;

    // 제목 제거 (# ## ### 등)
    text = text.replace(/^#{1,6}\s+/gm, '');

    // 볼드/이탤릭 제거
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');

    // 링크 변환 [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // 이미지 제거
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '[이미지: $1]');

    // 코드 블록 제거
    text = text.replace(/```[\s\S]*?```/g, '[코드 블록]');
    text = text.replace(/`([^`]+)`/g, '$1');

    // 인용구 제거
    text = text.replace(/^>\s+/gm, '');

    // 리스트 마커 제거
    text = text.replace(/^[\*\-\+]\s+/gm, '• ');
    text = text.replace(/^\d+\.\s+/gm, '');

    // 수평선 제거
    text = text.replace(/^[\-\_\*]{3,}$/gm, '');

    // 여러 줄바꿈을 하나로
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

/**
 * PDF 문서 생성
 * @param {Array} posts - 게시글 배열
 * @param {Object} stats - 통계 데이터
 * @returns {jsPDF}
 */
function createPDFDocument(posts, stats) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // 한글 폰트 설정 시도
    setupKoreanFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // ═══════════════════════════════════════════════════
    // 헤더: 제목 및 생성 정보
    // ═══════════════════════════════════════════════════
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);

    // PDF 생성 시 한글이 깨지는 경우를 대비한 대체 텍스트
    const title = "SMALLSM Archive Report";
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    const now = new Date();
    const dateStr = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    doc.text(`Generated: ${dateStr}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Admin: ${window.ADMIN_EMAIL || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // ═══════════════════════════════════════════════════
    // 통계 정보
    // ═══════════════════════════════════════════════════
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Statistics', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total Posts: ${stats.total}`, margin, yPos);
    yPos += 5;
    doc.text(`Public: ${stats.public} | Private: ${stats.private}`, margin, yPos);
    yPos += 5;
    doc.text(`Categories: ${stats.categories}`, margin, yPos);
    yPos += 10;

    // 구분선
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ═══════════════════════════════════════════════════
    // 게시글 목록
    // ═══════════════════════════════════════════════════
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Posts', margin, yPos);
    yPos += 10;

    // 각 게시글 렌더링
    posts.forEach((post, index) => {
        // 페이지 넘김 체크
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
        }

        // 게시글 번호
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`#${index + 1}`, margin, yPos);
        yPos += 6;

        // 제목
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'bold');

        // 제목이 너무 길면 자르기
        const title = post.title || 'Untitled';
        const titleLines = doc.splitTextToSize(title, contentWidth - 10);
        doc.text(titleLines, margin + 5, yPos);
        yPos += titleLines.length * 6;

        doc.setFont(undefined, 'normal');

        // 메타 정보
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);

        const category = post.categories?.name || 'Uncategorized';
        const date = new Date(post.created_at).toLocaleDateString('ko-KR');
        const status = post.is_private ? 'Private' : 'Public';

        doc.text(`Category: ${category} | Date: ${date} | Status: ${status}`, margin + 5, yPos);
        yPos += 5;

        // 본문 내용 (간략화)
        if (post.content) {
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);

            // Markdown을 일반 텍스트로 변환
            const plainText = markdownToPlainText(post.content);

            // 본문이 너무 길면 일부만 표시
            const maxContentLength = 500;
            const contentPreview = plainText.length > maxContentLength
                ? plainText.substring(0, maxContentLength) + '...'
                : plainText;

            const contentLines = doc.splitTextToSize(contentPreview, contentWidth - 10);

            // 페이지 넘김 체크 (본문 추가 전)
            const requiredSpace = contentLines.length * 4 + 10;
            if (yPos + requiredSpace > pageHeight - 20) {
                doc.addPage();
                yPos = margin;
            }

            doc.text(contentLines, margin + 5, yPos);
            yPos += contentLines.length * 4;
        }

        yPos += 8;

        // 게시글 간 구분선
        if (index < posts.length - 1 && yPos < pageHeight - 30) {
            doc.setDrawColor(230, 230, 230);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;
        }
    });

    // ═══════════════════════════════════════════════════
    // 푸터 (모든 페이지)
    // ═══════════════════════════════════════════════════
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    return doc;
}

/**
 * 게시글 리포트 PDF 생성 및 다운로드
 * @param {Object} supabaseClient - Supabase 클라이언트 인스턴스
 */
async function generatePostsReport(supabaseClient) {
    try {
        console.log('📄 PDF 리포트 생성 시작...');

        // 1. jsPDF 로드 확인
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF 라이브러리가 로드되지 않았습니다.');
        }

        // 2. 관리자 권한 확인
        await checkAdminAuth(supabaseClient);

        // 3. 데이터 조회
        const posts = await fetchPostsData(supabaseClient);

        if (posts.length === 0) {
            alert('⚠️ 게시글이 없습니다.');
            return;
        }

        // 4. 통계 계산
        const stats = calculateStats(posts);

        // 5. PDF 생성
        const doc = createPDFDocument(posts, stats);

        // 6. 파일명 생성
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `SMALLSM_Archive_Report_${timestamp}.pdf`;

        // 7. 다운로드
        doc.save(filename);

        console.log('✅ PDF 리포트 생성 완료:', filename);

    } catch (error) {
        console.error('❌ PDF 생성 실패:', error);
        throw error;
    }
}

// 전역 함수로 노출
window.generatePostsReport = generatePostsReport;

console.log('✅ PDF Module loaded');
