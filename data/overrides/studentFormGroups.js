// Form-change groups are UI-only overrides.
// Keep SchaleDB student records separate and register only reviewed student IDs here.
export const studentFormGroups = {
  "hoshino-rinsen": {
    groupName: "ホシノ（臨戦）",
    formIds: [10098, 10099],
    formNames: {
      10098: "방어형",
      10099: "공격형",
    },
    needsReview: false,
  },
};
