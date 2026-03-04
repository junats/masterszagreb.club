function doPost(e) {
  try {
    // Twilio sends the SMS text inside e.parameter.Body
    var body = e.parameter.Body || "";
    
    // We expect the user to text something like:
    // "TITLE: Techno Night | DATE: 2026-12-31 | TIME: 22:00 | DESC: Underground beats."
    
    // 1. Split by the pipe delimiter
    var parts = body.split('|');
    
    var title = "";
    var date = "";
    var time = "";
    var desc = "";
    
    // 2. Parse the segments
    for (var i = 0; i < parts.length; i++) {
        var segment = parts[i].trim();
        if (segment.toUpperCase().indexOf("TITLE:") === 0) {
            title = segment.substring(6).trim();
        } else if (segment.toUpperCase().indexOf("DATE:") === 0) {
            date = segment.substring(5).trim();
        } else if (segment.toUpperCase().indexOf("TIME:") === 0) {
            time = segment.substring(5).trim();
        } else if (segment.toUpperCase().indexOf("DESC:") === 0) {
            desc = segment.substring(5).trim();
        }
    }
    
    // 3. Append to the connected spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([title, date, time, desc]);
    
    // 4. Return an empty TwiML response so Twilio knows the message was processed successfully
    var twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    return ContentService.createTextOutput(twiml).setMimeType(ContentService.MimeType.XML);
    
  } catch(error) {
    // In case of an error formatting, log it (visible in Google Apps Script executions)
    var twimlErr = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error parsing event format.</Message></Response>';
    return ContentService.createTextOutput(twimlErr).setMimeType(ContentService.MimeType.XML);
  }
}
