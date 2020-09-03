var rollData;
var strength, presentCount=0, absentCount=0, durationAbsentCount=0, totalCount=0;
var absentees = [];

//reading data from JSON file
fetch("./data/itdata.json")
.then(res => res.json())
.then(data => {          
    rollData = data;
})
.catch(err => console.error(err));



function formatData() {

    //consolidating time and splitting regno and name
    attendanceData.forEach(record => {
        record.duration = (record.time.reduce((a,b) => a+b, 0)).toFixed(2);
        record.percentage = ((record.duration/meetingTime)*100).toFixed(0);
        var splitArray = record.name.split("-");
        if(splitArray.length == 1) {
            record.name = splitArray[0];
            record.regno = "Faculty/Others";
        } else {
            if(splitArray[0].toUpperCase().indexOf("BQ")) {
                record.regno = splitArray[0];
                record.name = splitArray[1];
            }
        }        
    });
   
}

function checkAttendance() {    
    var data;
    var report = [];

    console.log(selectedYear);      
    if(selectedYear === '2'){
        data = rollData.IIYEAR;
    } else if(selectedYear === '3') {
        data = rollData.IIIYEAR;
    } else if(selectedYear === '4') {
        data = rollData.IVYEAR;
    }  
    strength = data.length;
   
    data.forEach(student => {
        var result = attendanceData.filter(record => record.regno.toUpperCase() === student.regno.toUpperCase())
        if(result.length > 0) {
            if(parseInt(result[0].percentage) < parseInt(criteria) ) {
                report.push({ "regno" : result[0].regno, "name": result[0].name, "duration": result[0].duration, "percentage": result[0].percentage, "attendance":"A"});
                durationAbsentCount++;
                absentees.push(result[0].regno);
            } else {
                report.push({ "regno" : result[0].regno, "name": result[0].name, "duration": result[0].duration, "percentage": result[0].percentage, "attendance":"P"});
                presentCount++;
            }
            
        }
        else {
            report.push({ "regno" : student.regno, "name": student.name, "duration": 0, "percentage": "0", "attendance":"A"});
            absentCount++;
            absentees.push(student.regno);
        }
        totalCount++; 
    });

    var others = attendanceData.filter(record => record.regno === "Faculty/Others");
    if(others.length > 0){
        others.forEach(attendee => {
            report.push({ "regno" : attendee.regno, "name": attendee.name, "duration": attendee.duration, "percentage": attendee.percentage, "attendance":"P"});
            totalCount++;
        })
    }

    return report;
    
}