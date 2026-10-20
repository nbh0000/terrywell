<?php
// 카페24에 올릴 때 이 파일을 config.php 로 복사해 실제 값을 넣는다 (deploy.py 가 secrets.txt 로 만든다). config.php 는 저장소에 올리지 않는다.
return [
    // 카페24 DB: 호스트 localhost, DB 이름·아이디는 호스팅 아이디와 같다
    'db_host' => 'localhost',
    'db_port' => 3306,
    'db_name' => 'terrywell',
    'db_user' => 'terrywell',
    'db_password' => '',

    // 세션 서명용 긴 랜덤 문자열 (바꾸면 모든 회원이 로그아웃된다)
    'session_secret' => '',
    // 실제 사이트 주소 (간편 로그인 콜백·메일 링크·쿠키 판단)
    'site_url' => 'https://terrywell.kr',
    // true 면 개발 모드: 오류 메시지 노출, 비밀번호 재설정 링크 반환, oauth_fake 허용
    'dev' => false,
    // 메일 발신 주소, 관리자 알림 받을 주소(비우면 알림 없음)
    'mail_from' => 'sales@terrywell.kr',
    'notify_email' => '',

    // 간편 로그인 키. 콜백 주소: {site_url}/auth/callback/kakao|naver|google
    'oauth' => [
        'kakao' => ['client_id' => '', 'client_secret' => ''],
        'naver' => ['client_id' => '', 'client_secret' => ''],
        'google' => ['client_id' => '', 'client_secret' => ''],
    ],
    'oauth_fake' => false,

    // AI 이미지 생성: mock | openai | google
    'ai_provider' => 'mock',
    'ai_images_per_request' => 2,
    'ai_cost_per_image_krw' => null,
    'openai_api_key' => '',
    'openai_image_model' => 'gpt-image-1.5',
    'google_api_key' => '',
    'google_image_model' => 'gemini-nano-banana-2.1',

    // 포트원 V2 (셋 다 있어야 실제 결제창, 아니면 사이트 안 테스트 결제)
    'portone_store_id' => '',
    'portone_channel_key' => '',
    'portone_api_secret' => '',
];
