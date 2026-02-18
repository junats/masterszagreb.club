import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Receipt, User, CustodyDay } from '@common/types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const PDFService = {
    generateLegalReport: async (receipts: Receipt[], user: User | null, custodyDays: CustodyDay[], dateRange: { start: Date; end: Date }) => {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Expense Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        if (user) {
            doc.text(`Prepared for: ${user.name} (${user.email})`, 14, 35);
        }

        doc.text(`Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`, 14, 40);

        // --- Summary Calculation ---
        let totalAmount = 0;
        let childRelatedAmount = 0;
        let totalItems = 0;

        // Filter receipts within range
        const filteredReceipts = receipts.filter(r => {
            const rDate = new Date(r.date);
            return rDate >= dateRange.start && rDate <= dateRange.end;
        });

        filteredReceipts.forEach(r => {
            totalAmount += r.total;
            r.items.forEach(i => {
                totalItems++;
                if (i.isChildRelated) {
                    childRelatedAmount += i.price;
                }
            });
        });

        // --- Summary Table ---
        autoTable(doc, {
            startY: 50,
            head: [['Summary Metric', 'Value']],
            body: [
                ['Total Expenses', `€${totalAmount.toFixed(2)}`],
                ['Child Related Expenses', `€${childRelatedAmount.toFixed(2)}`],
                ['Total Transactions', filteredReceipts.length.toString()],
                ['Total Items', totalItems.toString()],
            ],
            theme: 'grid',
            headStyles: { fillColor: [51, 65, 85] }, // Slate 700
            styles: { fontSize: 10, cellPadding: 5 },
        });

        // --- Custody Summary ---
        const filteredCustody = custodyDays.filter(d => {
            const dDate = new Date(d.date);
            return dDate >= dateRange.start && dDate <= dateRange.end;
        });

        const totalDays = filteredCustody.length;
        const daysWithUser = filteredCustody.filter(d => d.withYou).length;
        const custodyPercentage = totalDays > 0 ? (daysWithUser / totalDays) * 100 : 0;

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Custody Metric', 'Value']],
            body: [
                ['Total Days in Period', totalDays.toString()],
                ['Days with Primary Parent (You)', daysWithUser.toString()],
                ['Custody Percentage', `${custodyPercentage.toFixed(1)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234] }, // Purple 600
            styles: { fontSize: 10, cellPadding: 5 },
        });

        // --- Detailed Transactions ---
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Detailed Itemized Transactions', 14, finalY);

        const tableData = filteredReceipts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => {
            const childItems = r.items.filter(i => i.isChildRelated).map(i => i.name).join(', ');
            const isChildRelated = r.items.some(i => i.isChildRelated);

            return [
                new Date(r.date).toLocaleDateString(),
                r.storeName,
                `€${r.total.toFixed(2)}`,
                isChildRelated ? 'YES' : 'No',
                childItems || '-'
            ];
        });

        autoTable(doc, {
            startY: finalY + 10,
            head: [['Date', 'Merchant', 'Amount', 'Child Related', 'Description/Items']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }, // Blue 500
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 'auto' },
            }
        });

        // --- Activities & Notes ---
        const activities = filteredCustody.filter(d => d.note || (d.activities && d.activities.length > 0));
        if (activities.length > 0) {
            const actY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('Co-Parenting Activities & Notes', 14, actY);

            const ActTableData = activities.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.status,
                d.note || '-',
                d.activities?.map(a => a.title).join(', ') || '-'
            ]);

            autoTable(doc, {
                startY: actY + 10,
                head: [['Date', 'Status', 'Notes', 'Activities']],
                body: ActTableData,
                theme: 'striped',
                headStyles: { fillColor: [236, 72, 153] }, // Pink 500
                styles: { fontSize: 9, cellPadding: 4 },
            });
        }

        // --- Legal Certification ---
        const certY = (doc as any).lastAutoTable.finalY + 25;
        if (certY > 230) {
            doc.addPage();
            doc.text('Certification (continued)', 14, 20);
        } else {
            doc.line(14, certY - 10, 196, certY - 10);
        }

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text('Declaration and Certification:', 14, certY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const certText = "I hereby certify that the information provided in this report is a true and accurate reflection of the expenses recorded within the TrueTrack application for the specified period. This report is generated for record-keeping and legal verification purposes.";
        doc.text(doc.splitTextToSize(certText, 180), 14, certY + 7);

        doc.text('Signature:', 14, certY + 30);
        doc.line(35, certY + 30, 100, certY + 30);
        doc.text('Date:', 120, certY + 30);
        doc.line(132, certY + 30, 180, certY + 30);

        // --- Footer ---
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
            doc.text('TrueTrack Financial Verification System • Official Export', 14, doc.internal.pageSize.height - 10);
        }

        // Save / Share
        const filename = `TrueTrack_Report_${dateRange.start.toISOString().split('T')[0]}_${dateRange.end.toISOString().split('T')[0]}.pdf`;

        if (Capacitor.isNativePlatform()) {
            try {
                // For native platforms, we need to save the file and then share it
                const pdfBase64 = doc.output('datauristring').split(',')[1];

                const saveResult = await Filesystem.writeFile({
                    path: filename,
                    data: pdfBase64,
                    directory: Directory.Cache,
                });

                await Share.share({
                    title: 'TrueTrack Legal Export',
                    text: 'Here is your TrueTrack Legal Export PDF.',
                    url: saveResult.uri,
                    dialogTitle: 'Export PDF'
                });
            } catch (e) {
                console.error('Failed to share PDF on native platform:', e);
                throw e;
            }
        } else {
            doc.save(filename);
        }
    }
};
