const inputSection = document.getElementById("input-div");
const reportSection = document.getElementById("report-div");
const spinner = document.getElementById("spinner");

spinner.style.display = 'none';
reportSection.style.display = 'none';

const input = document.querySelector('input[type="file"]');


var attendanceData;
var meetingStartTime;
var meetingEndTime;
var meetingTime;
var organizer;
var criteria;
var attendeesCount;
var selectedYear
var meetingDetails = [];


//Main Function
function generate() {
    criteria = document.getElementById("highlight").value;
    selectedYear = document.getElementById("selectedYear").value;

    //Reading date and time values
    var edate = document.getElementById('edate').value;
    var etime = document.getElementById('etime').value;

    //checking for date and Time values
    if(edate !== '' && etime !== '') {
        //reading the User entered Meeting End time.
        meetingEndTime = Date.parse(new Date(edate + "T" + etime));  
        
        //checking whether year is selected or not
        if(validateYear() && validateCriteria())
        {
            //checking whether user has selected a file
            if(input.files[0]) 
            {
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

    attendanceData = consolodatedOutput;


    //Populating a table with attendee name and time present in meeting.
    printTable();
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

function printTable() {
    
    organizer = attendanceData[0].name;
    attendeesCount = attendanceData.length;

    attendanceData.sort(compare);
    formatData();
    var report = checkAttendance();

    //clearing previous report data, if any
    var area = document.getElementById('reportArea');
    area.innerHTML = "";

    //printing Meeting details
    var dorg = "<span><i class='fas fa-user-clock'></i>  Organizer: <strong>" + organizer + "</strong></span><br>";
    var dst= "<span><i class='far fa-play-circle'></i>  Meeting Start time: <strong>" + new Date(meetingStartTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}) + "</strong></span><br>";
    var det= "<span><i class='far fa-stop-circle'></i>  Meeting End time: <strong>" + new Date(meetingEndTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}) + "</strong></span><br>";
    var dd = "<span><i class='far fa-clock'></i>  Duration: <strong>" + meetingTime.toFixed(2) + " minutes </strong></span><br>";
    var du = "<span><i class='fas fa-users'></i> Attendees: <strong>" + attendeesCount + "</strong></span>";
        
    meetingDetails.push(["Organizer", "Meeting Start Time", "Meeting End Time", "Duration", "Attendees"]);
    meetingDetails.push([organizer, new Date(meetingStartTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}), new Date(meetingEndTime).toLocaleString("en-US", {timeZone: "Asia/Kolkata"}), meetingTime.toFixed(2), attendeesCount ])
    
    
    var detArea = document.getElementById('detailSection');
    detArea.innerHTML = dorg + dst + det + dd + du;

    //creating Summary details table
    var summaryTable = document.createElement('table');
    summaryTable.id = "summaryTable";
    summaryTable.classList.add("table");
    //stable.classList.add("table-borderless");

    var sthr = document.createElement('tr');
    sthr.innerHTML = "<th>Class/Batch strength</th> <th>Students Present</th> <th>Complete Absent (0%)</th> <th>Absent (Present for &lt;"+criteria.toString()+"%)</th> <th>Faculty/Others</th>";
    
    var stdr = document.createElement('tr');
    stdr.innerHTML = "<td>"+strength.toString()+"</td><td>"+presentCount.toString()+"</td><td>"+absentCount.toString()+"</td><td>"+durationAbsentCount.toString()+"</td><td>"+(report.length-strength).toString()+"</td>";

    summaryTable.appendChild(sthr);
    summaryTable.appendChild(stdr);

    area.appendChild(summaryTable);

    var absenteeDetails = document.createElement('div');
    absenteeDetails.classList.add('alert', 'alert-danger');
    absenteeDetails.innerHTML = "<h4>Absentees RegNo. ("+ (absentCount+durationAbsentCount).toString() +")</h4>" + absentees;

    area.appendChild(absenteeDetails);

    //creating a table and adding styling
    var reportTable = document.createElement('table');
    reportTable.id = "reportTable";
    reportTable.classList.add("table");

    //creating header row
    var tr = document.createElement('tr');
    tr.innerHTML = "<th>S.No</th><th>Reg No.</th><th>Student Name</th><th>Duration (in minutes)</th><th>Percentage</th><th>Attendance</th>";

    //appending header to table
    reportTable.appendChild(tr);

    var n = 1;

    //creating a table row for each record and appending it to table
    report.forEach(function(row) {
        var tr = document.createElement('tr');

        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        var td4 = document.createElement('td');
        var td5 = document.createElement('td');
        var td6 = document.createElement('td');

        var sno = document.createTextNode(n);
        n++;
        var regno = document.createTextNode(row.regno);
        var name = document.createTextNode(row.name);

        //checking whether the attendee joined after the given end time
        if(row.duration >= 0) {
            time = document.createTextNode(row.duration.toString());
            percent = document.createTextNode(row.percentage.toString() + "%");            
        }
        else {
            time = document.createTextNode('Joined after End Time.!');
            percent = document.createTextNode("NA");
        }    
        
        var attend = document.createTextNode(row.attendance);

        td1.appendChild(sno);
        td2.appendChild(regno)
        td3.appendChild(name);
        td4.appendChild(time);
        td5.appendChild(percent);
        td6.appendChild(attend);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tr.appendChild(td6);

        if(parseInt(row.percentage) < parseInt(criteria)) {
            tr.classList.add("highlight");
        }            

        reportTable.appendChild(tr);
    });

    area.appendChild(reportTable);
}

function validateYear() {
    if(selectedYear != '' ) 
        return true;
    else {
        alert("Select Year.!");
        return false;
    }
}

function validateCriteria() {
    if(criteria != '' ) 
        return true;
    else {
        criteria = 1;
        return true;
    }
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