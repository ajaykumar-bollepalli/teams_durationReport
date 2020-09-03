function exportToExcel(){

    //creating workbook
    var wb = XLSX.utils.book_new();

    var ws0 = XLSX.utils.aoa_to_sheet(meetingDetails);           

    //pushing sheets name
    wb.SheetNames.push("Teams Attendance Report");
    wb.SheetNames.push("Attendance Summary");

    //converting the HTML table to excel worksheet using  table_to_sheet from SheetJS library
    var ws1 = XLSX.utils.table_to_sheet(document.getElementById('reportTable'));
    var ws2 = XLSX.utils.table_to_sheet(document.getElementById('summaryTable'));

    let a = XLSX.utils.sheet_to_json(ws0, { header: 1 });
    let b = XLSX.utils.sheet_to_json(ws2, { header: 1 });
       
    a = a.concat(['']).concat(b);
      
    let worksheet = XLSX.utils.json_to_sheet(a);

    //adding worksheets to workbook
    wb.Sheets["Teams Attendance Report"] = ws1;
    wb.Sheets["Attendance Summary"] = worksheet;

    //Writing the Workbook to binary format
    var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});

    //function to create a BLOB from binary stream
    function s2ab(s) {
                    var buf = new ArrayBuffer(s.length);
                    var view = new Uint8Array(buf);
                    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
                    return buf;
    }

    //calling saveAs function for the user to be able to download the Blob(workbook)
    saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'Attendance_' + new Date(meetingStartTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}) + '.xlsx' );
}