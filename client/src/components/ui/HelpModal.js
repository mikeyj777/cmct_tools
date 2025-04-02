//HelpModal.js

import React, { useEffect } from 'react';
import '../../styles/HelpModal.css';

const HelpModal = () => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        const modalElement = document.querySelector('.modal.show');
        if (modalElement) {
          const event = new Event('click');
          modalElement.dispatchEvent(event);
        }
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div>
      <div className="modal-content">
        
        <h2>Evaporation Calculator Help</h2>
        
        <section>
          <h3>About</h3>
          <p>The basis for these calculations is a dissertation entitled 'Modelling spreading, vaporisation and dissolution of multi-component pools'. 
          The paper summarizes different available methods for pool calculations.  Our model leverages calculations from a few sections.</p>
          <p>Source: <a href="https://discovery.ucl.ac.uk/id/eprint/1386059/1/Maria%20Fernandez_PhD_public%20version.pdf">Dissertation - Dr. Maria Fernandez, PhD</a></p>
        </section>

        <section>
          <h3>Required Inputs</h3>
          
          <h4>Hood Dimensions</h4>
          <div className="subsection">
            <p><strong>Length:</strong> The length across the work surface (left to right) in feet</p>
            <p><strong>Depth:</strong> The depth of the work surface (from sash at the front to air intake at back) in feet</p>
          </div>

          <h4>Hood Face Velocity</h4>
          <div className="subsection">
            <p>Measured in feet per second. This value depends on the sash height setting. Use values developed for your hood's specific sash height targets.</p>
          </div>

          <h4>Mixture Components</h4>
          <div className="subsection">
            <ul>
              <li>Enter all components that could be spilled</li>
              <li>Search by chemical name or CAS Number</li>
              <li>The list of available chemicals will automatically filter while typing</li>
              <li>For pure components:
                <ul>
                  <li>Enter single component</li>
                  <li>Any numeric value works for "Amount"</li>
                </ul>
              </li>
              <li>For mixtures:
                <ul>
                  <li>Select molar or mass basis before adding components</li>
                  <li>Must remove all components to change molar/mass basis selection</li>
                  <li>Enter relative amounts (ratios or fractions)</li>
                  <li>Avoid using %, $, or commas (periods for decimals are OK)</li>
                  <li>Values do not need to sum to 1 or 100</li>
                  <li>Values will be normalized when submitted</li>
                </ul>
              </li>
            </ul>
          </div>

          <h4>Manually Input Required Parameters</h4>
          <div className="subsection">
            <ul>
              <li>Check this box to directly enter:
                <ul>
                  <li>Molecular weight</li>
                  <li>Vapor pressure at 25°C (in Pascals)</li>
                </ul>
              </li>
              <li>Values can be:
                <ul>
                  <li>Pure component properties</li>
                  <li>Average/effective properties for a mixture</li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h3>Key Equations</h3>
          
          <p><strong>Diffusivity:</strong></p>
          <div className="equation">D_mixture = D_water × √(MW_water / MW_mixture)</div>
          
          <p><strong>Schmidt Number:</strong></p>
          <div className="equation">Sc = kinematic_viscosity_air / D_mixture</div>
          
          <p><strong>Mass Transfer Coefficient (Km):</strong></p>
          <div className="equation">Km = 0.0048 × (velocity)^(7/9) × (diameter)^(-1/9) × (Schmidt)^(-2/3)</div>
          
          <p><strong>Evaporation Rate:</strong></p>
          <div className="equation">Rate = area × Km × (MW × vapor_pressure / R / T)</div>
          
          <p><strong>Where:</strong></p>
          <dl className="constant-list">
            <dt>R</dt>
            <dd>8314 J/kmol/K (gas constant)</dd>
            
            <dt>T</dt>
            <dd>298.15 K (assumed ambient temperature)</dd>
            
            <dt>D_water</dt>
            <dd>2.4E-5 m²/s (diffusivity of water in air)</dd>
            
            <dt>MW_water</dt>
            <dd>18.02 g/mol</dd>
            
            <dt>kinematic_viscosity_air</dt>
            <dd>1.568E-5 m²/s at 298.15 K</dd>
            
            <dt>area</dt>
            <dd>hood length × width (m²)</dd>
            
            <dt>diameter</dt>
            <dd>√(4 × area / π)</dd>
          </dl>
        </section>

        <section>
          <h3>Evaporation Model</h3>
          <p>The evaporation model calculates the evaporation rate of a chemical spill in a laboratory hood environment. It takes into account various physical properties and environmental conditions to estimate the evaporation rate over time.</p>
          
          
          <h4>Detailed Steps</h4>
          <ol>
            <li><strong>Initial Calculations</strong>:
              <ul>
                <li>Calculate the maximum area and radius of the spill based on hood dimensions.</li>
                <li>Assume the spill spreads over 10 seconds.</li>
                <li>Initialize variables for molecular weight, vapor pressure, and liquid density.</li>
              </ul>
            </li>
            <li><strong>Property Retrieval</strong>:
              <ul>
                <li>If manual inputs are not provided, retrieve properties using utility functions.</li>
                <li>Log any missing properties.</li>
              </ul>
            </li>
            <li><strong>Evaporation Calculation</strong>:
              <ul>
                <li>Calculate the initial radius and height of the spill.</li>
                <li>Adjust height and radius if they fall below minimum values or exceed maximum area.</li>
              </ul>
            </li>
            <li><strong>Iterative Evaporation Process</strong>:
              <ul>
                <li>Calculate the mass transfer coefficient using the Schmidt number.</li>
                <li>Determine the evaporation rate and update the total evaporated mass.</li>
                <li>Adjust the spill volume and radius iteratively until the spill is completely evaporated or 1 hour has passed.</li>
              </ul>
            </li>
            <li><strong>Final Output</strong>:
              <ul>
                <li>Return the results including any missing properties, evaporation rates, maximum evaporation rate and time, and total evaporated gas.</li>
              </ul>
            </li>
          </ol>
          
          
          <h4>Notes</h4>
          <ul>
            <li>Ensure all physical properties are accurately defined for precise calculations.</li>
            <li>Adjust manual inputs as needed for specific scenarios.</li>
            <li>The function assumes a constant spill rate over the initial 10 seconds.</li>
          </ul>
        </section>

        <section>
          <h3>Chemical Concentration in Air</h3>
          <p>To calculate the concentration of a chemical in air, use the following steps:</p>
          <ol>
            <li>Calculate the mixture molecular weight in the vapor phase.  This follows Raoult's law.</li>
            <li>Determine the volumetric flow rate of air in cubic feet per second (ft³/s) using the formula:
              <div className="equation">Volumetric Flow Rate = Sash Height (ft) × Sash Width (ft) × Hood Velocity (ft/min) / 60</div>
            </li>
            <li>Calculate the molar flow rate of air in lb-mol/s:
              <div className="equation">Molar Flow Air = Volumetric Flow Rate (ft³/s) / Molar Specific Volume (391.897 ft³/lb-mol) - This assumes Ideal Gas at 25 deg C</div>
            </li>
            <li>Convert the peak evaporation rate from grams per second (g/s) to pounds per second (lb/s) and then to molar flow rate in lb-mol/s:
              <div className="equation">Molar Flow Components = Evaporation Rate (g/s) / 1000 × 2.20462 / Mixture MW</div>
            </li>
            <li>Calculate the concentration in volume fraction:
              <div className="equation">Concentration (Vol Fraction) = Molar Flow Components / Molar Flow Air</div>
            </li>
            <li>Convert the concentration to ppm:
              <div className="equation">Concentration (ppm) = Concentration (Vol Fraction) × 1,000,000</div>
            </li>
          </ol>
        </section>


        <section>
          <h3>Contact</h3>
          <p>For questions or support, contact Mike James (mjames@eastman.com)</p>
        </section>
      </div>
    </div>
  );
};

export default HelpModal;
