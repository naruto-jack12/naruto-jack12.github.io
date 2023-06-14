let date = new Date();
let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
let weekName = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

let year = date.getFullYear();
let month = date.getMonth();
let day = date.getDate();

if (((year % 4) === 0) && ((year % 100) !== 0) || ((year % 400) === 0)) {
    daysInMonth[2] = 29;
}

let boxesList = document.createElement('div');
boxesList.className = "boxes";

let createWeekBox = () => {
    let weeks = document.createElement('div');
    weeks.className = "weeks";
    for (let index = 0; index < 7; index++) {
        // const element = array[index];
        let week = document.createElement('div');
        week.className = "week";
        week.innerHTML = weekName[index];
        weeks.appendChild(week);
    }
    boxesList.appendChild(weeks);
}

let createShowDays = () => {
    let days = document.createElement('div');
    days.className = "days";
    let fistdate = new Date(year, month, 1);
    let fistdateWeek = fistdate.getDay();

    for (let i = 0; i < fistdateWeek; i++) {
        let dayElement = document.createElement('div');
        dayElement.classList = "day no";
        days.appendChild(dayElement);
    }

    for (let d = 1; d <= daysInMonth[month]; d++) {
        let dayElement = document.createElement('div');
        dayElement.className = "day";
        dayElement.innerHTML = d;
        days.appendChild(dayElement);
        
        if (date.getMonth() == month && d == day) {
            dayElement.classList.add("today");
        }
    }
    boxesList.appendChild(days);
}

let boxesTop = document.createElement('div');
boxesTop.className = "boxes-top";

let createBoxesTop = ()=> {
    let lastMonth = document.createElement('div');
    let nextMonth = document.createElement('div');
    lastMonth.classList = "btn last";
    nextMonth.classList = "btn next";
    lastMonth.innerHTML = "last";
    nextMonth.innerHTML = "next";

    let centerMonth = document.createElement('div');
    centerMonth.classList = "month";
    centerMonth.innerHTML = year + "年" + (month + 1) + "月";

    boxesTop.appendChild(lastMonth);
    boxesTop.appendChild(centerMonth);
    boxesTop.appendChild(nextMonth);
}


createWeekBox();
createShowDays();
createBoxesTop();


document.getElementById("app").appendChild(boxesTop);

document.getElementById("app").appendChild(boxesList);


let last = () => {
    document.querySelector('.days').remove();
    if (month > 0) {
        month = month - 1;
    }
    else {
        month = 11;
        year = year - 1;
    }
    createShowDays();
    document.querySelector(".month").innerHTML = year + "年" + (month + 1) + "月";
}

let next = () => {
    document.querySelector('.days').remove();
    if (month < 11) {
        month = month + 1;
    }
    else {
        month = 0;
        year = year + 1;
    }
    createShowDays();
    document.querySelector(".month").innerHTML = year + "年" + (month + 1) + "月";
}


document.querySelector(".last").addEventListener("click",last);
document.querySelector(".next").addEventListener("click",next);