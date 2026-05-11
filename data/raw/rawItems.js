import { students } from "../students.js";

const commonItems = [
  "크레딧",
  "청휘석",
  "초급 활동 보고서",
  "일반 활동 보고서",
  "상급 활동 보고서",
  "최상급 활동 보고서",
];

const schools = [
  "게헨나",
  "트리니티",
  "밀레니엄",
  "아비도스",
  "백귀야행",
  "산해경",
  "붉은겨울",
  "발키리",
  "SRT",
  "아리우스",
  "하이랜더",
  "와일드헌트",
];

const grades = ["초급", "일반", "상급", "최상급"];

const elephItems = students.map((student) => `${student.name}의 엘레프`);

export const itemsRaw = [
  ...commonItems,
  ...schools.flatMap((school) => [
    ...grades.map((grade) => `${school} ${grade} 기술 노트`),
    ...grades.map((grade) => `${school} ${grade} 전술교육 BD`),
  ]),
  ...elephItems,
];