// ============================================================
// pdfService — génération de plannings PDF côté client
//
// IMPORTANT — lazy loading :
// jsPDF + autotable pèsent ~250 ko. On les importe dynamiquement
// au premier usage pour ne pas pénaliser le bundle initial.
// L'app reste rapide à charger ; le PDF prend ~1s la 1ère fois,
// puis instantané ensuite (cache navigateur).
// ============================================================

import { knockoutRoundLabel } from '../utils/scheduling';
import { getDisplayTeam, computeStandings } from '../utils/standings';

// Charge les libs PDF à la demande (cache après 1er appel)
let _pdfLibs = null;
async function loadPdfLibs() {
  if (_pdfLibs) return _pdfLibs;
  const [jsPdfMod, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  _pdfLibs = {
    jsPDF: jsPdfMod.default || jsPdfMod.jsPDF,
    autoTable: autoTableMod.default,
  };
  return _pdfLibs;
}

// Couleurs (cohérentes avec l'app)
const COLOR_PRIMARY = [34, 211, 238];
const COLOR_DARK = [15, 23, 42];
const COLOR_MUTED = [100, 116, 139];
const COLOR_LIVE = [34, 211, 238];
const COLOR_DONE = [52, 211, 153];
const COLOR_KNOCKOUT = [245, 158, 11];

function formatTime(time) {
  if (!time) return '—';
  return time.slice(0, 5);
}

function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return date;
  }
}

function resolveTeamName(side, match, teams, allMatches, standings) {
  const team = getDisplayTeam(side, match, teams, allMatches, standings);
  return team?.name || (side === 'home' ? match.homeLabel : match.awayLabel) || '—';
}

function scoreCell(match) {
  if (match.status === 'validated') return `${match.scoreHome} - ${match.scoreAway}`;
  if (match.status === 'live') return `LIVE ${match.scoreHome ?? 0}-${match.scoreAway ?? 0}`;
  return 'vs';
}

function statusColor(match) {
  if (match.status === 'validated') return COLOR_DONE;
  if (match.status === 'live') return COLOR_LIVE;
  return COLOR_MUTED;
}

// ============================================================
// Header de page
// ============================================================
function renderHeader(doc, tournament, subtitle) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, pageW, 4, 'F');

  doc.setTextColor(...COLOR_DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FOOTPLANNER', 14, 15);

  doc.setFontSize(14);
  doc.text(tournament.name || 'Tournoi', 14, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED);
  const metaParts = [];
  if (tournament.date) metaParts.push(formatDate(tournament.date));
  if (tournament.location) metaParts.push(tournament.location);
  if (tournament.category) metaParts.push(`Catégorie ${tournament.category}`);
  doc.text(metaParts.join('   ·   '), 14, 30);

  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(subtitle, 14, 38);
  }

  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(14, 42, pageW - 14, 42);

  return 48;
}

function renderFooter(doc, tournament) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COLOR_MUTED);
  doc.setLineWidth(0.1);
  doc.line(14, pageH - 14, pageW - 14, pageH - 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED);

  if (tournament.accessCode) {
    doc.text(
      `Code spectateur : ${tournament.accessCode}   ·   Suivez le tournoi en direct sur l'app FootPlanner`,
      14,
      pageH - 8,
    );
  }

  const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
  const pageCount = doc.internal.getNumberOfPages();
  doc.text(`Page ${pageNum}/${pageCount}`, pageW - 14, pageH - 8, { align: 'right' });
}

function renderMatchTable(doc, autoTable, matches, teams, allMatches, standings, startY) {
  if (matches.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_MUTED);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun match pour cette section.', 14, startY + 4);
    return startY + 12;
  }

  const rows = matches.map(m => {
    const home = resolveTeamName('home', m, teams, allMatches, standings);
    const away = resolveTeamName('away', m, teams, allMatches, standings);
    return [
      formatTime(m.time),
      m.field || '—',
      home,
      scoreCell(m),
      away,
      m.referee || '—',
    ];
  });

  autoTable(doc, {
    head: [['Heure', 'Terrain', 'Équipe 1', 'Score', 'Équipe 2', 'Arbitre']],
    body: rows,
    startY,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3, textColor: COLOR_DARK },
    headStyles: {
      fillColor: COLOR_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 16, halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      4: { halign: 'left', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'left', textColor: COLOR_MUTED },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const m = matches[data.row.index];
        data.cell.styles.textColor = statusColor(m);
      }
    },
  });

  return doc.lastAutoTable.finalY;
}

