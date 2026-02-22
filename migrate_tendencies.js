
const { createClient } = require('@supabase/supabase-js');
// Load credentials from environment or specific config if needed
// Note: In this environment, we might need to rely on the user running this or providing keys.
// For now, I'll update the script structure so the user can easily run it.

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INITIAL_DATA = [
    { type: 'top', name: '도미넌트', sub_name: 'Dominant', icon_class: 'Crown', description: '상대방을 지배하고 이끄는 데서 만족감을 느끼는 성향입니다.', display_order: 1 },
    { type: 'top', name: '사디스트', sub_name: 'Sadist', icon_class: 'Zap', description: '상대에게 물리적 또는 심리적인 고통을 주며 즐거움을 얻는 성향입니다.', display_order: 2 },
    { type: 'top', name: '디그레이더', sub_name: 'Degrader', icon_class: 'MessageSquareOff', description: '상대에게 언어적, 심리적 굴욕을 주며 지배력을 느끼는 성향입니다.', display_order: 3 },
    { type: 'top', name: '브랫 테이머', sub_name: 'Brat Tamer', icon_class: 'Wand2', description: '반항적인 상대(Brat)를 훈육하고 길들이는 과정을 즐기는 성향입니다.', display_order: 4 },
    { type: 'top', name: '마스터 / 미스트리스', sub_name: 'Master/Mistress', icon_class: 'Sword', description: '상대방에 대한 완전한 권한과 소유권을 행사하는 주인 성향입니다.', display_order: 5 },
    { type: 'top', name: '헌터', sub_name: 'Hunter', icon_class: 'Crosshair', description: '상대를 추적하고 사냥하는 역할극에서 지배력을 확인하는 성향입니다.', display_order: 6 },
    { type: 'top', name: '대디 / 마미', sub_name: 'Daddy/Mommy', icon_class: 'UserRound', description: '보호자와 피보호자의 관계에서 훈육과 돌봄을 제공하는 성향입니다.', display_order: 7 },
    { type: 'top', name: '스팽커', sub_name: 'Spanker', icon_class: 'HandMetal', description: '손바닥이나 도구를 이용해 상대를 타격하며 쾌락을 얻는 성향입니다.', display_order: 8 },
    { type: 'top', name: '리거', sub_name: 'Rigger', icon_class: 'Scroll', description: '밧줄을 이용한 정교한 결박을 통해 상대를 구속하는 기술적 성향입니다.', display_order: 9 },
    { type: 'top', name: '오너', sub_name: 'Owner', icon_class: 'Key', description: '상대방을 자신의 소유물로 간주하고 책임을 지는 관계의 주인입니다.', display_order: 10 },
    { type: 'top', name: '보스', sub_name: 'Boss', icon_class: 'Briefcase', description: '명령과 보고, 위계질서가 명확한 관계를 선호하는 지배자입니다.', display_order: 11 },
    { type: 'bottom', name: '서브미시브', sub_name: 'Submissive', icon_class: 'User', description: '상대방의 지시에 복종하고 따르는 데서 편안함과 즐거움을 느낍니다.', display_order: 12 },
    { type: 'bottom', name: '브랫', sub_name: 'Brat', icon_class: 'ChevronDown', description: '일부러 장난스럽게 반항하며 지배자의 관심을 끌고 길들여지길 원하는 성향입니다.', display_order: 13 },
    { type: 'bottom', name: '슬레이브', sub_name: 'Slave', icon_class: 'Link', description: '자신의 모든 권한을 양도하고 헌신적으로 봉사하는 노예 성향입니다.', display_order: 14 },
    { type: 'bottom', name: '펫', sub_name: 'Pet', icon_class: 'Dog', description: '사람이 아닌 반려동물처럼 취급받으며 사랑받고 돌봄받길 원합니다.', display_order: 15 },
    { type: 'bottom', name: '리틀', sub_name: 'Little', icon_class: 'Baby', description: '심리적으로 어린아이의 상태가 되어 보호받고 어리광 부리는 것을 즐깁니다.', display_order: 16 },
    { type: 'bottom', name: '프레이', sub_name: 'Prey', icon_class: 'Bird', description: '잡히거나 정복당하는 연출에서 짜릿함을 느끼는 피포식자 성향입니다.', display_order: 17 },
    { type: 'bottom', name: '마조히스트', sub_name: 'Masochist', icon_class: 'HeartCrack', description: '물리적 또는 심리적 고통을 통해 쾌락을 느끼는 성향입니다.', display_order: 18 },
    { type: 'bottom', name: '디그레이디', sub_name: 'Degradee', icon_class: 'Info', description: '굴욕적인 언사나 상황을 통해 자신의 위치를 낮추는 데서 즐거움을 얻습니다.', display_order: 19 },
    { type: 'bottom', name: '스팽키', sub_name: 'Spanky', icon_class: 'Hand', description: '체벌을 받거나 타격을 당하는 행위에서 흥분을 느끼는 성향입니다.', display_order: 20 },
    { type: 'bottom', name: '로프 버니', sub_name: 'Rope Bunny', icon_class: 'Infinity', description: '밧줄에 묶여 부동의 상태가 되거나 구속되는 것을 즐깁니다.', display_order: 21 },
    { type: 'bottom', name: '서번트', sub_name: 'Servant', icon_class: 'Bell', description: '주인의 생활을 보조하고 수발을 들며 봉사하는 하인 성향입니다.', display_order: 22 },
];

async function migrate() {
    console.log('🚀 Migrating to BDSM Gallery v2 (22 roles)...');

    try {
        // 1. Delete existing
        const { error: delError } = await supabase.from('tendencies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delError) throw delError;

        // 2. Insert new
        const { error: insError } = await supabase.from('tendencies').insert(INITIAL_DATA);
        if (insError) throw insError;

        console.log('✅ Migration successful! 22 roles inserted.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('Reminder: Run this first if sub_name column is missing:');
        console.log('ALTER TABLE tendencies ADD COLUMN sub_name TEXT;');
    }
}

migrate();
