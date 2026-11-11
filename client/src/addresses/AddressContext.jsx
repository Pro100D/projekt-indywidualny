import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getActiveAddressId, setActiveAddressId } from '../api/client.js';

const AddressContext = createContext(null);

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState([]);
  const [activeId, setActiveId] = useState(getActiveAddressId());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const data = await api('/addresses');
      setAddresses(data.addresses);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const stored = addresses.find((a) => a._id === activeId);
  const activeAddress = stored || addresses.find((a) => a.isDefault) || addresses[0] || null;

  function selectAddress(id) {
    setActiveAddressId(id);
    setActiveId(id);
  }

  return (
    <AddressContext.Provider value={{ addresses, activeAddress, selectAddress, reload, loading, error }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  return useContext(AddressContext);
}
