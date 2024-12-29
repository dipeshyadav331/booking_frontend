import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/signup/signup';
import Signin from './pages/signin/signin';
import Train from './pages/hero/hero';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/train" element={<Train />} />
      </Routes>
    </Router>
  );
}

export default App;