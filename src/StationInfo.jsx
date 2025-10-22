import { useNavigate } from 'react-router-dom';
import myImage from './images/second.png'

export default function StationInfo() {
  const navigate = useNavigate();

  return (
      
              
                
              
      
      

      <div>
        <img
                  src={myImage}
                  alt="Map"
                  style={{ width: '500px', height: '500px' }}
                />
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        ⬅ Back to Map
      </button>
    </div>
  );
}
