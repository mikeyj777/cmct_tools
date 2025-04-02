import * as consts from './consts'
import { parseCSV } from './csv_io'
import { eqn_100, eqn_101, eqn_105, eqn_106, eqn_107, eqn_114, eqn_124, eqn_127 }  from './dipprCalcs'; 

const eqnFunctions = {
    100: eqn_100,
    101: eqn_101,
    105: eqn_105,
    106: eqn_106,
    107: eqn_107,
    114: eqn_114,
    124: eqn_124,
    127: eqn_127
};

export default class PhysProps {

    constructor() {
        this.dipprCoeffs = [];
        this.dipprConsts = [];
        this.chemicalData = [];
        
        this.initializeData();
    }

    async initializeData() {
        this.chemicalData = await this.#loadChemicalData();
        this.dipprCoeffs = await this.#loadDipprCoeffs();
        this.dipprConsts = await this.#loadDipprConsts();
    }

    async #loadChemicalData() {
        try {
            const response = await fetch(consts.CHEMINFO_CSV_NAME);
            const text = await response.text();
            
            // Parse CSV properly handling commas in fields
            const rows = text.split('\n').map(row => {
                const cells = [];
                let currentCell = '';
                let inQuotes = false;
    
                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        cells.push(currentCell.trim().replace(/^"|"$/g, ''));
                        currentCell = '';
                    } else {
                        currentCell += char;
                    }
                }
    
                // Push the last cell
                cells.push(currentCell.trim().replace(/^"|"$/g, ''));
                return cells;
            });
    
            const headers = rows[0];
            return rows.slice(1).map(values => ({
            casNumber: values[0],  
            name: values[1],
                molecularWeight: parseFloat(values[4]),
                vaporPressureConstants: {
                    A: parseFloat(values[5]),
                    B: parseFloat(values[6]),
                    C: parseFloat(values[7]),
                    D: parseFloat(values[8]),
                    E: parseFloat(values[9]),
                },
            })).filter(chem => chem.name); // Filter out any empty rows
        } catch (error) {
            console.error('Error loading chemical data:', error);
            return [];
        }
    };





    #getConstData(property_id) {
        try {
            return this.dipprConsts.filter(row => row.property_id === property_id);
        } catch (error) {
            console.error(`Error getting ${ property_id } data: `, error);
            return [];
        }
    }

    getPropertyValue(cas_no, property_id) {
        // Find the row with the specified cas_no and property_id

        const tcData = this.#getConstData(property_id);
        const row = tcData.find(row => row.cas_no === cas_no);

        if (!row) {
            throw new Error(`No matching data found for cas ${ cas_no }, property ${ property_id }.`);
        }

        return row.const_value;
    }

    async #loadDipprCoeffs() {
        let data = []
        try {
            data = await parseCSV(consts.DIPPR_COEFFICIENTS_CSV_NAME);
        } catch (error) {
            console.error('Error getting DIPPR Temperature-Dependent Coffficient data:', error);
        }
        return data
    }

    async #loadDipprConsts() {
        let data = []
        try {
            data = await parseCSV(consts.DIPPR_CONSTANTS_CSV_NAME);
        } catch (error) {
            console.error('Error getting DIPPR Constants data:', error);
        }
        return data
    }

    filterAndCalculate(cas_no, property_id, temperature, integrated=false) {
        // returns the calculated dippr equation.
        // integrated forms are used for equations such as heat capacity where the 
        // total value is based on integrating the base calculation over a temperature range.
        const data = this.dipprCoeffs;
        const tc = this.getPropertyValue(cas_no, "TC", this.dipprConsts);

        const filteredData = data.filter(row => row.cas_no === cas_no && row.property_id === property_id);

        // Find the rows where temperature is within min_t and max_t and eqn_id is in eqnFunctions keys
        let selectedRows = filteredData.filter(row => {
            const eqnIdStr = String(row.eqn_id);
            return temperature >= row.min_t && temperature <= row.max_t && eqnFunctions.hasOwnProperty(eqnIdStr);
        });

        // If no rows are found, find the closest temperature range
        if (selectedRows.length === 0) {
            let closestRow = null;
            let smallestDiff = Infinity;
            filteredData.forEach(row => {
                const diff = Math.min(Math.abs(temperature - row.min_t), Math.abs(temperature - row.max_t));
                const eqnIdStr = String(row.eqn_id);
                if (diff < smallestDiff && eqnFunctions.hasOwnProperty(eqnIdStr)) {
                    smallestDiff = diff;
                    closestRow = row;
                }
            });
            selectedRows = closestRow ? [closestRow] : [];
        }

        if (selectedRows.length === 0) {
            return null;
        }

        // Return the first matching row
        const selectedRow = selectedRows[0];

        // Extract coefficients and equation ID
        let { coeff_a, coeff_b, coeff_c, coeff_d, coeff_e, coeff_f, coeff_g, eqn_id, min_t, max_t } = selectedRow;
        const consts = [coeff_a, coeff_b, coeff_c, coeff_d, coeff_e, coeff_f, coeff_g];

        // Get the appropriate DIPPR equation function
        const dipprFunction = eqnFunctions[eqn_id];
        if (!dipprFunction) {
            return null;
        }

        // Call the function
        return dipprFunction(consts, temperature, tc, integrated);
    }
}