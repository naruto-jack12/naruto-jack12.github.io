const date = new Date();

var today = document.querySelector(".today");


const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
let week = date.getDay();

console.log(date);
// console.log(date.getHours()); // 时
// console.log(date.getMinutes()); // 分
// console.log(date.getSeconds()); // 秒

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

var SingleBreak = () => {
    let obj = document.querySelector(".SingleBreak");
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
SingleBreak();

/* 距离当月某日还有多少天 */
var range = ($day) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let count = 0;
    // console.log($day - day);

    let today = new Date(year, (month - 1), day);

    if ($day > day) {
        count = $day - day;
    } else {
        let workDate = new Date(year, month, $day);
        count = Math.abs(workDate.getTime() - today.getTime());
        count = Math.floor(count / (24 * 3600 * 1000));
    }

    console.log(count);
}

// range(1);


var solar = calendar.solar2lunar();
var lunar = calendar.lunar2solar();

// var lunar = calendar.solar2lunar(year,10,1);
// console.log(solar);
// console.log(lunar);

var lunartoday = () => {
    var today = document.querySelector(".lunartoday");
    var $festival = "";
    var $lunarFestival = "";

    if (lunar.festival != null) {
        $festival = lunar.festival;
    }
    if (lunar.lunarFestival != null) {
        $lunarFestival = lunar.lunarFestival;
    }

    var festival = ' <span class="festival">' + $festival + $lunarFestival + '</span>';

    today.innerHTML = lunar.gzYear + "(" + lunar.Animal + ")" + "年 " + lunar.IMonthCn + lunar.IDayCn + "  " + lunar.gzMonth + "月" + lunar.gzDay + "日" + festival;
}

lunartoday();



var LunarFestival = ($month, $day) => {
    let festival = calendar.lunar2solar(year, $month, $day);

    let lunarDay = new Date(festival.date);
    let count = 0;


    if (lunarDay.getTime() < date.getTime()) {
        year = year + 1
        festival = calendar.lunar2solar(year, $month, $day);
        lunarDay = new Date(festival.date);
    }

    // console.log(lunarDay);
    // console.log(date);
    count = Math.abs(lunarDay.getTime() - date.getTime());
    count = Math.floor(count / (24 * 3600 * 1000));
    console.log(count);
}

// LunarFestival(1,1);


var solarFestival = ($month, $day) => {
    let festival = new Date(year, $month, $day);
    let count = 0;

    if (festival.getTime() < date.getTime()) {
        year = year + 1
        festival = new Date(year, $month, $day);
    }
    count = Math.abs(festival.getTime() - date.getTime());
    count = Math.floor(count / (24 * 3600 * 1000));
    console.log(count);

}

// solarFestival(1,1);