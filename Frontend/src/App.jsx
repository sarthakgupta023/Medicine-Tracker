import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Splash from "./routes/Splash";
import Login from "./routes/Login";
import Signup from "./routes/Signup";
import Home from "./routes/Home";
import AddMedicine from "./routes/AddMedicine";
import Today from "./routes/Today";
import Calendar from "./routes/Calendar";
import DayDetails from "./routes/DayDetails";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const location = useLocation();
  if (!token || !userId) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/add-medicine" element={<PrivateRoute><AddMedicine /></PrivateRoute>} />
      <Route path="/today" element={<PrivateRoute><Today /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
      <Route path="/day-details" element={<PrivateRoute><DayDetails /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