// ============================================================
// Génération — planning complet (par poule + phase finale)
// ============================================================
export async function generateSchedulePdf(tournament, teams, matches) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const standings = computeStandings(teams, matches, tournament);

  const sortByTime = (a, b) => {
    const ta = (a.time || '99:99').slice(0, 5);
    const tb = (b.time || '99:99').slice(0, 5);
    return ta.localeCompare(tb);
  };

  const pools = [...new Set(teams.map(t => t.pool))].sort();
  let isFirstPage = true;

  pools.forEach(pool => {
    const poolMatches = matches.filter(m => m.phase === 'pool' && m.pool === pool).sort(sortByTime);
    if (poolMatches.length === 0) return;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    const poolTeams = teams.filter(t => t.pool === pool);
    const subtitle = `Planning des matchs — Poule ${pool} (${poolTeams.length} équipes)`;
    let y = renderHeader(doc, tournament, subtitle);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_DARK);
    doc.text('Équipes engagées :', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    const namesLine = poolTeams.map(t => t.isHost ? `* ${t.name}` : t.name).join('   ·   ');
    const splitText = doc.splitTextToSize(namesLine, doc.internal.pageSize.getWidth() - 28);
    doc.text(splitText, 14, y + 5);
    y += 5 + splitText.length * 4 + 4;

    renderMatchTable(doc, autoTable, poolMatches, teams, matches, standings, y);
    renderFooter(doc, tournament);
  });

  // Phase finale
  const knockoutMatches = matches
    .filter(m => m.phase === 'knockout')
    .sort((a, b) => {
      const order = ['r16', 'qf', 'sf', 'final', '3rd'];
      const oa = order.indexOf(a.knockoutRound);
      const ob = order.indexOf(b.knockoutRound);
      if (oa !== ob) return oa - ob;
      return (a.knockoutIndex || 0) - (b.knockoutIndex || 0);
    });

  if (knockoutMatches.length > 0) {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    let y = renderHeader(doc, tournament, 'Phase finale — Élimination directe');

    const grouped = {};
    knockoutMatches.forEach(m => {
      const key = m.knockoutRound || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });

    const order = ['r16', 'qf', 'sf', 'final', '3rd'];
    order.forEach(roundKey => {
      const roundMatches = grouped[roundKey];
      if (!roundMatches || roundMatches.length === 0) return;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR_KNOCKOUT);
      doc.text(knockoutRoundLabel(roundKey), 14, y + 4);
      y += 7;

      y = renderMatchTable(doc, autoTable, roundMatches, teams, matches, standings, y);
      y += 6;

      if (y > doc.internal.pageSize.getHeight() - 30) {
        renderFooter(doc, tournament);
        doc.addPage();
        y = renderHeader(doc, tournament, 'Phase finale — Élimination directe (suite)');
      }
    });

    renderFooter(doc, tournament);
  }

  if (isFirstPage) {
    renderHeader(doc, tournament, 'Planning du tournoi');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_MUTED);
    doc.text('Aucun match programmé pour ce tournoi.', 14, 60);
    renderFooter(doc, tournament);
  }

  return doc;
}

// ============================================================
// Génération — planning d'une seule poule
// ============================================================
export async function generatePoolPdf(tournament, teams, matches, poolName) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const standings = computeStandings(teams, matches, tournament);

  const poolTeams = teams.filter(t => t.pool === poolName);
  const poolMatches = matches
    .filter(m => m.phase === 'pool' && m.pool === poolName)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const subtitle = `Planning — Poule ${poolName} (${poolTeams.length} équipes)`;
  let y = renderHeader(doc, tournament, subtitle);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_DARK);
  doc.text('Équipes engagées :', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  const namesLine = poolTeams.map(t => t.isHost ? `* ${t.name}` : t.name).join('   ·   ');
  const splitText = doc.splitTextToSize(namesLine, doc.internal.pageSize.getWidth() - 28);
  doc.text(splitText, 14, y + 5);
  y += 5 + splitText.length * 4 + 6;

  renderMatchTable(doc, autoTable, poolMatches, teams, matches, standings, y);
  renderFooter(doc, tournament);

  return doc;
}

// ============================================================
// Génération — résumé compact (1 page) tout le tournoi
// ============================================================
export async function generateSummaryPdf(tournament, teams, matches) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const standings = computeStandings(teams, matches, tournament);

  let y = renderHeader(doc, tournament, 'Planning complet du tournoi');

  const all = [...matches].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const rows = all.map(m => {
    const home = resolveTeamName('home', m, teams, matches, standings);
    const away = resolveTeamName('away', m, teams, matches, standings);
    let phaseLabel = '—';
    if (m.phase === 'pool') phaseLabel = `P.${m.pool} J${m.round}`;
    else if (m.phase === 'knockout') phaseLabel = knockoutRoundLabel(m.knockoutRound);
    return [
      formatTime(m.time),
      m.field || '—',
      phaseLabel,
      home,
      scoreCell(m),
      away,
    ];
  });

  autoTable(doc, {
    head: [['Heure', 'Terrain', 'Phase', 'Équipe 1', 'Score', 'Équipe 2']],
    body: rows,
    startY: y,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: {
      fillColor: COLOR_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      5: { halign: 'left', fontStyle: 'bold' },
    },
    didDrawPage: () => renderFooter(doc, tournament),
  });

  return doc;
}

// ============================================================
// Helpers de téléchargement
// ============================================================
function safeFilename(s) {
  return (s || 'tournoi')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function downloadSchedulePdf(tournament, teams, matches) {
  const doc = await generateSchedulePdf(tournament, teams, matches);
  doc.save(`planning-${safeFilename(tournament.name)}.pdf`);
}

export async function downloadPoolPdf(tournament, teams, matches, pool) {
  const doc = await generatePoolPdf(tournament, teams, matches, pool);
  doc.save(`planning-${safeFilename(tournament.name)}-poule-${pool}.pdf`);
}

export async function downloadSummaryPdf(tournament, teams, matches) {
  const doc = await generateSummaryPdf(tournament, teams, matches);
  doc.save(`resume-${safeFilename(tournament.name)}.pdf`);
}

export const pdfService = {
  generateSchedulePdf,
  generatePoolPdf,
  generateSummaryPdf,
  downloadSchedulePdf,
  downloadPoolPdf,
  downloadSummaryPdf,
};
