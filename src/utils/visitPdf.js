import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BIVARIATE_CLASSES } from "./analyticsInsights";
import { poiLabel } from "./municipalityProfile";

export const downloadMunicipioVisitSheet = (municipio) => {
  if (!municipio) return;

  const doc = new jsPDF();
  const bivariate = BIVARIATE_CLASSES[municipio.bivariateClass];

  doc.setFontSize(18);
  doc.text(`Ficha de visita · ${municipio.name}`, 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text("Power Solar Map · Puerto Rico", 14, 28);
  doc.text(`Generada ${new Date().toLocaleDateString("es-PR")}`, 14, 35);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 44,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2.5 },
    body: [
      ["Clientes solares", String(municipio.customers?.toLocaleString?.() || municipio.customers || 0)],
      ["Penetración", `${municipio.penetrationRate}%`],
      ["Ingreso promedio", `$${(municipio.avgIncome || 0).toLocaleString()}`],
      ["Población promedio", String(municipio.avgPopulation?.toLocaleString?.() || municipio.avgPopulation || 0)],
      ["Score de oportunidad", String(municipio.gapScore ?? "—")],
      ["Perfil de mercado", bivariate?.label || "—"],
      ["Pobreza", `${municipio.avgPoverty}%`],
      ["Desempleo", `${municipio.avgUnemployment}%`],
      ["Profesionales", `${municipio.avgProfessional}%`],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { cellWidth: 125 },
    },
  });

  let y = (doc.lastAutoTable?.finalY || 44) + 12;
  doc.setFontSize(13);
  doc.text("Oportunidad solar", 14, y);
  y += 7;
  doc.setFontSize(10);
  const opportunity = municipio.solarOpportunity || "Sin perfil de IA todavía. Genéralo en el panel de administración.";
  const opportunityLines = doc.splitTextToSize(opportunity, 180);
  doc.text(opportunityLines, 14, y);
  y += opportunityLines.length * 5 + 8;

  doc.setFontSize(13);
  doc.text("Puntos de interés", 14, y);
  y += 4;
  const pois = municipio.pointsOfInterest?.length
    ? municipio.pointsOfInterest.map((item) => [poiLabel(item) || String(item)])
    : [["Sin puntos de interés generados"]];
  autoTable(doc, {
    startY: y,
    theme: "striped",
    styles: { fontSize: 10 },
    body: pois,
  });

  y = (doc.lastAutoTable?.finalY || y) + 12;
  if (municipio.salesNotes) {
    doc.setFontSize(13);
    doc.text("Notas de ventas (equipo)", 14, y);
    y += 7;
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(municipio.salesNotes, 180);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 8;
  }

  if (municipio.funFact) {
    doc.setFontSize(13);
    doc.text("Dato curioso", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(municipio.funFact, 180), 14, y);
    y += 16;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Detalle: /municipio/${encodeURIComponent(municipio.name)}  ·  Lista de visitas por barrio, no incluye direcciones.`,
    14,
    Math.min(y + 6, 285)
  );

  doc.save(`ficha-visita-${municipio.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
};
