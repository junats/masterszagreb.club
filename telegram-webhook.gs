function doPost(e) {
  try {
    // Parse the incoming JSON payload from Telegram
    var update = JSON.parse(e.postData.contents);
    
    // Make sure it's a standard text message
    if (update.message && update.message.text) {
      var text = update.message.text;
      
      // Split by either | or newlines
      var parts = text.split(/\\r?\\n|\\|/);
      
      var title = "";
      var date = "TBD";
      var time = "TBD";
      var desc = "";
      
      for (var i = 0; i < parts.length; i++) {
          var segment = parts[i].trim();
          var segmentUpper = segment.toUpperCase();
          if (segmentUpper.indexOf("TITLE:") === 0) {
              title = segment.substring(6).trim();
          } else if (segmentUpper.indexOf("DATE:") === 0) {
              date = segment.substring(5).trim();
          } else if (segmentUpper.indexOf("TIME:") === 0) {
              time = segment.substring(5).trim();
          } else if (segmentUpper.indexOf("DESC:") === 0) {
              desc = segment.substring(5).trim();
          } else if (segmentUpper.indexOf("DESCRIPTION:") === 0) {
              desc = segment.substring(12).trim();
          }
      }
      
      // Only append if we actually found a title. 
      // This prevents commands like "/start" or regular typing from adding empty rows.
      if (title !== "") {
          var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
          sheet.appendRow([title, date, time, desc]);
      }
    }
    
    // Always return a 200 OK to Telegram so it stops retrying the webhook
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.TEXT);
  }
}
