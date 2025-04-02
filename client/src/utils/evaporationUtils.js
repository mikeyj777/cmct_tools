import * as consts from './consts';

//evaporationUtils.js

// Constants
const DIFFUSIVITY_WATER = 2.4e-5; // m2/s
const MW_WATER = 18.015; // g/mol
const KINEMATIC_VISCOSITY_AIR = 1.5e-5; // m2/s
const R = 8314; // J/kmol/K
const TEMP_K = 298.15; // K
const PI = Math.PI;
const LB_PER_KG = 2.20462;

export const getAverageLiquidDensityKgM3 = (components, physProps, tempK = TEMP_K) => {
  let totMass = 0;
  let totVol = 0;
  const badChems = [];
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const mass = comp.amount * comp.molecularWeight;
    const cas_no = comp.casNumber;
    totMass += mass;
    let liqDensKgM3 = 0;
    let liqDensKmolM3 = 0;
    try{
      liqDensKmolM3 = physProps.filterAndCalculate(cas_no, "LDN", tempK);
      liqDensKgM3 = liqDensKmolM3 * comp.molecularWeight;
    } catch {
      badChems.push(cas_no);
      liqDensKmolM3 = physProps.filterAndCalculate(consts.CAS_NO_WATER, "LDN", tempK);
      liqDensKgM3 = liqDensKmolM3 * consts.MW_H2O;
    }
    totVol += mass / liqDensKgM3;
  }
  let densKgM3 = 0;
  if (totVol > 0) densKgM3 = totMass / totVol;

  return {badChems, densKgM3};

}

export const convertToMolarBasis = (mixture) => {
  let totMol = 0;
  for (let i=0; i < mixture.length; i++) {
    mixture[i].amount /= mixture[i].molecularWeight;
    totMol += mixture[i].amount;
  }
  for (let i=0; i < mixture.length; i++) {
    mixture[i].amount /= totMol;
  }

  return mixture;
}

export const getAverageMolecularWeight = (mixture) => {
  let aveMw = 0;
  mixture.forEach((element) => aveMw += (element.amount * element.molecularWeight));

  return aveMw;

}

export const calculateVaporPressureFromArray = (vpConsts, tempK = TEMP_K) => {
  const A = vpConsts.A;
  const B = vpConsts.B;
  const C = vpConsts.C;
  const D = vpConsts.D;
  const E = vpConsts.E;
  return calculateVaporPressure(A, B, C, D, E, tempK);
}

export const calculateVaporPressure = (A, B, C, D, E, tempK = TEMP_K) => {
  // Antoine equation: log10(P) = A - (B / (C + T))
  // Returns vapor pressure in Pascals (converted from mmHg)
  if (!A || !B || !C || !D || !E) return null;
  const pressPa = Math.exp(A + B / tempK + C * Math.log(tempK)+ D * Math.pow(tempK, E));
  return pressPa;
};

export const calculateDiffusivity = (molecularWeight) => {
  // Diffusivity relative to water
  return DIFFUSIVITY_WATER * Math.sqrt(MW_WATER / molecularWeight);
};

export const calculateSchmidtNumber = (diffusivity) => {
  return KINEMATIC_VISCOSITY_AIR / diffusivity;
};

export const calculateEffectiveDiameter = (area) => {
  // Convert feet to meters
  return Math.sqrt((4 * area) / PI);
};

export const calculateSurfaceArea = (length, width) => {
  // Convert feet to meters and calculate area in m²
  return (length / 3.28084) * (width / 3.28084);
};

export const calculateMassTransferCoefficient = (velocity, effectiveDiameter, schmidtNumber) => {
  velocity /= 3.28084;
  return 0.0048 * Math.pow(velocity, 7/9) * Math.pow(effectiveDiameter, -1/9) * Math.pow(schmidtNumber, -2/3);
};

export const calculateVaporPhaseAveMolecularWeight = (components) => {
  const vpComp = [];
  let vapMwAve = 0;
  let total = 0;
  for (let i=0; i < components.length; i ++) {
    const vpPa = calculateVaporPressureFromArray(components[i].vaporPressureConstants);
    const contribution = components[i].amount * vpPa;
    vpComp[i] = contribution;
    total += contribution;
  }
  
  for (let i=0; i < vpComp.length; i++) {
    vpComp[i] /= total;
    vapMwAve += components[i].molecularWeight;
  }

  return vapMwAve;

}

export const getMixtureVaporPressurePa = (components, tempK = TEMP_K) => {
  const mixtVp = components.reduce((totalPressure, comp) => {
    const pureCompVaporPressure = calculateVaporPressure(
      comp.vaporPressureConstants.A,
      comp.vaporPressureConstants.B,
      comp.vaporPressureConstants.C,
      comp.vaporPressureConstants.D,
      comp.vaporPressureConstants.E,
      tempK
    );
    return totalPressure + (comp.amount * pureCompVaporPressure);
  }, 0);

  return mixtVp;
}

