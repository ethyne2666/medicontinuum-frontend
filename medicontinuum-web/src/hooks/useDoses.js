import { patientActions, usePatient } from '@/store/patientStore';

// Same API as before ({ doses, mark, percent }), now backed by the shared store so every page,
// the chatbot and the report agree — and marking a dose "taken" updates stock.
export function useDoses() {
  const { doses } = usePatient();
  const mark = (id, status) => patientActions.markDose(id, status, 'button');
  const taken = doses.filter((dose) => dose.status === 'TAKEN').length;
  const percent = doses.length ? Math.round((taken / doses.length) * 100) : 0;
  return { doses, mark, percent };
}
