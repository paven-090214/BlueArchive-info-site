export const studentSkillsByStudentId = {
  10: {
    studentId: 10,
    skills: {
      ex: {
        variants: [
          {
            id: "kei-ex-01",
            order: 1,
            name: "지금, 여기에 있는 나",
            icon: null,
            cost: null,
            trigger: null,
            changeRule: "조건에 따라 다른 EX 스킬로 변경될 수 있습니다.",
            effects: [
              {
                template: "스킬 효과 준비중",
                levels: {
                  1: {},
                },
              },
            ],
          },
        ],
      },
      basic: {
        variants: [
          {
            id: "grenade",
            order: 1,
            name: "저를 화나게 했다 이거죠?!",
            icon: null,
            cost: null,
            trigger: "일정 시간마다",
            changeRule: null,
            effects: [
              {
                template: "일정 시간마다 발동하는 효과입니다.",
                levels: {
                  1: {},
                },
              },
            ],
          },
        ],
      },
      passive: {
        variants: [
          {
            id: "kei-passive-01",
            order: 1,
            name: "저는 저항할 거예요!",
            icon: null,
            cost: null,
            trigger: null,
            changeRule: null,
            effects: [
              {
                template: "패시브 효과 준비중",
                levels: {
                  1: {},
                },
              },
            ],
          },
        ],
      },
      sub: {
        variants: [
          {
            id: "kei-sub-01",
            order: 1,
            name: "함께 걷는 친구",
            icon: null,
            cost: null,
            trigger: null,
            changeRule: null,
            effects: [
              {
                template: "서브 효과 준비중",
                levels: {
                  1: {},
                },
              },
            ],
          },
        ],
      },
    },
    needsReview: true,
  },
  15: {
    studentId: 15,
    skills: {
      ex: {
        variants: [],
      },
      basic: {
        variants: [],
      },
      passive: {
        variants: [],
      },
      sub: {
        variants: [],
      },
    },
    needsReview: true,
  },
};