export const calculateConcentrationPpm = (sashHeightFt, sashWidthFt, hoodVelocityFtMin, evaporationRateGramSec, components, mwManual) => {

  // For mixtures, we need to:
  // 1. Calculate mixture molecular weight in vapor phase
  let mixtureMW = mwManual;
  if (!mixtureMW) mixtureMW = calculateVaporPhaseAveMolecularWeight(components);
  console.log("average molecular wt in vapor phase: ", mixtureMW);
  
  const volRateFt3Min = sashHeightFt * sashWidthFt * hoodVelocityFtMin;
  if (volRateFt3Min === 0) {
    return 0;
  }
  const volRateFt3Sec = volRateFt3Min / 60;
  console.log("Volumetric Flow Rate = Sash Height (", sashHeightFt, " ft) * Sash Width (", sashWidthFt, " ft) * Face Velocity (", hoodVelocityFtMin, " ft/min) = ", volRateFt3Min, "(ft3/min)");

  console.log("Molar Specific Volume for ideal gas = 391.897 ft3/lb-mol at 25 deg C")
  const molarVolumeIG = 391.8973045; // ft3/lb-mol
  const molarFlowAirLbMolSec = volRateFt3Sec / molarVolumeIG;
  if (molarFlowAirLbMolSec === 0) {
    return 0;
  }
  console.log("Molar flow air = Vol Rate of Air (", volRateFt3Min, " ft3/min) / 60 / molar Volume (", molarVolumeIG, " ft3/lb-mol) = ", molarFlowAirLbMolSec, " lb-mol/sec");

  const evaporationRateLbSec = evaporationRateGramSec / 1000 * LB_PER_KG
  const molarFlowComponentsLbMolSec = evaporationRateLbSec / mixtureMW;
  console.log("Mass flow of evaporated components:  ", evaporationRateGramSec, " g/s");
  console.log("Mass flow of evaporated components:  ", evaporationRateLbSec, " lb/s");
  console.log("Molar flow of evaporated components: ", molarFlowComponentsLbMolSec, " lb-mol/s");

  const concVolFract = molarFlowComponentsLbMolSec / molarFlowAirLbMolSec;
  console.log("Concentration of chemical in air = Molar flow of evaporated components: ( ", molarFlowComponentsLbMolSec, " lb-mol/s)  / Molar Flow Air ( ", molarFlowAirLbMolSec, " lb-mol/s) = ", concVolFract, " volume fraction.");
  const concentrationPpm = concVolFract * 1000000;
  console.log("Concentration of chemical in air = ", concentrationPpm, " ppm")
  
  return concentrationPpm;

}

export const calculateEvaporationRate = (components, hoodVelocity, hoodLength, hoodWidth, mwManual, vpManual) => {
  // Calculate surface area
  const area = calculateSurfaceArea(hoodLength, hoodWidth);
  console.log("area (A):", area, " m2");
  
  // Calculate effective diameter
  const effectiveDiameter = calculateEffectiveDiameter(area);

  console.log("effective diameter (Z): ", effectiveDiameter, " m");
  
  // For mixtures, we need to:
  // 1. Calculate mixture molecular weight
  let mixtureMW = mwManual;
  if (!mixtureMW) mixtureMW = getAverageMolecularWeight(components);
  console.log("average molecular wt: ", mixtureMW);
  
  
  let mixtureVaporPressure = vpManual;
  // 2. Calculate mixture vapor pressure (Raoult's law)
  if (!mixtureVaporPressure) mixtureVaporPressure = getMixtureVaporPressurePa(components);

  console.log("overall vapor pressure: ", mixtureVaporPressure, " Pa");
  
  // Calculate diffusivity and Schmidt number
  const diffusivity = calculateDiffusivity(mixtureMW);
  console.log("diffusivity H2O: ", DIFFUSIVITY_WATER, " m2/s")
  console.log("diffusivity of our mixture  = diffusivityH2O * sqrt(mwH2O / aveMW): ");
  console.log("diffusivity of our mixture: ", diffusivity, " m2/s");

  const schmidtNumber = calculateSchmidtNumber(diffusivity);

  console.log("kin. viscosity of air: ", KINEMATIC_VISCOSITY_AIR, " m2/s")
  console.log("Schmidt Number = (kin. viscosity of air / diffusivity of mixture): ", schmidtNumber);

  // Calculate mass transfer coefficient

  const hoodVelocityFtSec = hoodVelocity / 60;
  const Km = calculateMassTransferCoefficient(hoodVelocityFtSec, effectiveDiameter, schmidtNumber);
  console.log("Km (mass transfer coefficient) = 0.0048 * (face velocity)^(7/9) * (diameter)^(-1/9) * (schmidt)^(-2/3)");
  console.log("Km = ", Km)
  
  // Calculate final evaporation rate in kg/s
  const evaporationRate = area * Km * (mixtureMW * mixtureVaporPressure / R / TEMP_K);
  console.log("Evaporation Rate = area * Km * (mixtureMW * mixtureVaporPressure / R / TEMP_K)");
  console.log("R: 8314 J/kmol/deg K")
  console.log("Temp assumes ambient, 25 deg C, 298.15 deg K");
  console.log("evaporation rate: ", evaporationRate, " kg/s");
  const evaporationRateGramSec = evaporationRate * 1000;
  console.log("evaporation rate: ", evaporationRateGramSec, " g/s");
  
  return evaporationRateGramSec;
};