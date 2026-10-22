import { formatPickupDate, getPickupScheduleStatus } from './pickupRequestService';

export const MONTH_NAMES = [
  { short: 'JAN', full: 'January', monthNum: 1 },
  { short: 'FEB', full: 'February', monthNum: 2 },
  { short: 'MAR', full: 'March', monthNum: 3 },
  { short: 'APR', full: 'April', monthNum: 4 },
  { short: 'MAY', full: 'May', monthNum: 5 },
  { short: 'JUN', full: 'June', monthNum: 6 },
  { short: 'JUL', full: 'July', monthNum: 7 },
  { short: 'AUG', full: 'August', monthNum: 8 },
  { short: 'SEP', full: 'September', monthNum: 9 },
  { short: 'OCT', full: 'October', monthNum: 10 },
  { short: 'NOV', full: 'November', monthNum: 11 },
  { short: 'DEC', full: 'December', monthNum: 12 },
];

/**
 * Builds normalized table rows for citizen collection card
 */
export const buildCardData = (citizenData, requests = [], payments = []) => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const houseName = citizenData?.houseName || userObj.houseName || '';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'N/A';
  const address = citizenData?.address || userObj.address || 'Address Not Set';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Chirakkadavu';
  const ecoPoints = citizenData?.ecoPoints ?? userObj?.ecoPoints ?? 0;

  // Join Date calculation
  const rawJoinDate = citizenData?.createdAt || citizenData?.verifiedAt || userObj.createdAt;
  let joinDateObj = rawJoinDate ? new Date(rawJoinDate) : null;
  if (!joinDateObj || isNaN(joinDateObj.getTime())) {
    joinDateObj = new Date();
  }
  const joinYear = joinDateObj.getFullYear();
  const joinMonth = joinDateObj.getMonth() + 1;

  const currentYear = new Date().getFullYear();
  let maxYear = currentYear;
  requests.forEach((req) => {
    const d = new Date(req.requestedAt || req.collectionDate || req.collectedAt);
    if (!isNaN(d.getFullYear()) && d.getFullYear() > maxYear) {
      maxYear = d.getFullYear();
    }
  });

  const availableYears = [];
  for (let y = joinYear; y <= maxYear; y++) {
    availableYears.push(y);
  }

  // Map requests by "YEAR-MONTH"
  const requestMap = {};
  requests.forEach((req) => {
    const d = new Date(req.requestedAt || req.collectionDate || req.collectedAt);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;
      if (y > joinYear || (y === joinYear && m >= joinMonth)) {
        if (!requestMap[key] || new Date(req.requestedAt) > new Date(requestMap[key].requestedAt)) {
          requestMap[key] = req;
        }
      }
    }
  });

  // Map payments by "YEAR-MONTH"
  const paymentMap = {};
  payments.forEach((pay) => {
    const key = `${pay.year}-${pay.month}`;
    paymentMap[key] = pay;
  });

  const now = new Date();
  const currentYearNow = now.getFullYear();
  const currentMonthNow = now.getMonth() + 1;

  const rows = [];
  availableYears.forEach((year) => {
    const visibleMonths = MONTH_NAMES.filter((m) => {
      if (year === joinYear) return m.monthNum >= joinMonth;
      return true;
    });

    visibleMonths.forEach((m) => {
      const reqKey = `${year}-${m.monthNum}`;
      const req = requestMap[reqKey];
      const payRecord = paymentMap[reqKey];
      const sched = req ? getPickupScheduleStatus(req) : null;

      const isCompleted = sched?.isCompleted;
      const isScheduled = sched?.isScheduled || sched?.isToday;
      const isDue = sched?.isDue || sched?.isReasonSubmitted;
      const isPaidFee = payRecord && (payRecord.status || '').toLowerCase() === 'paid' && (payRecord.paymentMethod !== 'Pay Through Worker' || payRecord.workerApproved !== false);
      const isWorkerPendingFee = payRecord && payRecord.paymentMethod === 'Pay Through Worker' && !isPaidFee;
      const isPastMonth = year < currentYearNow || (year === currentYearNow && m.monthNum < currentMonthNow);
      const isCurrentMonth = year === currentYearNow && m.monthNum === currentMonthNow;

      let dateDisplay = '-';
      if (req?.collectedAt) {
        dateDisplay = new Date(req.collectedAt).toLocaleDateString('en-GB');
      } else if (req?.scheduledDate || req?.collectionDate) {
        dateDisplay = formatPickupDate(req.scheduledDate || req.collectionDate);
      } else if (req?.requestedAt) {
        dateDisplay = new Date(req.requestedAt).toLocaleDateString('en-GB');
      }

      const rtNo = req?.requestId ? req.requestId.replace(/^REQ-?/, '') : '-';
      const fee = '₹50';
      const paymentStatus = isPaidFee ? 'Paid ₹50' : isWorkerPendingFee ? 'Pending Worker Approval ₹50' : isPastMonth ? 'Pending Due ₹50' : 'Unpaid ₹50';

      const verified = isCompleted
        ? 'Verified by Worker'
        : sched?.isReasonSubmitted
          ? `Reason: ${req.dueReason || 'Submitted'}`
          : isDue
            ? 'Due (Overdue)'
            : sched?.isToday
              ? 'Scheduled Today'
              : isScheduled
                ? 'Scheduled'
                : req
                  ? 'Pending'
                  : '-';

      const result = isCompleted
        ? 'Success'
        : isDue
          ? (sched?.isReasonSubmitted ? 'Due (Reason)' : 'Due')
          : isPastMonth
            ? 'Failed'
            : isCurrentMonth
              ? (req ? (sched?.isToday ? 'Pickup Today' : 'In Progress') : 'Pending')
              : '-';

      rows.push({
        year,
        monthName: m.full,
        monthShort: m.short,
        monthNum: m.monthNum,
        dateDisplay,
        rtNo,
        fee,
        paymentStatus,
        isPaidFee,
        isPastMonth,
        verified,
        result,
        isCompleted,
        isDue,
        isCurrentMonth
      });
    });
  });

  return {
    citizenName,
    citizenId,
    houseName,
    houseNumber,
    address,
    wardId,
    panchayatName,
    ecoPoints,
    joinYear,
    joinMonth,
    joinMonthName: MONTH_NAMES.find(m => m.monthNum === joinMonth)?.full || 'January',
    rows,
    totalRecords: rows.length,
    completedCount: rows.filter(r => r.isCompleted).length,
    paidCount: rows.filter(r => r.isPaidFee).length
  };
};

