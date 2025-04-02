import * as consts from './consts';
import { getAverageMolecularWeight, getMixtureVaporPressurePa, getAverageLiquidDensityKgM3 } from './evaporationUtils';

//         st = Double.parseDouble(chemForAnalysis[8]);
// //Surface Tension (dyne/cm)

//         rho = Double.parseDouble(chemForAnalysis[9]) *
// 62.428; 
// //density (lb/ft3)

//         rho_KgM3 = rho * 16.0185; 
// // kg/m3

//         mu = Double.parseDouble(chemForAnalysis[10]);
// //Viscosity (cP)


const dynamicPoolEvap = (components, temp_k, physProps, spillVolML, hoodVelocityFtMin, hoodLengthFt, hoodDepthFt, mwManual, vpManual, liquidDensityManualLbGal) => {

    const nulls = []

    const maxArea = hoodLengthFt * hoodDepthFt / Math.pow(3.28084, 2);
    const maxRadius = Math.sqrt(maxArea / Math.PI);

    console.log("Assume the spill and initial spread occurs over 10 sec");
    const durationSec = 10;

    const gasRatePerSec = [];
    const totalGasEvapGforOutput = {
        10: null,
        60: null,
        3600: null,
        timeToCompletelyEvaporateSec: null
    };

    let mw = mwManual;
    let vpPa = vpManual;
    let liqDensLbGal = liquidDensityManualLbGal;
    
    let liqDensKmolM3 = 0;
    //filterAndCalculate(cas_no, property_id, temperature, integrated=false)
    if (!vpPa) vpPa = getMixtureVaporPressurePa(components, temp_k);
    if (!mw) mw = getAverageMolecularWeight(components);
    if (!liqDensLbGal) {
        try {
            // getAverageLiquidDensityKgM3 = (components, physProps, tempK = TEMP_K)
            // return {badChems, densKgM3};
            const dens_data = getAverageLiquidDensityKgM3(components, physProps, temp_k);
            const liqDensKgM3 = dens_data.densKgM3;
            const badChems = dens_data.badChems;
            if (badChems.length > 0) nulls.push("LDN");
            liqDensLbGal = liqDensKgM3 * consts.LB_PER_KG / consts.GAL_PER_M3;
            
        } catch (error) {
            // error logging already in the phys props methods.
            console.error("error: ", error);
        }
    }


    if (!mw) {
        nulls.push("MW");
        mw = physProps.getPropertyValue(consts.CAS_NO_WATER, "VP");
    }
    if (!vpPa) {
        nulls.push("VP");
        vpPa = physProps.filterAndCalculate(consts.CAS_NO_WATER, "VP", temp_k);
    }
    if (!liqDensLbGal) {
        if (!nulls.includes("LDN")) nulls.push("LDN");
        liqDensKmolM3 = physProps.filterAndCalculate(consts.CAS_NO_WATER, "LDN", temp_k);
        liqDensLbGal = liqDensKmolM3 * consts.MW_H2O * consts.LB_PER_KG / consts.GAL_PER_M3;
    }

    const rho_KgM3 = liqDensLbGal / consts.LB_PER_KG * consts.GAL_PER_M3;
    const volM3 = spillVolML * 1e-6;
    const vcDot = volM3 / durationSec; // m3/sec
    const dtSec = 1.0;
    const pi = Math.PI;
    const surfaceRoughness = 0.01;
    const dm = 2.4e-5 * Math.sqrt(consts.MW_H2O / mw); //m2/s
    const nu_air = 1.5e-5; //m2/s
    const gc = consts.GC_M_S2;
    const hmin = surfaceRoughness;
    const Sc = nu_air / dm;
    const evapRateLowerLimit_kgs = 4e-5;
    const u = hoodVelocityFtMin / 3.28084 / 60; // wind speed - m/s

    console.log("One factor in the mass transfer coefficient calc is the Schmidt number (Sc).  This compares the kinematic viscosity of air (nu) to the diffusivity (dm) of our evaporating species");
    console.log("nu = 1.5 e-5 m2/s");
    console.log("diffusivity = diffusivity water * sqrt(mw_chem / mw_h2o)");
    console.log("average molecular weight evaporating species: ", mw);
    console.log("diffusivity water = 2.5e-5 m2/s");
    console.log("dm = ", dm, " m2/s");
    console.log("Sc = nu / dm: ", Sc);

    console.log("Start at time t = 1 sec.");
    let t = 1.0;

    let radius = Math.pow(32*gc*vcDot/9/pi,0.25) * Math.pow(t, 3/4);
    console.log("Use Shaw and Briscoe calc for radius: (32*gc*vcDot/9/pi)^(1/4) * t ^ (3/4): ", radius, "m");
    console.log("vcDot is the estimated spill rate, which is the quantity spilled over the 10 second assumed duration: ", vcDot, " m3/s");
    

    let accVol = volM3; //m3
    let h = accVol / pi / Math.pow(radius, 2) //m
    console.log("the initial height is the spill volume divided by pool area.");
    
    console.log("if height calc is below minimum allowable (1 cm), set to 1 cm.");
    if (h<hmin) {
        h=hmin;
        radius = Math.sqrt(accVol/pi/h);
    }
    if (radius > maxRadius) {
        radius = maxRadius;
        accVol = Math.PI * Math.pow(radius, 2);
    }
    console.log("check if spill area is larger than area of lab hood.  adjusted initial height for model: ", h, " m. and radius: ", radius, " m");

    let evap = 1 // kg/s
    let prevEvap = 0; // kg/s
    let lostMass = 0; //kg
    let lostVol = 0; //m3
    let area = 0; //m2
    let dr_grav = 0; //m
    let dr_newVol = 0; //m
    let Km = 0; //m/s
    let pVap = vpPa; // Pa
    let totalEvaporatedKg = 0;

    const maxEvapRateAndTime = {
        evapRateGperSec: null,
        timeSec: null,
    };

    let maxEvapRate = 0;
    console.log("The model then iteratively calculates the following until the pool is depleted or until it reaches 1 hour of evaporation time");
    console.log("Mass Transfer Coefficient:  Km = 0.0048 * u ^ (7/9) * diam ^ (-1/9) * Sc ^ (-2/3);")
    console.log("Evaporation: poolArea * Km * mw * vpress / 8314 / temp_deg_K");
    console.log("Totalize the evaporated amount using a trapezoid rule approximation.");
    console.log("Reduce the material quantity in the pool by the amount evaporated.");
    console.log("Determine new radius using Shaw and Briscoe");
    console.log("Get latest pool height.  Account for pool spread with a gravitational term:  dr_grav = sqrt(2*gc*(h-hmin)).");
    console.log("dr_grav is added to the radius");
    console.log("adjust height to ensure it is not below minimum. Adjust radius to ensure it is below the max.");
    console.log("Adjust available volume.")
    console.log("complete the iteration and start the next");
    while (radius > 0 && t <= 3600) {
        t += dtSec;
        Km = 0.0048 * Math.pow(u, 0.77777777778) * 1/Math.pow(radius*2,0.111111111) * 1/Math.pow(Sc, 0.66666667);
        // console.log("km: ", Km, Math.pow(u, 0.77777777778),  1/Math.pow(radius*2,0.111111111) , 1/Math.pow(Sc, 0.66666667) );
        area = pi * Math.pow(radius, 2);
        evap = area * Km * mw * pVap / 8314 / temp_k;
        evap = Math.max(evap, evapRateLowerLimit_kgs);
        if (evap > maxEvapRate) {
            maxEvapRateAndTime.evapRateGperSec = evap * 1000;
            maxEvapRateAndTime.timeSec = t;
            maxEvapRate = evap;
        }
        gasRatePerSec.push(evap);
        totalEvaporatedKg += 0.5 * (evap + prevEvap) * dtSec;
        if (totalGasEvapGforOutput.hasOwnProperty(t)) {
            totalGasEvapGforOutput[t] = totalEvaporatedKg * 1000; 
        }
        lostMass = evap;
        lostVol = lostMass / rho_KgM3;
        accVol -= lostVol;
        if (accVol <= 0) break;
        accVol = Math.max(accVol, 0);

        
        if (t<=durationSec) {
            accVol += vcDot * dtSec;
            radius = 0.75 * Math.pow(32 * gc * vcDot / 9 / pi,0.25) * Math.pow(t, 3/4);
        }
        
        // at each step, determine the calc height is below min.  adjust radius accordingly.
        h = accVol / pi / Math.pow(radius, 2);
        if (h<hmin) {
            h = hmin;
            radius = Math.sqrt(accVol/pi/h);
        }
        dr_grav = Math.sqrt(2*gc*(h-hmin));
        radius = radius + dr_grav;

        if (radius > maxRadius) {
            radius = maxRadius;
            accVol = Math.PI * Math.pow(radius, 2);
        }
        // console.log("time: ", t, " sec | radius: ", radius, " m | height: ", h, " m | acc Vol: ", accVol, " m3 | evap rate: ", evap, " kg/s | total evaporated: ", totalEvaporatedKg, " kg");
    }

    if (accVol <= 0) totalGasEvapGforOutput.timeToCompletelyEvaporateSec = t;


    return {nulls, gasRatePerSec, maxEvapRateAndTime, totalGasEvapGforOutput};

}

export default dynamicPoolEvap;