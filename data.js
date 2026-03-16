const encyclopediaData = {
    "categories": [
        {
            "id": "essentials",
            "name": "Essentials (필수 개념)",
            "terms": ["bdsm", "consent", "ssc", "rack", "safeword"]
        },
        {
            "id": "roles",
            "name": "Roles (역할)",
            "terms": ["top", "bottom", "switch", "dominant", "submissive", "riggers"]
        },
        {
            "id": "activities",
            "name": "Activities (활동)",
            "terms": ["bondage", "impact_play", "sensory_deprivation", "edge_play"]
        }
    ],
    "articles": {
        "bdsm": {
            "title": "BDSM",
            "category": "Essentials",
            "tags": ["Definition", "Overview"],
            "summary": "BDSM은 결박(Bondage), 훈육(Discipline), 가학(Sadism), 피학(Masochism) 등을 포함하는 다양한 성적 선호와 관계 양식을 총칭합니다.",
            "content": `
                <p>BDSM은 다음의 네 가지 기호적 활동의 머리글자를 조합한 용어입니다:</p>
                <ul>
                    <li><strong>B&D:</strong> Bondage & Discipline (결박과 훈육)</li>
                    <li><strong>D&s:</strong> Dominance & submission (지배와 굴복)</li>
                    <li><strong>S&M:</strong> Sadism & Masochism (가학과 피학)</li>
                </ul>
                <h2>역사적 배경</h2>
                <p>BDSM이라는 용어는 1990년대 초반부터 널리 사용되기 시작했으며, 이전에는 가학피학성(S&M)이나 가죽 문화(Leather culture) 등 더 좁은 범위의 용어들로 불렸습니다.</p>
                <h2>철학</h2>
                <p>현대 BDSM 커뮤니티의 핵심 철학은 <strong>합의된 성인 간의 활동</strong>이라는 점입니다. 이는 단순히 성적 쾌락뿐만 아니라 신뢰, 소통, 그리고 권력의 역동성을 탐구하는 과정을 포함합니다.</p>
            `
        },
        "consent": {
            "title": "Consent (동의)",
            "category": "Essentials",
            "tags": ["Safety", "Ethics"],
            "summary": "BDSM 활동의 가장 중요한 토대는 명확하고 자발적인 동의입니다.",
            "content": `
                <p>동의는 단순히 '네'라고 말하는 것 이상의 복합적인 개념입니다. BDSM에서 동의는 다음과 같은 특징을 가져야 합니다:</p>
                <ul>
                    <li><strong>자발성:</strong> 압박이나 강요가 없는 상태에서 이루어져야 합니다.</li>
                    <li><strong>명확성:</strong> 모호하지 않고 구체적인 활동 범위를 포함해야 합니다.</li>
                    <li><strong>가역성:</strong> 언제든지 철회할 수 있어야 합니다.</li>
                </ul>
                <div class="safety-note">
                    <h3>주의사항</h3>
                    <p>약물이나 알코올의 영향 아래 있는 경우, 또는 심한 정서적 불안 상태에서는 진정한 동의가 이루어질 수 없다는 점을 명심하십시오.</p>
                </div>
            `
        },
        "ssc": {
            "title": "SSC",
            "category": "Essentials",
            "tags": ["Philosophy", "Protocol"],
            "summary": "Safe, Sane, Consensual (안전하고, 건전하며, 합의된)의 약자로, BDSM의 전통적인 안전 가이드라인입니다.",
            "content": `
                <p>SSC는 오랫동안 BDSM 커뮤니티의 표준적인 윤리 강령 역할을 해왔습니다.</p>
                <h2>세부 요소</h2>
                <ul>
                    <li><strong>Safe (안전):</strong> 물리적, 건강상 위험을 최소화합니다.</li>
                    <li><strong>Sane (건전):</strong> 현실적인 판단 하에 활동을 진행합니다.</li>
                    <li><strong>Consensual (합의):</strong> 모든 당사자가 활동에 동의합니다.</li>
                </ul>
            `
        },
        "rack": {
            "title": "RACK",
            "category": "Essentials",
            "tags": ["Philosophy", "Protocol"],
            "summary": "Risk-Aware Consensual Kink (위험을 인지한 합의된 킨크)의 약자로, SSC의 보완적 개념입니다.",
            "content": `
                <p>RACK은 어떤 활동도 완벽하게 'Safe'할 수 없다는 현실을 인정하는 것에서 출발합니다.</p>
                <p>참가자들이 발생 가능한 위험 요소들을 명확히 '인지'하고, 그 위험을 감수하기로 '합의'하는 과정을 강조합니다.</p>
            `
        },
        "safeword": {
            "title": "Safe Word (세이프 워드)",
            "category": "Essentials",
            "tags": ["Safety", "Tool"],
            "summary": "활동을 즉시 중단하거나 강도를 낮추기 위해 미리 약속된 단어입니다.",
            "content": `
                <p>세이프 워드는 플레이 중 실제 고통이나 불편함을 알리기 위해 사용됩니다.</p>
                <h2>신호등 시스템</h2>
                <ul>
                    <li><strong>Red (빨강):</strong> 즉시 중단. 모든 플레이를 멈추고 안전을 확인합니다.</li>
                    <li><strong>Yellow (노랑):</strong> 경고. 현재 활동의 강도를 낮추거나 주의가 필요함을 알립니다.</li>
                    <li><strong>Green (초록):</strong> 계속. 상태가 양호하며 활동을 계속해도 좋다는 신호입니다.</li>
                </ul>
            `
        },
        "dominant": {
            "title": "Dominant (도미넌트)",
            "category": "Roles",
            "tags": ["Role", "Power Exchange"],
            "summary": "관계나 활동에서 주도권을 가지고 통제하는 역할을 수행하는 사람입니다.",
            "content": `
                <p>줄여서 Dom/Domme로 부르기도 하며, 상대방에게 책임을 지고 지시를 내리는 역할을 합니다.</p>
            `
        },
        "submissive": {
            "title": "Submissive (서브미시브)",
            "category": "Roles",
            "tags": ["Role", "Power Exchange"],
            "summary": "상대방의 통제를 받아들이고 따르는 역할을 수행하는 사람입니다.",
            "content": `
                <p>줄여서 sub로 부르며, 자신의 주도권을 자발적으로 도미넌트에게 위임합니다.</p>
            `
        }
    }
};
