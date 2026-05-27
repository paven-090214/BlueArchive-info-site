export const exclusiveWeapons = {
  kei: {
    studentId: "kei",

    name: "루미너스 노바",
    image: "./images/students/weapons/kei_weapons.webp",

    unlockEnhancedSkillStar: 2,

    enhancedSkill: {
      target: {
        slot: "passive",
        variantId: "kei-passive-01"
      },
      nameOverride: null,
      statLines: [
        {
          label: "최대 체력",
          before: 3168,
          after: 6020,
          unit: "",
          prefix: "",
          suffix: "증가"
        },
        {
          label: "치명 대미지",
          before: 14,
          after: 26.6,
          unit: "%",
          prefix: "추가로",
          suffix: "증가"
        }
      ]
    }
  }
};
