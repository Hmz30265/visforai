import { Routes, Route } from 'react-router-dom';
import App from './App';
import StationInfo from './StationInfo';

export default function Main() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/station-info" element={<StationInfo />} />
    </Routes>
  );
}
