# CSS 모바일 퍼스트 미디어 쿼리 변환 스크립트

Write-Host "`n📝 CSS 미디어 쿼리 변환 중...`n" -ForegroundColor Cyan

$cssPath = "css\style.css"
$content = Get-Content -Path $cssPath -Raw -Encoding UTF8

# 1. 모바일 헤더를 기본 표시로 변경
$content = $content -replace '\.mobile-header \{\s+display: none;', '.mobile-header {`r`n    display: flex; /* 모바일 기본 표시 */'

# 2. 기존 @media (max-width: 768px) 블록 제거 및 @media (min-width: 1024px) 추가
$desktopMedia = @"
/* ═══════════════════════════════════════════════════
   DESKTOP EXPANSION - 1024px 이상
   ═══════════════════════════════════════════════════ */
@media (min-width: 1024px) {
    /* 데스크탑: 모바일 헤더 숨김 */
    .mobile-header {
        display: none;
    }
    
    /* 데스크탑: 2단 레이아웃 */
    .app-container {
        flex-direction: row;
        padding-top: 0;
    }
    
    /* 데스크탑: 사이드바 고정 표시 */
    .sidebar {
        position: sticky;
        transform: translateX(0);
        width: var(--sidebar-width);
        min-width: var(--sidebar-width);
        background: var(--bg-panel);
        top: 0;
        height: 100vh;
        box-shadow: none;
    }
    
    /* 데스크탑: 메인 콘텐츠 확장 */
    .main-content {
        padding: 2rem;
    }
    
    /* 데스크탑: 콘텐츠 패널 스타일 */
    .content-panel {
        border-radius: 4px;
        border-left: 1px solid var(--glass-border);
        border-right: 1px solid var(--glass-border);
        padding: 3rem 4rem;
    }
    
    /* 데스크탑: 타이포그래피 확대 */
    h1 {
        font-size: 2.2rem;
    }
    
    h2 {
        font-size: 1.8rem;
    }
    
    h3 {
        font-size: 1.5rem;
    }
    
    .post-title {
        font-size: 2.2rem;
    }
    
    .post-content {
        font-size: 17px;
        line-height: 1.9;
    }
    
    /* 데스크탑: 호버 효과 */
    .category-link:hover {
        border-left-color: var(--primary-brass);
        background: rgba(206, 177, 128, 0.15);
        padding-left: 1.5rem;
    }
    
    .btn:hover {
        transform: translateY(-2px);
    }
    
    /* 데스크탑: 사이드바 오버레이 숨김 */
    .sidebar-overlay {
        display: none !important;
    }
}
"@

# 기존 @media (max-width: 768px) 블록 찾기 및 제거
$pattern = '@media \(max-width: 768px\) \{[^}]*(?:\{[^}]*\}[^}]*)*\}'
$content = $content -replace $pattern, $desktopMedia

# 파일 저장
$content | Set-Content -Path $cssPath -Encoding UTF8 -NoNewline

Write-Host "✅ CSS 미디어 쿼리 변환 완료!" -ForegroundColor Green
Write-Host "   - 모바일 헤더: 기본 표시" -ForegroundColor Yellow
Write-Host "   - 데스크탑 (1024px+): 2단 레이아웃, 사이드바 고정" -ForegroundColor Yellow
Write-Host "`n📁 수정된 파일: $cssPath`n" -ForegroundColor Cyan
