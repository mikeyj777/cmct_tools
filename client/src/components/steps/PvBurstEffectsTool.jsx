import React, {useEffect, useState} from 'react';
import ResultsModal from '../ui/ResultsModal';
import { getApiUrl } from '../../utils/mapUtils';


const apiUrl = getApiUrl();


const PvBurstEffectsTool = ( {
    jsonData,
    buildings,
    updateGuidanceBanner,
    onBuildingsUpdate
}) => {
    // state managed variables
    const [bldgsWithPvBurstOverpressure, setBldgsWithPvBurstOverpressure] = useState(null);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [jsonDataForModeling, setJsonDataForModeling] = useState(null);
    
    useEffect(() => {
        if (!resultData || resultData.length === 0) return;
        
        const updatedBuildings = buildings.map((curr, idx) => {
            return {
                ...curr,
                pv_burst_overpressure_psi: resultData.bldgs[idx].pv_burst_overpressure_psi
            }
        });

        if (onBuildingsUpdate) {
            onBuildingsUpdate(updatedBuildings);
        }

        setBldgsWithPvBurstOverpressure(updatedBuildings);

        setIsModalOpen(true);
    }, resultData)

    useEffect(() => {
        const currentJsonData = {...jsonData};
        currentJsonData.BuildingInfo = [...buildings];
        setJsonDataForModeling(() => {
            return currentJsonData;
        });

    }, [jsonData]);

    // request for pv burst calcs using jsonData
    const calculateOverpressure = async () => {
        if (!jsonDataForModeling) {
            updateGuidanceBanner(
            'Please load JSON data prior to continuing.',
            'error'
            );
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            updateGuidanceBanner('Calculating PV Burst effects.  This may take two minutes to complete.', 'info');

            // Make API call to get overpressure results
            const response = await fetch(`${apiUrl}/api/get_pv_burst_results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonDataForModeling),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            setResultData(await response.json());

            updateGuidanceBanner('Overpressure effects calculated successfully!', 'success');

        } catch (err) {
            console.error('Error calculating overpressure effects:', err);
            setError(`Failed to calculate overpressure effects: ${err.message}`);
            updateGuidanceBanner(`Error: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // When modal opens, prevent body scrolling
    useEffect(() => {
        if (isModalOpen) {
            // Store original overflow style
            const originalStyle = window.getComputedStyle(document.body).overflow;

            // Prevent scrolling on the body
            document.body.style.overflow = 'hidden';

            // Cleanup function to restore original body overflow when modal closes
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
        // No cleanup needed if modal isn't open
        return undefined;
    }, [isModalOpen]);


    return (
        <div className="overpressure-effects-tool">
        <div className="section-info">
            <p>
                Calculate the Pressure Vessel Burst effects on each building.
            </p>
        </div>
        <div className="tool-controls">
            <button
                className="primary-button"
                onClick={calculateOverpressure}
                disabled={isLoading || !jsonData}
            >
            {isLoading ? 'Calculating...' : 'Calculate Overpressure Effects'}
            </button>
        </div>
        {error && (
            <div className="error-message">
            <p>{error}</p>
            </div>
        )}

        {/* Modal Portal - Render at the document root to avoid stacking context issues */}
        {isModalOpen && (
            <ResultsModal
            buildingsWithOverpressure={bldgsWithPvBurstOverpressure}
            onClose={() => setIsModalOpen(false)}
            />
        )}
        </div>
    );
};

export default PvBurstEffectsTool;