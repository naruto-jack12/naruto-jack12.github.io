window.WorkListTime = function( options ) {

    //  SCOPE
    /// ---------------------------      
    var that  =   this;


    //  OPTIONS
    /// ---------------------------  
    options                     = options || {};
    options.date                = options.hasOwnProperty('date') ? options.date : new Date();
    options.year                = options.hasOwnProperty('year') ? options.year : 0;
    options.month               = options.hasOwnProperty('month') ? options.month : 0;
    options.day                 = options.hasOwnProperty('day') ? options.day : 0;
    options.fistWorkDay         = options.hasOwnProperty('fistWorkDay') ? options.fistWorkDay : ['2023', '4', '07'];
    options.workList            = options.hasOwnProperty('workList') ? options.workList : [1, 2, 3, 21, 22, 23, 0, 0];
    options.count               = options.hasOwnProperty('count') ? options.count : 0;
    options.works               = options.hasOwnProperty('works') ? options.works : document.querySelector("#js_html");
    options.alert               = options.hasOwnProperty('alert') ? options.alert : "今天是：";
    options.timeErr             = options.hasOwnProperty('timeErr') ? options.timeErr : "";
    options.queryDate           = options.hasOwnProperty('queryDate') ? options.queryDate : document.querySelector("#inputDate");
    options.queryBtn            = options.hasOwnProperty('queryBtn') ? options.queryBtn : document.querySelector(".btn");


    /// --------------------------- 


    this.init = function() {
        options.year = options.date.getFullYear();
        options.month = options.date.getMonth() + 1;
        options.day = options.date.getDate();

        options.timeErr = "请查询设定日期(" + options.fistWorkDay[0] + "年" + options.fistWorkDay[1] + "月" + options.fistWorkDay[2] + "日" + ")之后的日期";
    
        that.query();
        that.workTime(options.fistWorkDay[0], options.fistWorkDay[1], options.fistWorkDay[2]);
    };

    this.query = function() {
        options.queryBtn.addEventListener("click", () => {
            let queryDate = options.queryDate.value;
            let queryDateArr = queryDate.split('-');
            options.year = queryDateArr[0];
            options.month = Number(queryDateArr[1]);
            options.day = queryDateArr[2];
            options.count = 0;

            if (queryDate != '') {
                options.alert = options.year + "年" + options.month + "月" + options.day + "日 是：";

                let workDate = new Date(options.fistWorkDay[0], (options.fistWorkDay[1] - 1), options
                    .fistWorkDay[2]);
                let searchDate = new Date(queryDateArr[0], (Number(queryDateArr[1]) - 1),
                    queryDateArr[2]);

                let thistoday = new Date(options.date.getFullYear(),options.date.getMonth(),options.date.getDate());
                if(searchDate.getTime() == thistoday.getTime()) {
                    options.alert = "今天是：";
                }

                if (searchDate.getTime() >= workDate.getTime()) {
                    that.workTime(options.fistWorkDay[0], options.fistWorkDay[1], options.fistWorkDay[2]);
                } else {
                    alert(options.timeErr);
                }
            }

            document.querySelector("#inputDate").value = "";
            options.year = options.date.getFullYear();
            options.month = options.date.getMonth() + 1;
            options.day = options.date.getDate();


        });
    };

    this.workTime = function(workYear, workMonth, workDay) {
        let workDate = new Date(workYear, (workMonth - 1), workDay);
        let today = new Date(options.year, (options.month - 1), options.day);

        options.count = Math.abs(workDate.getTime() - today.getTime());
        options.count = Math.floor(options.count / (24 * 3600 * 1000));

        options.works.innerText = options.alert + options.workList[options.count % options.workList.length]
    };


    this.init();
}

var initWorkListTime = new WorkListTime({
    fistWorkDay: ['2023', '4', '07'],
    workList: ["白(1)", "夜(1)", "下夜(1)", "白(2)", "夜(2)", "下夜(2)", "休(1)", "休(2)"],
});