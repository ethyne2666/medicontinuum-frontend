import { useState } from 'react';
import { DOSES } from '@/data/mock';

export function useDoses() {
  const [doses, setDoses] = useState(DOSES);

  const mark = (id, status) =>
    setDoses((prev) => prev.map((dose) => (dose.id === id ? { ...dose, status } : dose)));

  const taken = doses.filter((dose) => dose.status === 'TAKEN').length;
  const percent = Math.round((taken / doses.length) * 100);

  return { doses, mark, percent };
}
