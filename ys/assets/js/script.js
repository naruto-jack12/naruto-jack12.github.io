let $obj = {
    date: new Date(),
    // daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    year: 0,
    month: 0,
    day: 0,
    workList: ["白(1)", "夜(1)", "下夜(1)", "白(2)", "夜(2)", "下夜(2)", "休(1)", "休(2)"],
    fistWorkDay: ['2023', '4', '07'],
    // workList: [1, 2, 3, 21, 22, 23, 0, 0],
    count: 0,
    works: document.querySelector("#js_html"),
    alert: "今天是：",
    timeErr: "",
    init() {
        this.year = this.date.getFullYear();
        this.month = this.date.getMonth() + 1;
        this.day = this.date.getDate();

        this.timeErr = "请查询设定日期(" + this.fistWorkDay[0] + "年" + this.fistWorkDay[1] + "月" + this
            .fistWorkDay[2] + "日" + ")之后的日期"
        this.query();
        this.workTime(this.fistWorkDay[0], this.fistWorkDay[1], this.fistWorkDay[2]);
    },
    query() {
        document.querySelector(".btn").addEventListener("click", () => {
            let queryDate = document.querySelector("#inputDate").value;
            let queryDateArr = queryDate.split('-');
            this.year = queryDateArr[0];
            this.month = Number(queryDateArr[1]);
            this.day = queryDateArr[2];
            this.count = 0;

            if (queryDate != '') {
                this.alert = this.year + "年" + this.month + "月" + this.day + "日 是：";

                let workDate = new Date(this.fistWorkDay[0], (this.fistWorkDay[1] - 1), this
                    .fistWorkDay[2]);
                let searchDate = new Date(queryDateArr[0], (Number(queryDateArr[1]) - 1),
                    queryDateArr[2]);

                let thistoday = new Date(this.date.getFullYear(),this.date.getMonth(),this.date.getDate());
                if(searchDate.getTime() == thistoday.getTime()) {
                    this.alert = "今天是：";
                }

                if (searchDate.getTime() >= workDate.getTime()) {
                    this.workTime(this.fistWorkDay[0], this.fistWorkDay[1], this.fistWorkDay[2]);
                } else {
                    alert(this.timeErr);
                }
            }

            document.querySelector("#inputDate").value = "";
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth() + 1;
            this.day = this.date.getDate();


        });
    },
    workTime(workYear, workMonth, workDay) {
        let workDate = new Date(workYear, (workMonth - 1), workDay);
        let today = new Date(this.year, (this.month - 1), this.day);

        this.count = Math.abs(workDate.getTime() - today.getTime());
        this.count = Math.floor(this.count / (24 * 3600 * 1000));

        // alert(this.alert + this.workList[this.count % this.workList.length]);
        this.works.innerText = this.alert + this.workList[this.count % this.workList.length]
    }
}

$obj.init();