const date = new Date();

var today = document.querySelector(".today");

const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
let week = date.getDay();

// console.log(date);
let year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
// console.log(date.getHours()); // 时
// console.log(date.getMinutes()); // 分
// console.log(date.getSeconds()); // 秒

if (((year % 4) === 0) && ((year % 100) !== 0) || ((year % 400) === 0)) {
    daysInMonth[1] = 29;
}

function numTwo($num) {
    if ($num < 10) {
        $num = "0" + $num;
    }
    return $num;
}

var todayTime = () => {
    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    // 时分秒
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = numTwo(month);
    day = numTwo(day);

    hour = numTwo(hour);
    minute = numTwo(minute);
    second = numTwo(second);

    today.innerHTML = "今天是：" + year + "年" + month + "月" + day + "日 " + weekday[week] + " " + hour + ":" + minute + ":" + second;
}

todayTime();

setInterval(todayTime, 1000);

var weekendBreak = () => {
    let obj = document.querySelector(".weekendBreak");
    let item;
    if (week != 0 && week != 6) {
        item = 6 - week;
    } else {
        if (week == 6) {
            // console.log(7);
            item = 7;
        } else {
            // console.log(6);
            item = 6;
        }
    }

    obj.innerHTML = "距离周六还有：" + item + "天";
}

var singleBreak = () => {
    let obj = document.querySelector(".singleBreak");
    let item;
    if (week != 0) {
        // console.log(7 - week);
        item = 7 - week;
    } else {
        // console.log(7);
        item = 7
    }
    obj.innerHTML = "距离周天还有：" + item + "天";
}

weekendBreak();
singleBreak();

/* 距离当月某日还有多少天 */
var range = ($day) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let count = 0;
    // console.log($day - day);

    // let today = new Date(year, (month - 1), day);

    if ($day >= day) {
        count = $day - day;
    } else {
        let workDate = new Date(year, month, $day);
        count = Math.abs(workDate.getTime() - date.getTime());
        count = Math.ceil(count / (24 * 3600 * 1000));
    }

    // console.log(count);

    return count;
}

// range(1);

var rangeDate = () => {
    // endMonth
    let endMonth = document.querySelector(".endMonth");
    let $endDay = day == daysInMonth[month-1]? '0': range(daysInMonth[month-1]);
    
    endMonth.innerHTML =  "距离月底（" + daysInMonth[month-1] + "号）还有：" + $endDay + "天";


    let rangeDay = document.querySelectorAll(".rangeDay");
    
    for (var i = 0; i< rangeDay.length; i++) {

        let rangeData = rangeDay[i].dataset;
        let $day = rangeData.range;

        rangeDay[i].innerHTML =  "距离" + $day + "号还有：" + range($day) + "天";
    }
}
rangeDate();


var solar = calendar.solar2lunar();
var lunar = calendar.lunar2solar();

// console.log(solar);
// console.log(lunar);

var lunartoday = () => {
    var today = document.querySelector(".lunartoday");
    var $festival = "";
    var $lunarFestival = "";
    var $term = "";

    if (lunar.festival != null) {
        $festival = lunar.festival;
        $festival = ' <span class="festival">' + $festival + '</span>'
    }
    if (lunar.lunarFestival != null) {
        $lunarFestival = lunar.lunarFestival;
        $lunarFestival = ' <span class="festival lunar">' + $lunarFestival + '</span>'
    }

    if(lunar.isTerm) {
        $term = lunar.Term;
        $term = ' <span class="term">' + $term + '</span>'
    }


    today.innerHTML = lunar.gzYear + "(" + lunar.Animal + ")" + "年 " + lunar.IMonthCn + lunar.IDayCn + "  " + lunar.gzMonth + "月" + lunar.gzDay + "日" + "  " +  lunar.astro + $festival + $lunarFestival + $term;
}


lunartoday();



var lunarFestival = ($month, $day) => {
    let festival = calendar.lunar2solar(year, $month, $day);

    let lunarDay = new Date(festival.date);
    let count = 0;


    if (lunarDay.getTime() < date.getTime()) {
        festival = calendar.lunar2solar((year + 1), $month, $day);
        lunarDay = new Date(festival.date);
    }

    // console.log(lunarDay);
    // console.log(date);
    count = Math.abs(lunarDay.getTime() - date.getTime());
    count = Math.ceil(count / (24 * 3600 * 1000));
    // console.log(count);

    return count;
}

// lunarFestival(1,1);


var solarFestival = ($month, $day) => {
    let festival = new Date(year, ($month - 1), $day);
    let count = 0;

    if (festival.getTime() < date.getTime()) {
        festival = new Date((year + 1), ($month - 1), $day);
    }


    count = Math.abs(festival.getTime() - date.getTime());
    count = Math.ceil(count / (24 * 3600 * 1000));
    // console.log(count);

    return count;
}

// solarFestival(1,1);


var festivalDate = () => {
    var lfestival = document.querySelectorAll(".lunarFestival");
    var sfestival = document.querySelectorAll(".solarFestival");

    // console.log(lfestival);
    // console.log(sfestival);


    for (var i = 0; i < lfestival.length; i++) {


        let lfestivalDate = lfestival[i].dataset;
        let $month = lfestivalDate.month;
        let $day = lfestivalDate.day;

        let festival = new Date(year, $month, $day);

        if (festival.getTime() < date.getTime()) {
            festival = calendar.lunar2solar((year + 1), $month, $day);
        } else {
            festival = calendar.lunar2solar(year, $month, $day);
        }


        lfestival[i].innerHTML = "距离" + festival.lunarFestival + "还有：" + lunarFestival($month, $day) + "天";

    }

    for (var j = 0; j < sfestival.length; j++) {

        let sfestivalDate = sfestival[j].dataset;
        let $month = sfestivalDate.month;
        let $day = sfestivalDate.day;

        let festival = new Date(year, $month, $day);

        if (festival.getTime() < date.getTime()) {
            festival = calendar.solar2lunar((year + 1), $month, $day);
        } else {
            festival = calendar.solar2lunar(year, $month, $day);
        }

        sfestival[j].innerHTML = "距离" + festival.festival + "还有：" + solarFestival($month, $day) + "天";
    }
}

festivalDate();

var solarTermsDate = () => {
    var sTerms = document.querySelectorAll(".solarTerms");
    for (let z = 0; z < sTerms.length; z++) {
        let sTermsDate = sTerms[z].dataset.terms;
        let sTermDate = calendar.solarTerm.indexOf(sTermsDate) + 1;
        let $month = Math.ceil(sTermDate / 2);
        let $day = calendar.getTerm(year,sTermDate);

        let solarTerms = new Date(year, ($month - 1), $day);

        if (solarTerms.getTime() < date.getTime()) {
            solarTerms = calendar.solar2lunar((year + 1), $month, $day);
        }else {
            solarTerms = calendar.solar2lunar(year, $month, $day);
        }

        sTerms[z].innerHTML = "距离" + sTermsDate + "还有：" + solarFestival($month, $day) + "天";

    }
}

solarTermsDate();
