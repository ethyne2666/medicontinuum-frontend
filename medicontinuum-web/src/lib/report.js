import { jsPDF } from 'jspdf';

const ascii = (t) => String(t).replace(/[–—]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E]/g, '');

export function downloadReport(s, summary) {
  const doc = new jsPDF();
  let y = 20;
  const line = (text, size = 10, bold = false) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.splitTextToSize(ascii(text), 180).forEach((l) => { if (y > 280) { doc.addPage(); y = 20; } doc.text(l, 15, y); y += size * 0.5 + 2; });
  };
  const head = (t) => { y += 4; line(t, 13, true); };

  line('MediContinuum - Patient Report', 18, true);
  line(`${s.patient.name}  |  ${s.patient.email}  |  Generated ${new Date(s.generatedAt).toLocaleString('en-IN')}`, 9);
  head('AI summary');
  summary.text.split('\n').forEach((t) => line(t));
  head('Today\'s doses');
  s.doses.forEach((d) => line(`${d.time}  ${d.medicine} (${d.dose}) - ${d.status}`));
  head('Stock');
  s.inventory.forEach((i) => line(`${i.medicine} [${i.batchNumber}]  ${i.quantity} ${i.stockUnit.toLowerCase()}  expires ${i.expiryDate}`));
  head('Active prescriptions');
  s.activePrescriptions.forEach((p) => line(`${p.doctor}: ${p.items.map((i) => `${i.medicine} ${i.dosageAmount} ${i.frequency}`).join(', ')}`));
  head('Last 7 days adherence');
  s.week.forEach((w) => line(`${w.day}: ${w.percent}%`));
  y += 6;
  line('Generated from data in the app. Not medical advice.', 8);
  doc.save(`medicontinuum-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
