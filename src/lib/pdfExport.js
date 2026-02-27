import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isInTrash, normalizeDossier, sumPayments } from './compat'
import { loadSettings } from '../components/modals/SettingsModal'

function addCabinetHeader(doc, settings) {
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text(settings.cabinet_nom || 'GeoMan', pageWidth / 2, 18, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    const lines = []
    if (settings.cabinet_adresse) lines.push(settings.cabinet_adresse)
    const contact = [settings.cabinet_telephone, settings.cabinet_email].filter(Boolean).join(' | ')
    if (contact) lines.push(contact)
    if (settings.cabinet_agrement) lines.push(`N° Agrement: ${settings.cabinet_agrement}`)

    let y = 25
    lines.forEach((line) => {
        doc.text(line, pageWidth / 2, y, { align: 'center' })
        y += 4
    })

    doc.setDrawColor(29, 138, 255)
    doc.setLineWidth(0.5)
    doc.line(14, y + 2, pageWidth - 14, y + 2)
    return y + 8
}

export function exportDossiersPdf(rows) {
    const settings = loadSettings()
    const doc = new jsPDF('landscape', 'mm', 'a4')
    const startY = addCabinetHeader(doc, settings)

    const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Liste des Dossiers', 14, startY)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${dateStr} — ${rows.length} dossier(s)`, 14, startY + 5)

    const headers = ['No Dossier', 'Nom', 'Endroit', 'Date finale', 'Tel', 'Montant', 'Encaisse', 'Depot CAD', 'Etat']
    const body = rows.filter((r) => !isInTrash(r)).map((raw) => {
        const r = normalizeDossier(raw) || raw
        const enc = sumPayments(r.paiements, r.encaisse)
        return [
            r.id,
            r.nom,
            r.endroit || '-',
            r.date_finale || '-',
            r.telephone || '-',
            `${Number(r.montant || 0).toLocaleString()} DA`,
            `${enc.toLocaleString()} DA`,
            r.depot_cad || '-',
            r.etat || '-',
        ]
    })

    autoTable(doc, {
        startY: startY + 9,
        head: [headers],
        body,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [29, 138, 255], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
    })

    doc.save(`geoman-dossiers-${dateStr}.pdf`)
}

export function exportStatsPdf(rows) {
    const settings = loadSettings()
    const doc = new jsPDF('portrait', 'mm', 'a4')
    const startY = addCabinetHeader(doc, settings)

    const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })

    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Rapport Statistique', 14, startY)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text(`Genere le ${dateStr}`, 14, startY + 5)

    let y = startY + 14

    const active = rows.filter((r) => !isInTrash(r))
    const totalMontant = active.reduce((s, r) => s + Number(r.montant || 0), 0)
    const totalEncaisse = active.reduce((s, r) => s + sumPayments(r.paiements, r.encaisse), 0)
    const reste = Math.max(totalMontant - totalEncaisse, 0)

    const stats = [
        ['Total dossiers', String(rows.length)],
        ['Dossiers actifs', String(active.length)],
        ['Montant attendu', `${totalMontant.toLocaleString()} DA`],
        ['Montant encaisse', `${totalEncaisse.toLocaleString()} DA`],
        ['Reste a encaisser', `${reste.toLocaleString()} DA`],
        ['Taux recouvrement', totalMontant > 0 ? `${((totalEncaisse / totalMontant) * 100).toFixed(1)}%` : '0%'],
    ]

    autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Valeur']],
        body: stats,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [29, 138, 255], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
        theme: 'grid',
    })

    // Outstanding balances
    const outstanding = active.filter((r) => {
        const m = Number(r.montant || 0)
        const e = sumPayments(r.paiements, r.encaisse)
        return m > e && m > 0
    })

    if (outstanding.length > 0) {
        const prevY = doc.lastAutoTable?.finalY || y + 40
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.text('Soldes impayés', 14, prevY + 10)

        autoTable(doc, {
            startY: prevY + 14,
            head: [['No Dossier', 'Nom', 'Montant', 'Encaisse', 'Reste']],
            body: outstanding.map((r) => {
                const enc = sumPayments(r.paiements, r.encaisse)
                return [
                    r.id,
                    r.nom,
                    `${Number(r.montant || 0).toLocaleString()} DA`,
                    `${enc.toLocaleString()} DA`,
                    `${Math.max(Number(r.montant || 0) - enc, 0).toLocaleString()} DA`,
                ]
            }),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [255, 77, 109], textColor: 255, fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
        })
    }

    doc.save(`geoman-statistiques-${dateStr}.pdf`)
}

export function exportReceiptPdf(dossier, payment) {
    const settings = loadSettings()
    const doc = new jsPDF('portrait', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const startY = addCabinetHeader(doc, settings)

    // Title
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('QUITTANCE DE PAIEMENT', pageWidth / 2, startY + 4, { align: 'center' })

    if (payment.receipt_number) {
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.text(`N°: ${payment.receipt_number}`, pageWidth / 2, startY + 10, { align: 'center' })
    }

    let y = startY + 20

    // Dossier info
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Informations du dossier', 14, y)
    y += 6

    const info = [
        ['N° Dossier', dossier.id],
        ['Nom et Prenom', dossier.nom],
        ['Endroit', dossier.endroit || '-'],
        ['Telephone', dossier.telephone || '-'],
    ]

    autoTable(doc, {
        startY: y,
        body: info,
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        margin: { left: 14, right: 14 },
        theme: 'plain',
    })

    y = doc.lastAutoTable?.finalY + 8 || y + 30

    // Payment info
    doc.setFont(undefined, 'bold')
    doc.text('Details du paiement', 14, y)
    y += 6

    const payInfo = [
        ['Date', payment.date_paiement || payment.date || '-'],
        ['Montant verse', `${Number(payment.montant_paye || payment.montant || 0).toLocaleString()} DA`],
        ['Jalon', payment.etape || '-'],
        ['Mode de paiement', payment.mode_paiement || '-'],
        ['Notes', payment.notes || '-'],
    ]

    autoTable(doc, {
        startY: y,
        body: payInfo,
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        margin: { left: 14, right: 14 },
        theme: 'plain',
    })

    y = doc.lastAutoTable?.finalY + 20 || y + 40

    // Signature box
    doc.setDrawColor(180)
    doc.rect(pageWidth - 80, y, 66, 28)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Signature et cachet', pageWidth - 47, y + 5, { align: 'center' })

    // Date
    const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })
    doc.text(`Fait le ${dateStr}`, 14, y + 10)

    doc.save(`quittance-${dossier.id}-${payment.receipt_number || 'paiement'}.pdf`)
}
