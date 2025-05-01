import React, { useState } from 'react';
import './BreakevenCalculator.css';

interface FormValues {
  entryPrice: number;
  position: string;
  stopLoss: number;
  riskAmount: number;
  leverage: number;
}

const BreakevenCalculator: React.FC = () => {
  const [values, setValues] = useState<FormValues>({
    entryPrice: 0,
    position: 'long',
    stopLoss: 0,
    riskAmount: 0,
    leverage: 1
  });
  
  const [result, setResult] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: name === 'position' ? value : parseFloat(value)
    });
  };

  const calculateBreakeven = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { entryPrice, position, stopLoss, riskAmount, leverage } = values;
    
    // Calculate position size
    const priceDifference = Math.abs(entryPrice - stopLoss);
    const riskPercentage = priceDifference / entryPrice;
    const positionSize = (riskAmount / riskPercentage) * leverage;
    
    // Calculate breakeven price (simplified example)
    let breakevenPrice;
    if (position === 'long') {
      // For long positions, breakeven is entry price plus fees/spread
      breakevenPrice = entryPrice + (entryPrice * 0.001); // Assuming 0.1% fee
    } else {
      // For short positions, breakeven is entry price minus fees/spread
      breakevenPrice = entryPrice - (entryPrice * 0.001); // Assuming 0.1% fee
    }
    
    setResult(breakevenPrice);
  };

  return (
    <div className="calculator-container">
      <h2>E-Markets Breakeven Calculator</h2>
      <form onSubmit={calculateBreakeven}>
        <div className="form-group">
          <label htmlFor="entryPrice">Entry Price ($)</label>
          <input
            type="number"
            id="entryPrice"
            name="entryPrice"
            value={values.entryPrice}
            onChange={handleChange}
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="position">Position Type</label>
          <select
            id="position"
            name="position"
            value={values.position}
            onChange={handleChange}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="stopLoss">Stop Loss ($)</label>
          <input
            type="number"
            id="stopLoss"
            name="stopLoss"
            value={values.stopLoss}
            onChange={handleChange}
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="riskAmount">Risk Amount ($)</label>
          <input
            type="number"
            id="riskAmount"
            name="riskAmount"
            value={values.riskAmount}
            onChange={handleChange}
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="leverage">Leverage (×)</label>
          <input
            type="number"
            id="leverage"
            name="leverage"
            value={values.leverage}
            onChange={handleChange}
            min="1"
            step="0.1"
            required
          />
        </div>
        
        <button type="submit" className="calculate-btn">Calculate</button>
      </form>
      
      {result !== null && (
        <div className="result-container">
          <h3>Breakeven Price</h3>
          <p className="result">${result.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default BreakevenCalculator; 