/**
 * Generates an official, printable Haritha Karma Sena Collection Card (PDF)
 * Uses a dedicated, clean printing window styled for high-resolution PDF output
 */
export const downloadCollectionCardPDF = (citizenData, requests = [], payments = []) => {
  const data = buildCardData(citizenData, requests, payments);

  const tableRowsHtml = data.rows.map((row) => {
    const paymentColor = row.isPaidFee ? '#065f46' : row.isPastMonth ? '#991b1b' : '#92400e';
    const paymentBg = row.isPaidFee ? '#ecfdf5' : row.isPastMonth ? '#fef2f2' : '#fffbeb';
    const resultColor = row.isCompleted ? '#065f46' : row.isDue || row.isPastMonth ? '#991b1b' : '#374151';
    const resultBg = row.isCompleted ? '#ecfdf5' : row.isDue || row.isPastMonth ? '#fef2f2' : '#f9fafb';

    return `
      <tr>
        <td style="text-align: center; font-weight: 600;">${row.year}</td>
        <td style="text-align: center; font-weight: 700; color: #065f46; background: #f0fdf4;">${row.monthName}</td>
        <td style="text-align: center; font-family: monospace;">${row.dateDisplay}</td>
        <td style="text-align: center; font-family: monospace; font-weight: 600;">${row.rtNo}</td>
        <td style="text-align: center; font-weight: 700; color: #047857;">${row.fee}</td>
        <td style="text-align: center; font-weight: 700; color: ${paymentColor}; background: ${paymentBg}; border-radius: 4px;">
          ${row.paymentStatus}
        </td>
        <td style="text-align: center; font-size: 11px;">${row.verified}</td>
        <td style="text-align: center; font-weight: 700; color: ${resultColor}; background: ${resultBg};">
          ${row.result}
        </td>
      </tr>
    `;
  }).join('');

  const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Collection_Card_${data.citizenName.replace(/\s+/g, '_')}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 10px;
          font-size: 12px;
          line-height: 1.4;
        }
        .card-container {
          border: 2px solid #047857;
          border-radius: 16px;
          padding: 20px;
          background: #ffffff;
          position: relative;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #047857;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .gov-title {
          font-size: 11px;
          font-weight: 800;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .main-title {
          font-size: 20px;
          font-weight: 900;
          color: #064e3b;
          margin: 4px 0 2px;
        }
        .malayalam-title {
          font-size: 14px;
          font-weight: 800;
          color: #047857;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px 12px;
          background: #f0fdf4;
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-size: 10px;
          color: #047857;
          font-weight: 700;
          text-transform: uppercase;
        }
        .meta-value {
          font-size: 12px;
          color: #111827;
          font-weight: 800;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        th {
          background-color: #064e3b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 8px 6px;
          border: 1px solid #047857;
          text-align: center;
        }
        td {
          padding: 6px 4px;
          border: 1px solid #e5e7eb;
          font-size: 11px;
        }
        tr:nth-child(even) td {
          background-color: #fafafa;
        }
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #d1fae5;
          padding-top: 14px;
          margin-top: 16px;
        }
        .seal-box {
          border: 1px dashed #047857;
          border-radius: 8px;
          padding: 8px 14px;
          text-align: center;
          font-size: 10px;
          color: #065f46;
          font-weight: 700;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 58px;
          font-weight: 900;
          color: rgba(4, 120, 87, 0.04);
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <div class="watermark">HARITHA KARMA SENA • OFFICIAL</div>

        <div class="card-header">
          <div>
            <div class="gov-title">Government of Kerala • Local Self Government Department</div>
            <div class="main-title">User Fee & Collection Card</div>
            <div class="malayalam-title">ഹരിത കർമ്മ സേന • യൂസർ ഫീ കളക്ഷൻ കാർഡ്</div>
            <div style="font-size: 11px; color: #4b5563; font-weight: 600; margin-top: 2px;">
              ${data.panchayatName} Grama Panchayat • ${data.wardId}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #047857; color: white; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 11px; display: inline-block;">
              OFFICIAL CARD
            </div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">
              EcoMind AI Integrated
            </div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">Citizen Name</span>
            <span class="meta-value">${data.citizenName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Citizen ID</span>
            <span class="meta-value" style="font-family: monospace;">${data.citizenId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">House Number</span>
            <span class="meta-value">House #${data.houseNumber} ${data.houseName ? `(${data.houseName})` : ''}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Ward</span>
            <span class="meta-value">${data.wardId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Joining Date</span>
            <span class="meta-value">${data.joinMonthName} ${data.joinYear}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Monthly User Fee</span>
            <span class="meta-value" style="color: #047857;">₹ 50 / Month</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Completed Collections</span>
            <span class="meta-value">${data.completedCount} Drives</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Eco-Points Earned</span>
            <span class="meta-value" style="color: #047857;">${data.ecoPoints} Points</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Year</th>
              <th style="width: 14%;">Month</th>
              <th style="width: 14%;">Pickup Date</th>
              <th style="width: 12%;">Receipt / Rt.No</th>
              <th style="width: 10%;">Fee</th>
              <th style="width: 14%;">Payment Status</th>
              <th style="width: 16%;">Verified by Worker</th>
              <th style="width: 12%;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="card-footer">
          <div style="max-width: 60%; font-size: 10px; color: #4b5563;">
            <strong style="color: #064e3b;">Statutory Notice:</strong> This card certifies payment of monthly user fee and doorstep handover of non-biodegradable waste in accordance with Kerala Plastic Waste Management By-laws. Keep card verified.
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="seal-box">
              HARITHA KARMA SENA<br />AUTHORIZED DIGITAL SEAL
            </div>
            <div style="text-align: center; font-size: 10px; color: #6b7280;">
              Generated on:<br /><strong>${new Date().toLocaleDateString('en-GB')}</strong>
            </div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  // Open hidden print window / iframe to trigger print / PDF save
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    // Fallback: create downloadable HTML file if popups are blocked
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Collection_Card_${data.citizenName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Downloads official Collection Card as an Excel (.xls) spreadsheet
 */
export const downloadCollectionCardExcel = (citizenData, requests = [], payments = []) => {
  const data = buildCardData(citizenData, requests, payments);
  const sanitize = (text) => (text || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const tableRowsHtml = data.rows.map((row) => {
    const paymentBg = row.isPaidFee ? '#d1fae5; color: #065f46;' : row.isPastMonth ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;';
    const resultBg = row.isCompleted ? '#d1fae5; color: #065f46; font-weight: bold;' : row.isDue || row.isPastMonth ? '#fee2e2; color: #991b1b; font-weight: bold;' : '';

    return `
      <tr>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px;">${row.year}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; background: #ecfdf5; color: #065f46;">${sanitize(row.monthName)} (${row.monthShort})</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-family: monospace;">${sanitize(row.dateDisplay)}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-family: monospace;">${sanitize(row.rtNo)}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; color: #065f46;">${sanitize(row.fee)}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; background: ${paymentBg}">${sanitize(row.paymentStatus)}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px;">${sanitize(row.verified)}</td>
        <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; background: ${resultBg}">${sanitize(row.result)}</td>
      </tr>
    `;
  }).join('');

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Collection Card</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        .title { background-color: #0a4d2c; color: #ffffff; font-weight: bold; font-size: 14pt; text-align: center; }
        .subtitle { background-color: #ecfdf5; color: #065f46; font-weight: bold; text-align: center; }
        .meta-label { font-weight: bold; color: #4b5563; background: #f9fafb; border: 1px solid #e5e7eb; }
        .meta-val { font-weight: bold; color: #111827; border: 1px solid #e5e7eb; }
        th { background-color: #0a4d2c; color: #ffffff; font-weight: bold; border: 1px solid #064e3b; padding: 8px; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="8" class="title" height="38">
            യൂസർ ഫീ കളക്ഷൻ കാർഡ് • HARITHA KARMA SENA DOORSTEP COLLECTION CARD
          </td>
        </tr>
        <tr>
          <td colspan="8" class="subtitle" height="24">
            Local Self Government Department (LSGD) • ${sanitize(data.panchayatName)} Grama Panchayat • ${sanitize(data.wardId)}
          </td>
        </tr>
        <tr><td></td></tr>
        <tr>
          <td class="meta-label">Citizen Name:</td>
          <td class="meta-val">${sanitize(data.citizenName)}</td>
          <td class="meta-label">Citizen ID:</td>
          <td class="meta-val">${sanitize(data.citizenId)}</td>
          <td class="meta-label">House:</td>
          <td class="meta-val" colspan="3">${sanitize(data.houseName)} (No: ${sanitize(data.houseNumber)})</td>
        </tr>
        <tr>
          <td class="meta-label">Ward ID:</td>
          <td class="meta-val">${sanitize(data.wardId)}</td>
          <td class="meta-label">Joining Date:</td>
          <td class="meta-val">${sanitize(data.joinMonthName)} ${sanitize(data.joinYear)}</td>
          <td class="meta-label">User Fee:</td>
          <td class="meta-val" colspan="3">₹ 50 / Month</td>
        </tr>
        <tr>
          <td class="meta-label">Export Date:</td>
          <td class="meta-val" colspan="7">${new Date().toLocaleString()}</td>
        </tr>
        <tr><td></td></tr>
        <thead>
          <tr>
            <th>Year</th>
            <th>Month</th>
            <th>Pickup Date</th>
            <th>Receipt / Rt.No</th>
            <th>Fee</th>
            <th>Payment Status</th>
            <th>Verified by Worker</th>
            <th>Collection Result</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Collection_Card_${data.citizenName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  downloadCollectionCardPDF,
  downloadCollectionCardExcel,
  buildCardData
};
