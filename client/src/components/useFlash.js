import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useFlash() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(() => location.state?.flash || null);

  useEffect(() => {
    if (location.state?.flash) {
      setMessage(location.state.flash);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  return [message, setMessage];
}
