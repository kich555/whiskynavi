import { LineupItem } from "@/types/brand";

export const NAVI_SLIDES: LineupItem[] = [
  {
    id: "zodiac-signs",
    image: "/lineup/navi/zodiac-signs.png",
    caption: "십이지신도",
    size: "short",
  },
  {
    id: "korean-seasonal-events",
    image: "/lineup/navi/korean-seasonal-events.png",
    caption: "한국의 세시",
    size: "short",
  },
  {
    id: "community-release",
    image: "/lineup/navi/community-release.png",
    caption: "커뮤니티 릴리즈",
    size: "short",
  },
  {
    id: "ink-painting",
    image: "/lineup/navi/ink-painting.png",
    caption: "수묵화",
    size: "short",
  },
  {
    id: "illustration",
    image: "/lineup/navi/illustration.png",
    caption: "일러스트레이션",
    size: "short",
  },
];

export const TAILS_SLIDES: LineupItem[] = [
  {
    id: "retro",
    image: "/lineup/tails/retro.png",
    caption: "레트로",
    size: "short",
  },
  {
    id: "blended-malt",
    image: "/lineup/tails/blended-malt.png",
    caption: "블렌디드몰트",
    size: "short",
  },
  {
    id: "official",
    image: "/lineup/tails/official.png",
    caption: "시즌 정규",
    size: "short",
  },
  {
    id: "malt-the-rock",
    image: "/lineup/tails/malt-the-rock.png",
    caption: "몰트더락",
    size: "short",
  },
  {
    id: "seasonal",
    image: "/lineup/tails/seasonal.png",
    caption: "시즈널",
    size: "short",
  },
];

export const TRAIL_AND_TAIL_SLIDES: LineupItem[] = [
  {
    id: "bunnahabhain",
    image: "/lineup/trail/bunnahabhain.png",
    caption: "#5 Bunnahabhain",
    size: "long",
  },
  {
    id: "benriach",
    image: "/lineup/trail/benriach.png",
    caption: "#1 Benriach",
    size: "long",
  },
  {
    id: "secret-distillery",
    image: "/lineup/trail/secret-distillery.png",
    caption: "#2 Secret Distillery",
    size: "long",
  },
  {
    id: "croftengea",
    image: "/lineup/trail/croftengea.png",
    caption: "#3 Croftengea",
    size: "long",
  },
  {
    id: "elgin",
    image: "/lineup/trail/elgin.png",
    caption: "#4 Glen Elgin",
    size: "long",
  },
];

export const TOGETHER_IN_SPIRIT_SLIDES: LineupItem[] = [
  {
    id: "navi-together",
    image: "/lineup/together/navi-together.png",
    caption: "2025 경북 산불 피해 지원 (WHISKYNAVI)",
    size: "long",
  },
  {
    id: "tails-together",
    image: "/lineup/together/tails-together.png",
    caption: "2025 경북 산불 피해 지원 (THE WHISKYTALES)",
    size: "long",
  },
];

export const NAVI = {
  id: "위스키내비",
  bgImage: "/brands/bg-whiskynavi.png",
  icon: "/brands/icon-whisky-navi.png",
  iconSize: { width: 120, height: 151 },
  name: "위스키내비",
  subname: "대한민국 독립병입 시장의 선두주자",
  description: `당사의 대표 브랜드로, 가장 세분화된 제품 라인업을 자랑합니다.`,
};

export const TAILS = {
  id: "더위스키테일즈",
  bgImage: "/brands/bg-the-whisky-tails.png",
  icon: "/brands/icon-the-whisky-tails.png",
  iconSize: { width: 181, height: 110 },
  name: "더 위스키테일즈",
  subname: "스토리와 테마가 있는 서브컬처 라벨 위스키",
  description: `라벨의 자유도를 극대화하고, 서브컬처 문화의 감성과 취향이 반영된 독창적인 스토리와 테마를 담아냅니다.`,
};

export const TRAIL_AND_TAIL = {
  id: "트레일&테일",
  bgImage: "/brands/bg-trail-and-tail.png",
  icon: "/brands/icon-trail-and-tail.png",
  iconSize: { width: 186, height: 130 },
  name: "트레일앤테일",
  subname: "자신만의 취향과 세계는 간직되어야 하기에",
  description: `단순한 '위스키'를 넘어, 취향의 흔적을 따라가는 여정(Trail)과 그 안에 담긴 이야기(Tale)를 함께 담아냅니다.`,
};

export const TOGETHER_IN_SPIRIT = {
  id: "투게더인스피릿",
  bgImage: "/brands/bg-together-in-spirit.png",
  icon: "/brands/icon-together-in-spirit.png",
  iconSize: { width: 205, height: 110 },
  name: "투게더 인 스피릿",
  subname: "위스키로 함께하는 사회적 가치 창출",
  description: `주기적으로 사회적인 이슈를 선별하여 위스키 애호가들과 함께 기부 캠페인을 진행하고, 이를 기념하는 한정 보틀을 제작하여 의미 있는 가치를 공유합니다.`,
};
