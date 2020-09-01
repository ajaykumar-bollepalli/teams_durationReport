const inputSection = document.getElementById("input-div");
const reportSection = document.getElementById("report-div");
const spinner = document.getElementById("spinner");

spinner.style.display = 'none';
reportSection.style.display = 'none';

const input = document.querySelector('input[type="file"]');

var meetingStartTime;
var meetingEndTime;
var meetingTime;

//Main Function
function generate() {

    //Reading date and time values
    var edate = document.getElementById('edate').value;
    var etime = document.getElementById('etime').value;

    //checking for date and Time values
    if(edate !== '' && etime !== '') {
        //reading the User entered Meeting End time.
        meetingEndTime = Date.parse(new Date(edate + "T" + etime));        

        //checking whether user has selected a file
        if(input.files[0]) {

            //Hiding input-div
            inputSection.style.display = 'none';

            //showing spinner
            spinner.style.display = 'block';

            //Creating a FileReader
            const reader = new FileReader();

            //Function for FileReader onload event - raised when read function is called
            reader.onload = function() {
                
                //splitting the csv (text) file into records
                const records = reader.result.split('\n').map(function(line) {
                    //Splitting individual records
                    return line.split('\t');
                })

                //getting meeting start time (organiser joined time is considered)
                meetingStartTime = Date.parse(records[1][2]);

                //calculating the meeting duration in minutes from start and end times
                meetingTime = ((meetingEndTime - meetingStartTime) / 1000) / 60;

                //Logging to console
                console.log("Start: " + new Date(meetingStartTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
                console.log("End: " + new Date(meetingEndTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
                console.log("Duration: " + meetingTime);

                calculateTime(records, meetingStartTime, meetingEndTime);

                //hiding spinner
                spinner.style.display = 'none';

                //displayig report section
                reportSection.style.display = 'block';
            }

            //calling reader function to read data from file
            reader.readAsText(input.files[0]);
            
        }
        else {
            //No file selected by the user
            alert("Select the Attendance file.!");
        }    
    }
    else {
        //No date or Time provided by user
        alert("You must provide Date and Time");
    }
}       
       
function calculateTime(records, start, end) {

    var timesArray = [];
    var timesArrayIndex = 0;

    //deleting the last empty record
    records.pop();

    //Iterating through every record and mapping Join and Left record times to calculate time.
    //If no Left record found after Join record, meetingEndTime is considered.
    //Loop starts at 1, as 0 is Headers.
    for( var i = 1; i < records.length; i++ ) {

        var currentRow = records[i];
        var nextRow = records[i+1];

        //Checking whether current record is a Join/Join Before record.
        if (! (currentRow[1] === "Left")) { 

            //getting Join time from currentRow
            var joinTime = Date.parse(currentRow[2]);

            //Checking whether the next record belongs to same attendee name (mapping)
            if(nextRow !== undefined && (currentRow[0] === nextRow[0])) { //Has a consecutive row

                //Checking whether the nextRow is a Left record of currentRow Join
                if(nextRow[1]=== "Left") { //Consecutive row is a Left record

                    //getting Left time from nextRow
                    var leftTime = Date.parse(nextRow[2]);

                    //Calculating time and creating the object, adding it to timesArray
                    //Using Join time in currentRow and Left time from nextRow
                    timesArray[timesArrayIndex] = {name: currentRow[0], time: ((leftTime-joinTime)/1000)/60 };
                    timesArrayIndex++;
                }
                else {
                    //Has Left record but no corresponding Join record 
                    //(two consecutive Left records)
                    console.log("Error: Record missing - " + i+1);
                    continue;
                }
            }  
            else {
                //Calculating time and creating the object, adding it to timesArray
                //Using Join time in currentRow and meetingEndTime as there is no corresponding Left record                
                timesArray[timesArrayIndex] = {name: currentRow[0], time: ((end-joinTime)/1000)/60 };
                timesArrayIndex++;
            }                                  
        }
        //Nothing to do if the currentRow is a Left record, just skip it.
    }

    //calling consolidation function to sum to time value for multiple Join-Left records
    var consolodatedOutput = consolidate(timesArray);

    //Populating a table with attendee name and time present in meeting.
    printTable(consolodatedOutput);
}

function compare(a, b) {
    // Use toUpperCase() to ignore character casing
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
  
    let comparison = 0;
    if (nameA > nameB) {
      comparison = 1;
    } else if (nameA < nameB) {
      comparison = -1;
    }
    return comparison;
  }

function consolidate(array) {          
      var output = [];
      
      //Consolidating the duplicates in the array
      array.forEach(function(item) {

        //finding whether this record exists or not
        var existing = output.filter(function(v, i) {
          return v.name == item.name;
        });
        
        //If the current record already exists
        if (existing.length) {
            //finding the index of existing record in output
            var existingIndex = output.indexOf(existing[0]);

            //adding this value to already existing record in outpuut
            output[existingIndex].time = output[existingIndex].time.concat(item.time);
        } 
        else {
            //If the item is occuring first time, making the time value as array to accomodate further values
            if (typeof item.time == 'number')
                item.time = [item.time];
            
            //pushing this item to output as it does not exist
            output.push(item);
        }        
      });
      return output;
}

function printTable(tableData) {

    //clearing previous report data, if any
    var area = document.getElementById('reportArea');
    area.innerHTML = "";

    //printing Meeting details
    var dorg = "<span><i class='fas fa-user-clock'></i>  Organizer: <strong>" + tableData[0].name + "</strong></span><br>";
    var dst= "<span><i class='far fa-play-circle'></i>  Meeting Start time: <strong>" + new Date(meetingStartTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}) + "</strong></span><br>";
    var det= "<span><i class='far fa-stop-circle'></i>  Meeting End time: <strong>" + new Date(meetingEndTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}) + "</strong></span><br>";
    var dd = "<span><i class='far fa-clock'></i>  Duration: <strong>" + meetingTime.toFixed(2) + " minutes </strong></span><br>";
    var du = "<span><i class='fas fa-users'></i> Attendees: <strong>" + tableData.length + "</strong></span>";

    tableData.sort(compare);
    
    var detArea = document.getElementById('detailSection');
    detArea.innerHTML = dorg + dst + det + dd + du;

    //creating a table and adding styling
    var table = document.createElement('table');
    table.id = "reportTable";
    table.classList.add("table");

    //creating header row
    var tr = document.createElement('tr');
    tr.innerHTML = "<th>S.No</th><th>Attendee Name</th><th>Duration (in minutes)</th><th>Percentage of time</th>";

    //appending header to table
    table.appendChild(tr);

    var n = 1;

    //creating a table row for each record and appending it to table
    tableData.forEach(function(row) {
        var tr = document.createElement('tr');

        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        var td4 = document.createElement('td');

        var sno = document.createTextNode(n);
        n++;
        var name = document.createTextNode(row.name);

        var durationValue = (row.time.reduce((a,b) => a+b, 0)).toFixed(2);
        var percentValue = ((durationValue/meetingTime)*100).toFixed(0);
        var time, percent;

        //checking whether the attendee joined after the given end time
        if(durationValue > 0) {
            time = document.createTextNode(durationValue);
            percent = document.createTextNode( percentValue + '%');
        }
        else {
            time = document.createTextNode('Joined after End Time.!');
            percent = document.createTextNode('NA');
        }        

        td1.appendChild(sno);
        td2.appendChild(name);
        td3.appendChild(time);
        td4.appendChild(percent);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);

        if(parseInt(percentValue) < parseInt(document.getElementById("highlight").value)) {
            tr.classList.add("highlight");
        }
            

        table.appendChild(tr);
    });

    area.appendChild(table);
}

function exportToExcel(){

    //converting the HTML table to excel workbook using  table_to_book from SheetJS library
    var wb = XLSX.utils.table_to_book(document.getElementById('reportTable'), {sheet:"Teams Attendance"});

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
    saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'Attendance_' + meetingStartTime + '.xlsx' );
}

function back() {
    //hiding report section
    reportSection.style.display = 'none';

    //resetting input controls
    document.getElementById('edate').value = '';
    document.getElementById('etime').value = '';
    input.value = "";

    //displaying inputsection
    inputSection.style.display = 'block';
}