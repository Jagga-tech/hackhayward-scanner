/**
 * HackHayward 2026 — Omi AI Pickup Scanner
 * Google Apps Script (paste this into your Google Sheet's Apps Script editor)
 *
 * CONFIGURATION: Update these constants to match your sheet layout.
 */

const SHEET_NAME = 'Form Responses 1'; // Name of the sheet tab with form responses

// Column indices (1-based) — matches your actual sheet layout:
// A=Timestamp | B=Full Name | C=Email | D=Devpost | E=University
// F=Team Nickname | G=Omi device plan | H=Picked Up | I=Pickup Timestamp
const COL = {
  NAME: 2,        // B — Full Name
  EMAIL: 3,       // C — Email
  DEVPOST: 4,     // D — Devpost Username
  UNIVERSITY: 5,  // E — University / College
  TEAM: 6,        // F — Team Nickname (optional)
  OMI_PLAN: 7,    // G — How do you plan to use the Omi device
  PICKED_UP: 8,   // H — add this column header: "Picked Up"
  PICKUP_TIME: 9  // I — add this column header: "Pickup Timestamp"
};

// ─── WEB APP ENTRY POINT ───
function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'verify':
        result = verifyParticipant(e.parameter.email);
        break;
      case 'pickup':
        result = markPickedUp(e.parameter.email);
        break;
      case 'stats':
        result = getStats();
        break;
      default:
        result = { error: 'Unknown action' };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── VERIFY PARTICIPANT ───
function verifyParticipant(email) {
  if (!email) return { found: false, error: 'No email provided' };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    const rowEmail = String(data[i][COL.EMAIL - 1]).toLowerCase().trim();
    if (rowEmail === emailLower) {
      const pickedUp = data[i][COL.PICKED_UP - 1] === true ||
                       String(data[i][COL.PICKED_UP - 1]).toUpperCase() === 'TRUE';
      return {
        found: true,
        pickedUp: pickedUp,
        name: data[i][COL.NAME - 1],
        email: data[i][COL.EMAIL - 1],
        university: data[i][COL.UNIVERSITY - 1],
        devpost: data[i][COL.DEVPOST - 1],
        team: data[i][COL.TEAM - 1]
      };
    }
  }

  return { found: false };
}

// ─── MARK AS PICKED UP ───
function markPickedUp(email) {
  if (!email) return { success: false, error: 'No email provided' };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    const rowEmail = String(data[i][COL.EMAIL - 1]).toLowerCase().trim();
    if (rowEmail === emailLower) {
      const row = i + 1; // Sheet rows are 1-based
      sheet.getRange(row, COL.PICKED_UP).setValue(true);
      sheet.getRange(row, COL.PICKUP_TIME).setValue(new Date());
      return { success: true };
    }
  }

  return { success: false, error: 'Participant not found' };
}

// ─── GET STATS ───
function getStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  let registered = 0;
  let pickedUp = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][COL.EMAIL - 1]) {
      registered++;
      if (data[i][COL.PICKED_UP - 1] === true ||
          String(data[i][COL.PICKED_UP - 1]).toUpperCase() === 'TRUE') {
        pickedUp++;
      }
    }
  }

  return { registered, pickedUp };
}

// ─── SEND QR CODES VIA EMAIL ───
// Run this manually: Run → sendQRCodes
function sendQRCodes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  let sent = 0;

  for (let i = 1; i < data.length; i++) {
    const name = data[i][COL.NAME - 1];
    const email = String(data[i][COL.EMAIL - 1]).trim();
    const university = data[i][COL.UNIVERSITY - 1] || '';
    const devpost = data[i][COL.DEVPOST - 1] || '';
    const team = data[i][COL.TEAM - 1] || '';

    if (!email || !email.includes('@')) continue;

    // Build QR content string
    const qrContent = `HACKHAYWARD2026 | Name: ${name} | Email: ${email} | University: ${university} | Devpost: ${devpost} | Team: ${team}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrContent)}`;

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;text-align:center;">
        <h2 style="color:#7c3aed;">HackHayward 2026</h2>
        <p>Hey <strong>${name}</strong>! 🎉</p>
        <p>Here's your QR code for picking up your <strong>Omi AI wearable device</strong> at the event.</p>
        <p>Show this QR code to staff at the Omi AI pickup station:</p>
        <img src="${qrUrl}" alt="Your QR Code" style="width:300px;height:300px;margin:16px 0;border-radius:12px;">
        <p style="color:#666;font-size:13px;">Do not share this QR code with others.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;">HackHayward 2026 · CSU East Bay</p>
      </div>
    `;

    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Your HackHayward 2026 Omi AI Pickup QR Code 🎉',
        htmlBody: htmlBody
      });
      sent++;
      Utilities.sleep(500); // Rate limiting
    } catch (e) {
      Logger.log('Failed to send to ' + email + ': ' + e.message);
    }
  }

  Logger.log('Sent QR codes to ' + sent + ' participants.');
  SpreadsheetApp.getUi().alert('Done! Sent QR codes to ' + sent + ' participants.');
}
