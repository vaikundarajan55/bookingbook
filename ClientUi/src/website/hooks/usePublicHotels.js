import { useEffect, useState } from 'react';
import { webApi } from '../services/api.js';

/** Hotels visible on the website, for the contact and feedback forms' hotel pickers. */
export default function usePublicHotels() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    let alive = true;
    webApi.get('/hotels').then(({ data }) => { if (alive) setHotels(data.data); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  return hotels;
}
