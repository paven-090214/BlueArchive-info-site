export const studentExclusiveWeaponsByStudentId = {
  10: {
    studentId: 10,
    weaponName: "전용무기 이름",
    imageUrl: "./images/weapons/kei-weapon.webp",
    effects: {
      2: {
        enhancedSkillType: "normal",
        enhancedSkillName: "약점 노리기+",
        description: "약점 노리기+로 강화",
        statIncreases: [
          {
            stat: "공격력",
            from: 339,
            to: 643,
            unit: "",
          },
          {
            stat: "공격력",
            from: 14,
            to: 26.6,
            unit: "%",
            prefix: "추가로",
          },
        ],
      },
      3: {
        description: "지역 적성 전투력을 SS로 강화",
      },
      4: {
        description: striker,
      },
    },
    needsReview: true,
  },
};