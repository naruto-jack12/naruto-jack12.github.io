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

    today.innerHTML =  "今天是：" + year + "年" + month + "月" + day + "日 " + weekday[week] + " " + hour  + ":" + minute  + ":" + second;
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