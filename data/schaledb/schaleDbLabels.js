import { SITE_LANGUAGES, normalizeSiteLanguage } from "../../utils/languagePreference.js";

export const SCHALE_SCHOOL_BY_ACADEMY_SLUG = {
  abydos: "Abydos",
  arius: "Arius",
  gehenna: "Gehenna",
  hyakkiyako: "Hyakkiyako",
  highlander: "Highlander",
  millennium: "Millennium",
  redwinter: "RedWinter",
  srt: "SRT",
  shanhaijing: "Shanhaijing",
  trinity: "Trinity",
  valkyrie: "Valkyrie",
  wildhunt: "WildHunt",
  etc: "ETC",
};

export const KO_LABELS = {
  school: {
    Abydos: "아비도스",
    Arius: "아리우스",
    Gehenna: "게헨나",
    Highlander: "하이랜더",
    Hyakkiyako: "백귀야행",
    Millennium: "밀레니엄",
    RedWinter: "붉은겨울",
    SRT: "SRT",
    Shanhaijing: "산해경",
    Trinity: "트리니티",
    Valkyrie: "발키리",
    WildHunt: "와일드헌트",
    ETC: "기타",
    Tokiwadai: "토키와다이",
    Sakugawa: "사쿠가와",
  },
  club: {
    AbydosStudentCouncil: "아비도스 학생회",
    AriusSqud: "아리우스 스쿼드",
    BlackTortoisePromenade: "현룡문",
    BookClub: "도서부",
    Class227: "227호 특별반",
    CleanNClearing: "C&C",
    Countermeasure: "대책위원회",
    Emergentology: "구급의학부",
    EmptyClub: "무소속",
    Endanbou: "연단방",
    Engineer: "엔지니어부",
    FoodService: "급양부",
    Fuuki: "선도부",
    GameDev: "게임개발부",
    Genryumon: "현룡문",
    GourmetClub: "미식연구회",
    HotSpringsDepartment: "온천개발부",
    HoukagoDessert: "방과후 디저트부",
    Hyakkayouran: "백화요란 분쟁조정위원회",
    Justice: "정의실현부",
    KnightsHospitaller: "구호기사단",
    KnowledgeLiberationFront: "지식해방전선",
    Kohshinjo68: "흥신소 68",
    LaborParty: "공사현장",
    MatsuriOffice: "마츠리운영관리부",
    Meihuayuan: "매화원",
    NinpoKenkyubu: "인법연구부",
    Onmyobu: "음양부",
    PandemoniumSociety: "만마전",
    PublicPeaceBureau: "공안국",
    RabbitPlatoon: "RABBIT 소대",
    RedwinterSecretary: "붉은겨울 사무국",
    RemedialClass: "보충수업부",
    SPTF: "초현상특무부",
    ShinySparkleSociety: "반짝반짝부",
    Shugyobu: "수행부",
    SisterHood: "시스터후드",
    TeaParty: "티파티",
    TheSeminar: "세미나",
    TrainingClub: "트레이닝부",
    TrinityVigilance: "트리니티 자경단",
    Veritas: "베리타스",
    anzenkyoku: "안전국",
  },
  squadType: {
    Main: "스트라이커",
    Support: "스페셜",
  },
  role: {
    DamageDealer: "딜러",
    Tanker: "탱커",
    Healer: "힐러",
    Supporter: "서포터",
    Vehicle: "탑승물",
  },
  position: {
    Front: "전열",
    Middle: "중열",
    Back: "후열",
  },
  attackType: {
    Explosion: "폭발",
    Pierce: "관통",
    Mystic: "신비",
    Sonic: "진동",
  },
  defenseType: {
    LightArmor: "경장갑",
    HeavyArmor: "중장갑",
    Unarmed: "특수장갑",
    ElasticArmor: "탄력장갑",
    CompositeArmor: "복합장갑",
  },
};

export function getSchaleLabel(type, value, language = SITE_LANGUAGES.KO) {
  if (value === null || value === undefined || value === "") {
    return "확인 필요";
  }

  if (normalizeSiteLanguage(language) !== SITE_LANGUAGES.KO) {
    return String(value);
  }

  return KO_LABELS[type]?.[value] ?? String(value);
}
