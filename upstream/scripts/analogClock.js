///////////////////////////////////////////////////////////////////////////
//////////////////////  ANALOG CLOCK FUNCTIONS  ///////////////////////////
/////////////////  Clock code used from W3Schools.com  ////////////////////
////////  Refer to their site about applicable use of the code  ///////////
///////////////////////////////////////////////////////////////////////////

var canvas = document.getElementById("analog-clock");
var ctx = canvas.getContext("2d");
var radius = canvas.height / 2;
ctx.translate(radius, radius);
radius = radius * 0.9;
setInterval(drawClock, 1000);

// add 0 to single digit time min, sec
function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  } // add zero in front of numbers < 10
  return i;
}

function drawClock() {
  drawFace(ctx, radius);
  drawNumbers(ctx, radius);
  drawTime(ctx, radius);
}

function drawFace(ctx, radius) {
  var grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill();
  grad = ctx.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.05);
  grad.addColorStop(0, "#333");
  grad.addColorStop(0.5, "white");
  grad.addColorStop(1, "#333");
  ctx.strokeStyle = grad;
  ctx.lineWidth = radius * 0.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
  ctx.fillStyle = "#333";
  ctx.fill();
}

function drawNumbers(ctx, radius) {
  var ang;
  var num;
  ctx.font = radius * 0.15 + "px arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (num = 1; num < 13; num++) {
    ang = (num * Math.PI) / 6;
    ctx.rotate(ang);
    ctx.translate(0, -radius * 0.85);
    ctx.rotate(-ang);
    ctx.fillText(num.toString(), 0, 0);
    ctx.rotate(ang);
    ctx.translate(0, radius * 0.85);
    ctx.rotate(-ang);
  }
}

function drawTime(ctx, radius) {
  var deviceClock = new Date();
  var hour = deviceClock.getHours();
  var minute = deviceClock.getMinutes();
  var second = deviceClock.getSeconds();

  var ampm = hour >= 12 ? "P.M." : "A.M.";
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  //minute = minute < 10 ? '0'+minute : minute;

  // CHECKTIME FUNC ADDS LEADING '0' if <10
  hour = checkTime(hour);
  minute = checkTime(minute);
  second = checkTime(second);

  //digital time display
  var myDigTime = hour + ":" + minute + ":" + second;
  document.getElementById("myTime").innerHTML = myDigTime + " " + ampm;

  var dd = deviceClock.getDate();
  var mm = deviceClock.getMonth();
  mm++; //Increment because Jan is month 0
  dd = checkTime(dd);
  mm = checkTime(mm);
  var yyyy = deviceClock.getFullYear();

  var todaysDate = mm + "/" + dd + "/" + yyyy;
  document.getElementById("myDate").innerHTML = "Today: " + todaysDate;

  // OFFSET
  var utcOffset = deviceClock.getTimezoneOffset() / 60;
  if (utcOffset > 0) {
    utcOffset = "(UTC-" + utcOffset + ")";
  } else {
    utcOffset = "(UTC+" + Math.abs(utcOffset) + ")";
  }
  document.getElementById("myTimeTitle").innerHTML = utcOffset;

  //hour
  hour = hour % 12;
  hour =
    (hour * Math.PI) / 6 +
    (minute * Math.PI) / (6 * 60) +
    (second * Math.PI) / (360 * 60);
  drawHand(ctx, hour, radius * 0.5, radius * 0.07);
  //minute
  minute = (minute * Math.PI) / 30 + (second * Math.PI) / (30 * 60);
  drawHand(ctx, minute, radius * 0.8, radius * 0.07);
  // second
  second = (second * Math.PI) / 30;
  drawHand(ctx, second, radius * 0.9, radius * 0.02);
}

function drawHand(ctx, pos, length, width) {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.moveTo(0, 0);
  ctx.rotate(pos);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.rotate(-pos);
}
