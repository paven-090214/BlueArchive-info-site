import { normalizeStudentSkills } from "./skillAdapter.js";
import {
  createExclusiveWeaponStar4Effect,
  normalizeTerrainAptitude,
  normalizeTerrainBonus,
} from "../../../utils/studentDetailEffects.js";

export function normalizeStudent(rawStudent) {
  const baseStudent = {
    squadType: rawStudent.SquadType ?? null,
    attackType: rawStudent.BulletType ?? null,
  };
  const gear = normalizeGear(rawStudent.Gear);
  const exclusiveWeapon = normalizeExclusiveWeapon(rawStudent.Weapon, {
    ...baseStudent,
    weaponType: rawStudent.WeaponType ?? null,
  });

  return {
    id: rawStudent.Id,
    slug: rawStudent.PathName?.toLowerCase() ?? null,
    devName: rawStudent.DevName ?? null,
    name: rawStudent.Name ?? null,
    searchTags: rawStudent.SearchTags ?? [],

    school: rawStudent.School ?? null,
    club: rawStudent.Club ?? null,
    star: rawStudent.StarGrade ?? null,

    squadType: baseStudent.squadType,
    role: rawStudent.TacticRole ?? null,
    position: rawStudent.Position ?? null,

    attackType: baseStudent.attackType,
    defenseType: rawStudent.ArmorType ?? null,
    weaponType: rawStudent.WeaponType ?? null,
    cover: rawStudent.Cover ?? null,

    profile: rawStudent.ProfileIntroduction ?? null,
    birthday: rawStudent.Birthday ?? null,
    age: rawStudent.CharacterAge ?? null,
    height: rawStudent.CharHeightMetric ?? null,
    hobby: rawStudent.Hobby ?? null,
    illustrator: rawStudent.Illustrator ?? null,
    designer: rawStudent.Designer ?? null,
    voice: rawStudent.CharacterVoice ?? null,

    terrain: {
      street: normalizeTerrainAptitude(rawStudent.StreetBattleAdaptation),
      outdoor: normalizeTerrainAptitude(rawStudent.OutdoorBattleAdaptation),
      indoor: normalizeTerrainAptitude(rawStudent.IndoorBattleAdaptation),
    },

    skills: normalizeStudentSkills(rawStudent),
    weapon: rawStudent.Weapon ?? null,
    exclusiveWeapon,
    gear,
    uniqueItem: gear,
    equipmentSlots: rawStudent.Equipment ?? [],

    raw: rawStudent,
  };
}

function normalizeGear(rawGear) {
  if (!rawGear || typeof rawGear !== "object" || !rawGear.Name) {
    return null;
  }

  return {
    exists: true,
    name: rawGear.Name ?? null,
    desc: rawGear.Desc ?? null,
    released: Array.isArray(rawGear.Released) ? rawGear.Released : [],
    statTypes: Array.isArray(rawGear.StatType) ? rawGear.StatType : [],
    statValues: Array.isArray(rawGear.StatValue) ? rawGear.StatValue : [],
    tierUpMaterials: Array.isArray(rawGear.TierUpMaterial) ? rawGear.TierUpMaterial : [],
    tierUpMaterialAmounts: Array.isArray(rawGear.TierUpMaterialAmount) ? rawGear.TierUpMaterialAmount : [],
    raw: rawGear,
  };
}

function normalizeExclusiveWeapon(rawWeapon, student) {
  if (!rawWeapon || typeof rawWeapon !== "object") {
    return {
      name: null,
      desc: null,
      weaponType: student.weaponType ?? null,
      star3TerrainBonus: {
        terrain: null,
        rawTerrain: null,
        value: null,
        needsReview: true,
      },
      star4Effect: createExclusiveWeaponStar4Effect(student),
      raw: rawWeapon ?? null,
    };
  }

  return {
    name: rawWeapon.Name ?? null,
    desc: rawWeapon.Desc ?? null,
    weaponType: student.weaponType ?? null,
    statLevelUpType: rawWeapon.StatLevelUpType ?? null,
    stats: {
      attackPower: {
        level1: rawWeapon.AttackPower1 ?? null,
        level100: rawWeapon.AttackPower100 ?? null,
      },
      maxHp: {
        level1: rawWeapon.MaxHP1 ?? null,
        level100: rawWeapon.MaxHP100 ?? null,
      },
      healPower: {
        level1: rawWeapon.HealPower1 ?? null,
        level100: rawWeapon.HealPower100 ?? null,
      },
    },
    star3TerrainBonus: normalizeTerrainBonus(rawWeapon),
    star4Effect: createExclusiveWeaponStar4Effect(student),
    raw: rawWeapon,
  };
}
