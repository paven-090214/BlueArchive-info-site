import { equipmentTypes } from "./equipment-types.js";

const equipmentBlueprintImageUrlsByType = {
  hat: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/81px-Equipment_Icon_Hat_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Hat_Tier10_Piece.png",
  },
  gloves: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/81px-Equipment_Icon_Gloves_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Gloves_Tier10_Piece.png",
  },
  shoes: {
    2: "./images/items/Equipment_Icon/81px-Equipment_Icon_Shoes_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Shoes_Tier10_Piece.png",
  },
  bag: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Bag_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/81px-Equipment_Icon_Bag_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/81px-Equipment_Icon_Bag_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/81px-Equipment_Icon_Bag_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Bag_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Bag_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Bag_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Bag_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Bag_Tier10_Piece.png",
  },
  badge: {
    2: "./images/items/Equipment_Icon/81px-Equipment_Icon_Badge_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Badge_Tier10_Piece.png",
  },
  hairpin: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Hairpin_Tier10_Piece.png",
  },
  charm: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/81px-Equipment_Icon_Charm_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Charm_Tier10_Piece.png",
  },
  necklace: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/81px-Equipment_Icon_Necklace_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Necklace_Tier10_Piece.png",
  },
  watch: {
    2: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier2_Piece.png",
    3: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier3_Piece.png",
    4: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier4_Piece.png",
    5: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier5_Piece.png",
    6: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier6_Piece.png",
    7: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier7_Piece.png",
    8: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier8_Piece.png",
    9: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier9_Piece.png",
    10: "./images/items/Equipment_Icon/Equipment_Icon_Watch_Tier10_Piece.png",
  },
};

export const equipmentMaterialTypes = [
  {
    id: "equipment-blueprint",
    displayName: "장비 설계도",
    needsReview: false,
  },
];

export const equipmentMaterials = equipmentTypes.flatMap((equipmentType) =>
  Array.from({ length: 9 }, (_, index) => {
    const tier = index + 2;
    const imageUrl = equipmentBlueprintImageUrlsByType[equipmentType.id]?.[tier] ?? null;

    return {
      id: `equipment-${equipmentType.id}-blueprint-t${tier}`,
      displayName: `${equipmentType.displayName} ${tier}T 설계도`,
      equipmentTypeId: equipmentType.id,
      materialTypeId: "equipment-blueprint",
      tier,
      imageUrl,
      needsReview: imageUrl === null,
    };
  }),
);
