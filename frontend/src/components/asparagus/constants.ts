import { type TutorialSlide } from '../common/TutorialBanner';

export const GRID_SIZE = 4;
export const WIN_VALUE = 2048;

export const STAGES: Record<number, { name: string; emoji: string; bg: string; text: string }> = {
    1: { name: '씨앗', emoji: '🌱', bg: '#d4edda', text: '#2d6a4f' },
    2: { name: '새싹', emoji: '🌿', bg: '#b7e4c7', text: '#1b4332' },
    4: { name: '아기', emoji: '🥬', bg: '#95d5b2', text: '#1b4332' },
    8: { name: '잎새', emoji: '🌾', bg: '#74c69d', text: '#FFFFF8' },
    16: { name: '줄기', emoji: '🎋', bg: '#52b788', text: '#FFFFF8' },
    32: { name: '꽃', emoji: '🌼', bg: '#40916c', text: '#FFFFF8' },
    64: { name: '반짝', emoji: '✨', bg: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)', text: '#FFFFF8' },
    128: { name: '황금', emoji: '🏆', bg: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)', text: '#5a3d00' },
    256: { name: '마법', emoji: '🔮', bg: 'linear-gradient(135deg, #9d4edd 0%, #5a189a 100%)', text: '#FFFFF8' },
    512: { name: '정령', emoji: '🧚', bg: 'linear-gradient(135deg, #48bfe3 0%, #0077b6 100%)', text: '#FFFFF8' },
    1024: { name: '전설', emoji: '💎', bg: 'linear-gradient(135deg, #e0aaff 0%, #7b2cbf 100%)', text: '#FFFFF8' },
    2048: { name: '성검', emoji: '⚔️', bg: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)', text: '#FFFFF8' }
};

export const TUTORIAL_SLIDES: TutorialSlide[] = [
    {
        title: '🌱 아스파라거스를 키워보자',
        lines: ['화살표 버튼, 키보드, 모바일 스와이프 모두 OK!'],
        showArrows: true,
    },
    {
        title: '🌱 같은 단계를 합치면 성장해',
        lines: ['무럭무럭 잘 자란다구!'],
        highlight: { a: '새싹 🌿', b: '새싹 🌿', result: '아기 🥬' },
        showArrows: false,
    },
    {
        title: '🌱 아스파라거스를 키우기 힘들다면...',
        lines: [
            '비료를 사용해봐, 얼마 없으니 아껴써야 해!',
            '🔙 되돌리기: 실수를 했을 때 시간을 되돌려요.',
            '🔄 바꾸기: 두 타일의 위치를 서로 바꿔요.',
        ],
        showArrows: false,
    },
    {
        title: '🌱 여기 아스파라거스 씨앗, 잘 부탁해!',
        lines: ['아스파라거스를 끝까지 키우면 좋은 일이 생길지도?'],
        highlight: null,
        showArrows: false,
    },
];
