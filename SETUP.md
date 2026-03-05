# HackHayward 2026 — Omi AI Pickup Scanner Setup

## How It Works

1. Participants register via your Google Form → data goes to Google Sheet
2. Apps Script in the Sheet sends QR codes to participants via email
3. At the event, staff opens the scanner on their phone
4. Staff scans QR → app verifies against the Sheet → marks as picked up
5. All staff devices share the same data in real-time via the Sheet

---

## Step 1: Add the Apps Script to Your Google Sheet

1. Open your Google Sheet that receives form responses
2. Go to **Extensions → Apps Script**
3. Delete any existing code and paste the entire contents of `apps-script.js` (below)
4. Update the `SHEET_NAME` constant if your sheet tab is not named `"Form Responses 1"`
5. Update the column letters to match your sheet layout

## Step 2: Deploy the Apps Script as a Web App

1. In Apps Script, click **Deploy → New deployment**
2. Click the gear icon → select **Web app**
3. Set:
   - **Description**: HackHayward Scanner API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Authorize** when prompted (review permissions)
6. Copy the **Web app URL** — you'll need this for the scanner

## Step 3: Use the Scanner

1. Open https://jagga-tech.github.io/hackhayward-scanner/
2. Enter staff password: `hackhayward2026`
3. Paste the Apps Script web app URL when prompted
4. Start scanning!

Each staff device needs to enter the URL once — it's saved locally.

---

## Apps Script Code

Copy the contents of `apps-script.js` into your Google Sheet's Apps Script editor.

### Column Mapping

The script expects these columns in your sheet (adjust the letters in the code if different):

| Column | Data |
|--------|------|
| A | Timestamp |
| B | Full Name |
| C | Email |
| D | Devpost Username |
| E | University / College |
| F | Team Nickname (optional) |
| G | How do you plan to use the Omi device in your project? |
| H | Picked Up (TRUE/FALSE) — **add this column** |
| I | Pickup Timestamp — **add this column** |

> **Important:** Add columns H ("Picked Up") and I ("Pickup Timestamp") to your sheet manually. The script will write to these columns when staff marks pickups.

---

## QR Code Email Script

The `apps-script.js` file also includes a `sendQRCodes()` function that:
- Reads all registrations from the sheet
- Generates a QR code for each participant
- Emails the QR code to each participant

Run it manually from Apps Script: **Run → sendQRCodes**

---

## Troubleshooting

- **"Participant not found"**: Check that the email in the QR matches exactly what's in the sheet
- **CORS errors**: Make sure the Apps Script is deployed as "Anyone" can access
- **Camera not working**: Must be served over HTTPS (GitHub Pages handles this)
