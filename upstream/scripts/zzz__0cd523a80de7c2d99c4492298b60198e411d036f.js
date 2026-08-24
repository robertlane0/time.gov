timeDotGov = {};
timeDotGov.clock = {};
timeDotGov.clockController = {};
timeDotGov.clockController.dsClock = {};

timeDotGov.data = {
  then: null,
  serverTime: null,
  responseTime: null,
  RThalf: null,
  realTimeDif: null,
  requestTime: null,
  leapsecond: null,
  dststart: null,
  dstend: null,
  currYear: null,
  dstDates: null,
  leapDate: null,
  clockinstances: [],
  leapFlag: null,
  leapsec60: null,
  myhour0: "0",
  myhour1: "0",
  mysec0: "0",
  mysec1: "0",
  currentTime: null,
  twentyFour: function () {
    twentyFour = document.getElementById("twenty-four");
    return twentyFour.checked;
  },
};

var offsetCheck = true;
var daylightTitles = false;

// CREATE ARRAY THAT WILL STORE WHICH CLOCK NUMS HAVE BEEN UPDATED
var dstClocksUpdated = [];
timeDotGov.clockController.getParameterByName = function (name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

timeDotGov.clockController.getleapdate = function () {
  var leap = new Date();
  var temp1 = timeDotGov.data.leapdate.split(" ");
  var leapdateYear = temp1[0];
  var leapdateMonth = temp1[1];

  leapdateMonth = leapdateMonth - 1; // month convention = 0-11 (Jan = 0)

  var leapdateDay = temp1[2];

  leap.setUTCFullYear(leapdateYear, leapdateMonth, leapdateDay);
  leap.setUTCHours(0, 0, 0, 0);

  timeDotGov.data.leapsecond = leap.getTime();
};

// GET TIME FROM SERVER
timeDotGov.clockController.dsClock.doRequest = function () {
  d = new Date();
  var xmlHttp = new XMLHttpRequest();

  ////////////////////////////////////////////////////////////////////////////////////
  ////// USE OF THIS .CGI BY OUTSIDE SITES OR APPLICATIONS IS STRICTLY PROHIBITED ////
  // OR USING THE TIME FROM THIS SITE IN ANY WAY FOR OTHER SITES IS ALSO PROHIBITED //
  ///////////////////////////////////////////////////////////////////////////////////
  xmlHttp.open(
    "GET",
    "/zzz__cf531feb08f27f7e62c37402ab35fecb6c64933e.cgi?disablecache=" +
      d.getTime(),
    false,
  );
  xmlHttp.send(null);
  return xmlHttp.responseText;
};

// GET t1, t2, t3, t4 in doRequest AND CALCULATE DELAYS IN doData
timeDotGov.clockController.checkservertime = function () {
  var o = new Object();
  var d = new Date();
  var currentTimeObj = new Date();
  timeDotGov.data.requestTime = currentTimeObj.getTime();
  timeDotGov.data.currentTime = timeDotGov.clockController.dsClock.doRequest(); // GET NIST TIME FROM SERVER
  timeDotGov.clockController.doData();
};
// PARSE DATA FROM AUXDATA.XML
timeDotGov.clockController.doAuxData = function () {
  parser = new DOMParser();
  xmlDoc = parser.parseFromString(timeDotGov.auxdata, "text/xml");
  timeDotGov.data.curryear =
    xmlDoc.getElementsByTagName("currYear")[0].childNodes[0].nodeValue;
  timeDotGov.data.dstdates =
    xmlDoc.getElementsByTagName("DstDates")[0].childNodes[0].nodeValue;
  timeDotGov.data.leapdate =
    xmlDoc.getElementsByTagName("LeapDate")[0].childNodes[0].nodeValue;
};

timeDotGov.clockController.getDSTdates = function () {
  var dstStartDate = new Date();
  var dstEndDate = new Date();
  var temp = timeDotGov.data.dstdates.split(" "); // makes an array of the string elements
  var startmonth = temp[0];

  startmonth = startmonth - 1; // to follow js convention of month = 0-11 (Jan = 0)

  var startday = temp[1];
  var endmonth = temp[2];

  endmonth = endmonth - 1;

  var endday = temp[3];

  dstStartDate.setUTCFullYear(timeDotGov.data.curryear, startmonth, startday);
  dstStartDate.setUTCHours(2, 0, 0, 0);
  dstEndDate.setUTCFullYear(timeDotGov.data.curryear, endmonth, endday);
  dstEndDate.setUTCHours(1, 0, 0, 0);
  timeDotGov.data.dstStart = dstStartDate.getTime();
  timeDotGov.data.dstEnd = dstEndDate.getTime();
};

timeDotGov.clockController.auxdata = function () {
  this.doAuxData();
  this.getDSTdates();
  this.getleapdate();
};

timeDotGov.clockController.doData = function () {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(timeDotGov.data.currentTime, "text/xml");

  var t2 = xmlDoc.getElementsByTagName("timestamp")[0].getAttribute("time2");
  var t3 = xmlDoc.getElementsByTagName("timestamp")[0].getAttribute("time3");
  var serverDelay = Math.round((t3 - t2) / 1000); // server delay in milliseconds
  timeDotGov.data.serverTime = Math.round(t3 / 1000); // Server time in milliseconds

  var currentTimeObj2 = new Date();
  timeDotGov.data.responseTime = currentTimeObj2.getTime(); // t4
  timeDotGov.data.RThalf =
    (timeDotGov.data.responseTime - timeDotGov.data.requestTime - serverDelay) /
    2; // (t4 - t1) - (t3 -t2) NTP EQ
  timeDotGov.data.realTimeDif =
    timeDotGov.data.serverTime - timeDotGov.data.responseTime; // t3-t4 used for correction to local clock for official time

  ////////////////////////////////////////////////////////////
  // USE OFFSET CHECK VAR TO ONLY CHECK CLIENT CLOCK ONCE  ///
  ////////////////////////////////////////////////////////////
  if (offsetCheck) {
    // ROUND TO MILLISECONDS - USE (* -1) to invert timediff pos/neg display value
    var diff = (timeDotGov.data.realTimeDif / 1000) * -1;
    var diffDisplay = diff.toFixed(3);
    if (diffDisplay > 0) {
      diffDisplay = "+" + diffDisplay;
    }
    document.getElementById("realTimeDif").innerHTML = diffDisplay;
    offsetCheck = false;
  }

  timeDotGov.clockController.runningclocks();
  timeDotGov.data.leapFlag = "false";
}; // END OF doData FUNCTION

// REFRESHES CLOCKS AT THE TOP OF EACH *ACTUAL* SECOND
timeDotGov.clockController.runningclocks = function () {
  var deviceClock = new Date();
  var fractionalZone = Math.abs(deviceClock.getTimezoneOffset() / 60) % 1; // IF CLIENT IS IN A ZONE WITH A FRACTIONAL HOUR, MAKE ADJUSTMENT (MODULO 1 TO GET THE FRACTIONAL HOUR)
  if (fractionalZone != 0) {
    fractionalZone = 1 - fractionalZone; // SUBTRACT FROM 1 TO GET VALID CORRECTION FOR 30 AND 45 MIN ZONES
  }
  var fractionalZoneMilli = fractionalZone * 3600000; // CONVERT PARTIAL HOUR TO MILLISECONDS, TO BE SUBTRACTED FROM ADJUSTED TIME
  var s = new Date(); // convert PC time and delay back to seconds (this is UTC)

  s.setTime(
    s.getTime() +
      timeDotGov.data.realTimeDif +
      timeDotGov.data.RThalf -
      fractionalZoneMilli,
  ); // CORRECT FOR PC CLOCK ERROR, HALF NETWORK DELAY AND CLIENT IN PARTIAL TIME ZONE

  var sec = s.getSeconds();
  if (sec != timeDotGov.data.previousSec) {
    // call handleonrefresh as soon as you see a new second
    timeDotGov.data.previousSec = sec;
    timeDotGov.clockController.handleonrefresh(s);
  }
};

// CHECK IF USER CHANGED CLOCK or IF NEW DST STATE or LEAP SECOND, THEN REFRESH ALL CLOCKS
timeDotGov.clockController.handleonrefresh = function (s) {
  //var mins = s.getMinutes();
  var now = s.getTime(); // convert time to ms since epoch (UTC)
  //if (0 <= mins < 30) {
  //  now = now + fractionalZoneMilli;
  //} else {
  //  now = now - fractionalZoneMilli;
  //}

  if (timeDotGov.data.then == null) {
    timeDotGov.data.then = now; // if it's the first round, don't let it fail
  }

  var DidUserChangeClock = Math.abs(now - timeDotGov.data.then);
  if (DidUserChangeClock >= 2000) {
    // if pc clock changed then reset (|now-then| should only be 1 s)
    location.reload();
    timeDotGov.data.then = now;
  } else {
    timeDotGov.data.then = now;
  }

  if (timeDotGov.data.leapsecond / 1000 == Math.floor(now / 1000)) {
    timeDotGov.data.leapFlag = "true";
  }

  var clocks = document.getElementsByClassName("clock");

  var clockNum; // SET TO VALUE OF 'i' IN THE FOLLOWING LOOP TO REPRESENT EACH CLOCK INSTANCE

  // SET ALL OF THE CLOCKS BY CALLING setCurrentTime FOR EACH CLOCK INSTANCE
  for (var i = 0; i < clocks.length; i++) {
    var clock = clocks[i].getElementsByTagName("time")[0];
    var zoneOffset =
      clocks[i].getElementsByTagName("time")[0].getAttribute("zoneOffset") || 0;
    // GIVE VAR CLOCKNUM VALUE OF i
    clockNum = i;
    clock.innerHTML = timeDotGov.clock.setCurrentTime(
      timeDotGov.data.clockinstances[i],
      now,
      timeDotGov.data.twentyFour(),
      timeDotGov.data.dstStart,
      timeDotGov.data.dstEnd,
      zoneOffset,
      timeDotGov.data.leapFlag,
      timeDotGov.data.leapsec60,
      timeDotGov.data.RThalf,
      clockNum,
    );
    document.getElementById("timeUTC").innerHTML =
      timeDotGov.clock.setCurrentTime(
        timeDotGov.data.clockinstances[i],
        now,
        true,
        timeDotGov.data.dstStart,
        timeDotGov.data.dstEnd,
        0,
        timeDotGov.data.leapFlag,
        timeDotGov.data.leapsec60,
        timeDotGov.data.RThalf,
        999,
      ); // LAST VAR IS CLOCKNUM, PASSING AS '999' TO AVOID DUPLICATE 'i' VARIABLE VALUE SEND TO SETCURRENTTIME FUNCTION
  }
}; // END OF handleonrefresh FUNCTION

// CREATES CLOCK DIGITS AND DST/ST LABELS FOR EACH CLOCK INSTANCE
timeDotGov.clock.setCurrentTime = function (
  clock,
  now,
  twentyFour,
  dstStart,
  dstEnd,
  zoneOffset,
  leapFlag,
  leapsec60,
  RThalf,
  clockNum,
) {
  var displayTime = new Date();
  now = now - zoneOffset * 3600000;

  if (leapFlag == "true") {
    now = now - 1000; // if leap has occurred, show (seconds - 1) until next sync
    var leapsec60 = "true"; // var to show a 60 instead of 59
  }

  displayTime.setTime(now);

  var year = displayTime.getUTCFullYear();
  var hourNum = displayTime.getUTCHours();
  var minNum = displayTime.getMinutes();
  var secNum = displayTime.getSeconds();

  // CREATE ARRAY OF THE CLOCK NUMS WHO FOLLOW DST
  // ALSO CREATE ARRAY OF DST LABEL CLASSES  ////////////////////////
  var DSTclocksArray = [0, 1, 6, 7, 8, 9]; // THESE ARE THE clockNums FOR THE ZONES THAT FOLLOW DST
  var dstLabels = document.getElementsByClassName("DSTterm"); // CREATE ARRAY FOR DST LABELS
  var dstLetters = document.getElementsByClassName("DSTletter"); // CREATE ARRAY FOR DST ABBREVIATION
  var dstNums = document.getElementsByClassName("DSTnum"); // CREATE ARRAY FOR DST OFFSET NUM

  if (now >= dstStart && now <= dstEnd) {
    // CHECK IF THIS SECOND IS DST OR NOT

    // CHECK IF CLOCK NUM IS IN DST ARRAY, IF SO, ADD THE DST HOUR AND LABELS
    // if ( DSTclocksArray.includes(clockNum) ) {
    if (DSTclocksArray.indexOf(clockNum) > -1) {
      // indexOf fixes a chance in ie
      hourNum = hourNum + 1;
      //  AT END OF FUNC ADD/PUSH CLOCKNUM TO dstClocksUpdated ARRAY, IF CLOCKNUM IS IN THERE, DONT UPDATE AGAIN
      // if ( !dstClocksUpdated.includes( clockNum ) ) {
      if (dstClocksUpdated.indexOf(clockNum) == -1) {
        // indexOf fixes a chance in ie
        dstLabels[clockNum].innerHTML = "DAYLIGHT";
        dstLetters[clockNum].innerHTML = "D";
        var standardNum = Number(dstNums[clockNum].innerHTML);
        dstNums[clockNum].innerHTML = standardNum - 1;
        dstClocksUpdated.push(clockNum); // ADD CLOCK NUM TO ARRAY OF CLOCKS UPDATED
      }
    }
  }
  // IF DST OR INCREMENTED HOUR GOES INTO NEXT DAY, RESET TO HOUR ZERO AND ADD A DAY
  if (hourNum > 23) {
    hourNum = 0;
    now = now + 3600000; // advance now by one hour
    displayTime.setTime(now); // reset displaytime so day/date/month are correct with new day
  }
  // CHECK FOR AND IMPLEMENT LEAP SECOND
  if (leapFlag == "true") {
    if (leapsec60 == "true") {
      if (minNum == "59") {
        if (secNum == "59") {
          // if leapsec, and 59:59 then show 60 and reset
          secNum = "60";
          leapsec60 = "false";
        }
      }
    }
  }

  var hourLabel = "";

  // 12-HOUR OR 24-HOUR DISPLAY

  // BOX NOT CHECKED SO 12-HOUR DISPLAY
  if (!twentyFour) {
    if (hourNum > 11) {
      hourNum -= 12;
      am_pm = "P.M.";
    } else {
      am_pm = "A.M.";
    }
  } else {
    am_pm = "";
  }

  var newVal;
  // SET HOURS
  if (hourNum > 9) {
    newVal = Number(String(hourNum).charAt(0));
    if (timeDotGov.data.myhour0 != newVal) {
      timeDotGov.data.myhour0 = newVal;
    }
  } else if (Number(timeDotGov.data.myhour0) != 0) {
    timeDotGov.data.myhour0 = "0";
  }

  if (Number(hourNum) > 9) {
    newVal = Number(String(hourNum).charAt(1));
    if (timeDotGov.data.myhour1 != newVal) {
      timeDotGov.data.myhour1 = newVal;
    }
  } else if (Number(timeDotGov.data.myhour1) != Number(hourNum)) {
    timeDotGov.data.myhour1 = Number(hourNum);
  }

  if (hourNum < 1 && !twentyFour) {
    // if not 24hour time force the 12 so it's not 00
    timeDotGov.data.myhour0 = 1;
    timeDotGov.data.myhour1 = 2;
  }

  // SET MINUTES
  if (minNum > 9) {
    newVal = Number(String(minNum).charAt(0));
    if (timeDotGov.data.mymin0 != newVal) {
      timeDotGov.data.mymin0 = newVal;
    }
  } else if (Number(timeDotGov.data.mymin0) != 0) {
    timeDotGov.data.mymin0 = 0;
  }

  if (Number(minNum) > 9) {
    newVal = Number(String(minNum).charAt(1));
    if (timeDotGov.data.mymin1 != newVal) {
      timeDotGov.data.mymin1 = newVal;
    }
  } else if (Number(timeDotGov.data.mymin1) != Number(minNum)) {
    timeDotGov.data.mymin1 = Number(minNum);
  }

  // SET SECONDS
  if (secNum > 9) {
    newVal = Number(String(secNum).charAt(0));
    if (timeDotGov.data.mysec0 != newVal) {
      timeDotGov.data.mysec0 = newVal;
    }
  } else if (Number(timeDotGov.data.mysec0) != 0) {
    timeDotGov.data.mysec0 = 0;
  }

  if (Number(secNum) > 9) {
    newVal = Number(String(secNum).charAt(1));
    if (timeDotGov.data.mysec1 != newVal) {
      timeDotGov.data.mysec1 = newVal;
    }
  } else if (Number(timeDotGov.data.mysec1) != Number(secNum)) {
    timeDotGov.data.mysec1 = Number(secNum);
  }

  // CREATE CLOCK DIGITS STRING TO DISPLAY
  var clockdigits =
    timeDotGov.data.myhour0 +
    "" +
    timeDotGov.data.myhour1 +
    ":" +
    timeDotGov.data.mymin0 +
    timeDotGov.data.mymin1 +
    ":" +
    timeDotGov.data.mysec0 +
    timeDotGov.data.mysec1;
  clock = clockdigits + " " + am_pm;
  return clock;
}; // END OF setCurrentTime FUNCTION
