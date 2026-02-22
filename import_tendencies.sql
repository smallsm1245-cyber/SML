-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - BDSM ROLES SYNC (22 TYPES)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 기존 데이터 초기화 (주의: 모든 기존 성향 데이터가 삭제됩니다)
DELETE FROM tendencies;

-- 2. 22가지 핵심 성향 데이터 삽입
INSERT INTO tendencies (type, name, sub_name, icon_class, description, display_order)
VALUES 
-- DOMINANT ROLES
('top', '도미넌트', 'Dominant', 'Crown', '상대방을 지배하고 이끄는 데서 만족감을 느끼는 성향입니다.', 1),
('top', '사디스트', 'Sadist', 'Zap', '상대에게 물리적 또는 심리적인 고통을 주며 즐거움을 얻는 성향입니다.', 2),
('top', '디그레이더', 'Degrader', 'MessageSquareOff', '상대에게 언어적, 심리적 굴욕을 주며 지배력을 느끼는 성향입니다.', 3),
('top', '브랫 테이머', 'Brat Tamer', 'Wand2', '반항적인 상대(Brat)를 훈육하고 길들이는 과정을 즐기는 성향입니다.', 4),
('top', '마스터 / 미스트리스', 'Master/Mistress', 'Sword', '상대방에 대한 완전한 권한과 소유권을 행사하는 주인 성향입니다.', 5),
('top', '헌터', 'Hunter', 'Crosshair', '상대를 추적하고 사냥하는 역할극에서 지배력을 확인하는 성향입니다.', 6),
('top', '대디 / 마미', 'Daddy/Mommy', 'UserRound', '보호자와 피보호자의 관계에서 훈육과 돌봄을 제공하는 성향입니다.', 7),
('top', '스팽커', 'Spanker', 'HandMetal', '손바닥이나 도구를 이용해 상대를 타격하며 쾌락을 얻는 성향입니다.', 8),
('top', '리거', 'Rigger', 'Scroll', '밧줄을 이용한 정교한 결박을 통해 상대를 구속하는 기술적 성향입니다.', 9),
('top', '오너', 'Owner', 'Key', '상대방을 자신의 소유물로 간주하고 책임을 지는 관계의 주인입니다.', 10),
('top', '보스', 'Boss', 'Briefcase', '명령과 보고, 위계질서가 명확한 관계를 선호하는 지배자입니다.', 11),

-- SUBMISSIVE ROLES
('bottom', '서브미시브', 'Submissive', 'User', '상대방의 지시에 복종하고 따르는 데서 편안함과 즐거움을 느낍니다.', 12),
('bottom', '브랫', 'Brat', 'ChevronDown', '일부러 장난스럽게 반항하며 지배자의 관심을 끌고 길들여지길 원하는 성향입니다.', 13),
('bottom', '슬레이브', 'Slave', 'Link', '자신의 모든 권한을 양도하고 헌신적으로 봉사하는 노예 성향입니다.', 14),
('bottom', '펫', 'Pet', 'Dog', '사람이 아닌 반려동물처럼 취급받으며 사랑받고 돌봄받길 원합니다.', 15),
('bottom', '리틀', 'Little', 'Baby', '심리적으로 어린아이의 상태가 되어 보호받고 어리광 부리는 것을 즐깁니다.', 16),
('bottom', '프레이', 'Prey', 'Bird', '잡히거나 정복당하는 연출에서 짜릿함을 느끼는 피포식자 성향입니다.', 17),
('bottom', '마조히스트', 'Masochist', 'HeartCrack', '물리적 또는 심리적 고통을 통해 쾌락을 느끼는 성향입니다.', 18),
('bottom', '디그레이디', 'Degradee', 'Info', '굴욕적인 언사나 상황을 통해 자신의 위치를 낮추는 데서 즐거움을 얻습니다.', 19),
('bottom', '스팽키', 'Spanky', 'Hand', '체벌을 받거나 타격을 당하는 행위에서 흥분을 느끼는 성향입니다.', 20),
('bottom', '로프 버니', 'Rope Bunny', 'Infinity', '밧줄에 묶여 부동의 상태가 되거나 구속되는 것을 즐깁니다.', 21),
('bottom', '서번트', 'Servant', 'Bell', '주인의 생활을 보조하고 수발을 들며 봉사하는 하인 성향입니다.', 22);

-- 확인 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 22 BDSM Roles synced successfully!';
END $$;
