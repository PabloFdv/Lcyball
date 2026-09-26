export type MapSize = '1v1' | '2v2' | '3v3' | '4v4';

export interface FieldDimensions {
  name: string;
  width: number;
  height: number;
  goalWidth: number;
  goalDepth: number;
  postRadius: number;
  numStripes: number;
  centerCircleR: number;
  penaltyBoxW: number;
  penaltyBoxH: number;
  goalBoxW: number;
  goalBoxH: number;
}

export const MAP_DIMENSIONS: Record<MapSize, FieldDimensions> = {
  '1v1': {
    name: '1v1 Clássico',
    width: 840,
    height: 420,
    goalWidth: 140,
    goalDepth: 55,
    postRadius: 7,
    numStripes: 14,
    centerCircleR: 90,
    penaltyBoxW: 140,
    penaltyBoxH: 260,
    goalBoxW: 60,
    goalBoxH: 180,
  },
  '2v2': {
    name: '2v2 Arena Média',
    width: 1050,
    height: 520,
    goalWidth: 160,
    goalDepth: 65,
    postRadius: 8,
    numStripes: 16,
    centerCircleR: 110,
    penaltyBoxW: 175,
    penaltyBoxH: 320,
    goalBoxW: 75,
    goalBoxH: 210,
  },
  '3v3': {
    name: '3v3 Estádio Amplo',
    width: 1260,
    height: 620,
    goalWidth: 180,
    goalDepth: 75,
    postRadius: 9,
    numStripes: 18,
    centerCircleR: 130,
    penaltyBoxW: 210,
    penaltyBoxH: 380,
    goalBoxW: 90,
    goalBoxH: 240,
  },
  '4v4': {
    name: '4v4 Coliseu Pro',
    width: 1470,
    height: 720,
    goalWidth: 200,
    goalDepth: 85,
    postRadius: 10,
    numStripes: 20,
    centerCircleR: 150,
    penaltyBoxW: 245,
    penaltyBoxH: 440,
    goalBoxW: 105,
    goalBoxH: 270,
  },
};

export const HAXBALL = {
  field: {
    width: 840,
    height: 420,
    goalWidth: 140,
    goalDepth: 55,
    postRadius: 7,
  },
  player: {
    radius: 17,
    mass: 2.2,
    invMass: 1 / 2.2,
    bCoef: 0.50,
    maxSpeed: 3.8,
    acceleration: 0.185,
    kickingAcceleration: 0.12,
    damping: 0.965,
    brakeDamping: 0.74, // Freio firme e preciso: para na hora ao soltar o analógico (zero deslize)
    counterBrakeFactor: 4.8, // Resposta instantânea e ágil ao mudar de direção
    minSpeedThreshold: 0.02,
  },
  ball: {
    radius: 10.0,
    mass: 1.0,
    invMass: 1.0,
    bCoef: 0.52,
    maxSpeed: 7.8,
    minSpeedThreshold: 0.020,
    damping: 0.9880,
    frictionHighSpeedDamping: 0.9935,
    frictionMidSpeedDamping: 0.9880,
    frictionLowSpeedDamping: 0.9720,
    critSpeedHigh: 3.2,
    critSpeedLow: 1.4,
  },
  kick: {
    basePower: 5.8,
    baseImpulse: 5.8,
    playerSpeedBonus: 0.42,
    playerVelocityContribution: 0.42,
    analogAimWeight: 0.35,
    analogBlendWeight: 0.35,
    contactNormalWeight: 0.65,
    geometricNormalWeight: 0.65,
    reachMargin: 6.5,
    cooldownTicks: 7,
    maxKickOutputSpeed: 7.8,
  },
  dribble: {
    softContactVelocityLimit: 1.75,
    softRestitution: 0.12,
    tangentialGrip: 0.18,
    penetrationRelaxation: 0.88,
  },
  wallBounce: {
    speedRetention: 0.94,
    baseNormalRestitution: 0.54,
    tangentFriction: 0.915,
    highSpeedAbsorbFactor: 0.045,
    consecutiveLossFactor: 0.86,
    playerWallRestitution: 0.20,
    playerWallTangent: 0.88,
  },
  post: {
    bCoef: 0.52,
    radius: 7,
  },
};
