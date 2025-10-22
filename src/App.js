import './App.css';
import myImage from './images/map.jpg';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/station-info');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Station Map</h1>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={myImage}
            alt="Map"
            style={{ width: '500px', height: '500px' }}
          />

          {/* Clickable red point */}
          <div
            onClick={handleClick}
            style={{
              position: 'absolute',
              top: '200px',
              left: '100px',
              width: '20px',
              height: '20px',
              backgroundColor: 'red',
              borderRadius: '50%',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 0 5px black'
            }}
          ></div>
          <div
            onClick={handleClick}
            style={{
              position: 'absolute',
              top: '244px',
              left: '134px',
              width: '20px',
              height: '20px',
              backgroundColor: 'red',
              borderRadius: '50%',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 0 5px black'
            }}
          ></div>
          <div
            onClick={handleClick}
            style={{
              position: 'absolute',
              top: '300px',
              left: '400px',
              width: '20px',
              height: '20px',
              backgroundColor: 'red',
              borderRadius: '50%',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 0 5px black'
            }}
          ></div>
        </div>
      </header>
    </div>
  );
}

export default App;
