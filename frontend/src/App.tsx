import React, { useState, useEffect } from 'react';
import './App.css';
import BreakevenCalculator from './components/BreakevenCalculator';

function App() {
  const [message, setMessage] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // This will connect to our backend when it's live
    fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000')
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setMessage('E-Ticaret Kar Hesaplama Aracına Hoş Geldiniz!');
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>esnakit.com</h1>
        {isLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          <p>{message}</p>
        )}
        
        <BreakevenCalculator />
        
        <div className="coming-soon">
          <p>Yakında daha fazla özellik!</p>
        </div>
      </header>
    </div>
  );
}

export default App;
