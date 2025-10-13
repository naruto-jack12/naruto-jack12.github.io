class DateCalculator {
    /**
    * 构造函数
    *
    * @param {Date} testDate - 用于测试的日期对象，默认为null
    */
    constructor(testDate = null) {
        // 统一管理当前时间，便于测
        this._currentDate = testDate || new Date();
        this.currentDay = this._currentDate.getDate();
        this.daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        this.weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        this.init();
    }

    /**
     * 获取当前日期（统一入口，便于测试）
     * @returns {Date} 当前日期对象
     */
    getCurrentDate() {
        return new Date(this._currentDate);
    }

    /**
     * 获取实时日期（用于时间显示）
     * @returns {Date} 实时日期对象
     */
    getRealTimeDate() {
        return new Date();
    }

    /**
     * 更新当前日期（用于日期变化时更新计数）
     */
    updateCurrentDate() {
        this._currentDate = new Date();
        this.currentDay = this._currentDate.getDate();
    }

    /**
     * 设置测试日期（仅用于测试）
     * @param {Date} testDate - 测试日期
     */
    setTestDate(testDate) {
        this._currentDate = new Date(testDate);
        this.currentDay = this._currentDate.getDate();
        this.updateLeapYear();
    }

    /**
     * 初始化类实例
     */
    init() {
        this.updateLeapYear();
        this.startTimers();
        this.updateAllDisplays();
    }

    /**
     * 格式化数字，小于10的数字前面补0
     * @param {number} num - 需要格式化的数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        return num < 10 ? `0${num}` : num.toString();
    }

    /**
     * 判断是否为闰年
     * @param {number} year - 年份
     * @returns {boolean} 是否为闰年
     */
    getLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    /**
     * 更新闰年信息，调整2月份的天数
     */
    updateLeapYear() {
        const year = this._currentDate.getFullYear();
        this.daysInMonth[1] = this.getLeapYear(year) ? 29 : 28;
    }

    /**
     * 检查是否需要更新日期计数（日期是否发生变化）
     * @returns {boolean} 是否需要更新日期计数
     */
    shouldUpdateDateCount() {
        const now = this.getRealTimeDate();
        return now.getDate() !== this.currentDay;
    }

    /**
     * 计算两个日期之间的天数差
     * @param {Date} targetDate - 目标日期
     * @returns {number} 天数差
     */
    calculateDaysBetween(targetDate) {
        const timeDiff = Math.abs(targetDate.getTime() - this._currentDate.getTime());
        return Math.ceil(timeDiff / (24 * 3600 * 1000));
    }

    /**
     * 获取距离本月月底的天数
     * @returns {number} 距离月底的天数
     */
    getDaysToMonthEnd() {
        const currentMonth = this._currentDate.getMonth();
        const currentDay = this._currentDate.getDate();
        const monthEndDay = this.daysInMonth[currentMonth];
        return currentDay === monthEndDay ? 0 : monthEndDay - currentDay;
    }

    /**
     * 获取距离本周六的天数
     * @returns {number} 距离周六的天数
     */
    getDaysToWeekend() {
        const currentWeekday = this._currentDate.getDay();
        if (currentWeekday === 0) return 6; // 周日到周六
        if (currentWeekday === 6) return 7; // 周六到下周天
        return 6 - currentWeekday; // 周一到周五到周六
    }

    /**
     * 获取距离本周日的天数
     * @returns {number} 距离周日的天数
     */
    getDaysToSunday() {
        const currentWeekday = this._currentDate.getDay();
        return currentWeekday === 0 ? 7 : 7 - currentWeekday;
    }

    /**
     * 更新今天日期和时间的显示（实时更新）
     */
    updateTodayDisplay() {
        const todayElement = document.querySelector(".today");
        if (!todayElement) return;

        const now = this.getRealTimeDate();
        const year = now.getFullYear();
        const month = this.formatNumber(now.getMonth() + 1);
        const day = this.formatNumber(now.getDate());
        const weekday = this.weekdays[now.getDay()];
        const hours = this.formatNumber(now.getHours());
        const minutes = this.formatNumber(now.getMinutes());
        const seconds = this.formatNumber(now.getSeconds());

        todayElement.innerHTML = 
            `今天是：${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * 更新距离周末的天数显示
     */
    updateWeekendDisplay() {
        const weekendElement = document.querySelector(".weekendBreak");
        if (weekendElement) {
            weekendElement.innerHTML = `距离周六还有：${this.getDaysToWeekend()}天`;
        }
    }

    /**
     * 更新距离周日的天数显示
     */
    updateSundayDisplay() {
        const sundayElement = document.querySelector(".singleBreak");
        if (sundayElement) {
            sundayElement.innerHTML = `距离周天还有：${this.getDaysToSunday()}天`;
        }
    }

    /**
     * 更新距离月底的天数显示
     */
    updateMonthEndDisplay() {
        const monthEndElement = document.querySelector(".endMonth");
        if (monthEndElement) {
            const daysLeft = this.getDaysToMonthEnd();
            const monthEndDay = this.daysInMonth[this._currentDate.getMonth()];
            monthEndElement.innerHTML = 
                `距离月底（${monthEndDay}号）还有：${daysLeft}天`;
        }
    }

    /**
     * 更新距离指定日期的天数显示
     */
    updateSpecificDays() {
        const rangeElements = document.querySelectorAll(".rangeDay");
        rangeElements.forEach(element => {
            const targetDay = parseInt(element.dataset.range);
            const currentDay = this._currentDate.getDate();
            let daysLeft;

            if (targetDay >= currentDay) {
                daysLeft = targetDay - currentDay;
            } else {
                const nextMonth = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, targetDay);
                daysLeft = this.calculateDaysBetween(nextMonth);
            }

            element.innerHTML = `距离${targetDay}号还有：${daysLeft}天`;
        });
    }

    /**
     * 更新农历日期显示
     */
    updateLunarDisplay() {
        const lunarElement = document.querySelector(".lunartoday");
        if (!lunarElement) return;

        const lunar = calendar.solar2lunar(
            this._currentDate.getFullYear(),
            this._currentDate.getMonth() + 1,
            this._currentDate.getDate()
        );
        if (!lunar) return;

        const festivalHtml = this.getFestivalHtml(lunar);
        lunarElement.innerHTML = 
            `${lunar.gzYear}(${lunar.Animal})年 ${lunar.IMonthCn}${lunar.IDayCn}  ` +
            `${lunar.gzMonth}月${lunar.gzDay}日  ${lunar.astro}${festivalHtml}`;
    }

    /**
     * 生成农历节日HTML内容
     * @param {Object} lunar - 农历日期对象
     * @returns {string} 节日HTML字符串
     */
    getFestivalHtml(lunar) {
        let html = '';
        if (lunar.festival) {
            html += ` <span class="festival">${lunar.festival}</span>`;
        }
        if (lunar.lunarFestival) {
            html += ` <span class="festival lunar">${lunar.lunarFestival}</span>`;
        }
        if (lunar.isTerm) {
            html += ` <span class="term">${lunar.Term}</span>`;
        }
        return html;
    }

    /**
     * 计算距离农历节日的天数
     * @param {number} month - 农历月份
     * @param {number} day - 农历日期
     * @returns {number} 距离节日的天数
     */
    calculateLunarFestivalDays(month, day) {
        let festival = calendar.lunar2solar(this._currentDate.getFullYear(), month, day);
        let festivalDate = new Date(festival.date);

        if (festivalDate < this._currentDate) {
            festival = calendar.lunar2solar(this._currentDate.getFullYear() + 1, month, day);
            festivalDate = new Date(festival.date);
        }

        return this.calculateDaysBetween(festivalDate);
    }

    /**
     * 计算距离公历节日的天数
     * @param {number} month - 公历月份
     * @param {number} day - 公历日期
     * @returns {number} 距离节日的天数
     */
    calculateSolarFestivalDays(month, day) {
        let festivalDate = new Date(this._currentDate.getFullYear(), month - 1, day);
        
        if (festivalDate < this._currentDate) {
            festivalDate = new Date(this._currentDate.getFullYear() + 1, month - 1, day);
        }

        return this.calculateDaysBetween(festivalDate);
    }

    /**
     * 计算距离节气的天数
     * @param {string} termName - 节气名称
     * @returns {number} 距离节气的天数
     */
    calculateSolarTermsDays(termName) {
        const termIndex = calendar.solarTerm.indexOf(termName) + 1;
        const month = Math.ceil(termIndex / 2);
        let day = calendar.getTerm(this._currentDate.getFullYear(), termIndex);
        
        let termDate = new Date(this._currentDate.getFullYear(), month - 1, day);
        
        if (termDate < this._currentDate) {
            day = calendar.getTerm(this._currentDate.getFullYear() + 1, termIndex);
            termDate = new Date(this._currentDate.getFullYear() + 1, month - 1, day);
        }

        return this.calculateDaysBetween(termDate);
    }

    /**
     * 更新所有节日相关显示
     */
    updateFestivalDisplays() {
        this.updateLunarFestivals();
        this.updateSolarFestivals();
        this.updateSolarTerms();
        this.updateClosestFestival();
    }

    /**
     * 更新农历节日显示
     */
    updateLunarFestivals() {
        const elements = document.querySelectorAll(".lunarFestival");
        elements.forEach(element => {
            const month = parseInt(element.dataset.month);
            const day = parseInt(element.dataset.day);
            const festival = calendar.lunar2solar(this._currentDate.getFullYear(), month, day);
            
            if (festival && festival.lunarFestival) {
                const daysLeft = this.calculateLunarFestivalDays(month, day);
                element.innerHTML = `距离${festival.lunarFestival}还有：${daysLeft}天`;
            }
        });
    }

    /**
     * 更新公历节日显示
     */
    updateSolarFestivals() {
        const elements = document.querySelectorAll(".solarFestival");
        elements.forEach(element => {
            const month = parseInt(element.dataset.month);
            const day = parseInt(element.dataset.day);
            const festival = calendar.solar2lunar(this._currentDate.getFullYear(), month, day);
            
            if (festival && festival.festival) {
                const daysLeft = this.calculateSolarFestivalDays(month, day);
                element.innerHTML = `距离${festival.festival}还有：${daysLeft}天`;
            }
        });
    }

    /**
     * 更新节气显示
     */
    updateSolarTerms() {
        const elements = document.querySelectorAll(".solarTerms");
        elements.forEach(element => {
            const termName = element.dataset.terms;
            const daysLeft = this.calculateSolarTermsDays(termName);
            element.innerHTML = `距离${termName}还有：${daysLeft}天`;
        });
    }

    /**
     * 更新最近节日的显示
     */
    updateClosestFestival() {
        const closestElement = document.querySelector(".closest-date");
        if (!closestElement) return;

        const closestFestival = this.findClosestFestival();
        if (closestFestival) {
            closestElement.innerHTML = 
                `距离下一个节日<span class="festival"> ${closestFestival.name} </span>还有：<span>${closestFestival.days}</span>天`;
        }
    }

    /**
     * 查找最近的节日
     * @returns {Object} 最近的节日对象，包含名称和天数
     */
    findClosestFestival() {
        const festivals = this.getAllFestivals();
        return festivals.sort((a, b) => a.days - b.days)[0];
    }

    /**
     * 获取所有节日的列表
     * @returns {Array} 节日对象数组
     */
    getAllFestivals() {
        const festivals = [];

        // 农历节日
        document.querySelectorAll(".lunarFestival").forEach(element => {
            const month = parseInt(element.dataset.month);
            const day = parseInt(element.dataset.day);
            const festival = calendar.lunar2solar(this._currentDate.getFullYear(), month, day);
            
            if (festival && festival.lunarFestival) {
                festivals.push({
                    name: festival.lunarFestival,
                    days: this.calculateLunarFestivalDays(month, day)
                });
            }
        });

        // 公历节日
        document.querySelectorAll(".solarFestival").forEach(element => {
            const month = parseInt(element.dataset.month);
            const day = parseInt(element.dataset.day);
            const festival = calendar.solar2lunar(this._currentDate.getFullYear(), month, day);
            
            if (festival && festival.festival) {
                festivals.push({
                    name: festival.festival,
                    days: this.calculateSolarFestivalDays(month, day)
                });
            }
        });

        // 节气
        document.querySelectorAll(".solarTerms").forEach(element => {
            const termName = element.dataset.terms;
            festivals.push({
                name: termName,
                days: this.calculateSolarTermsDays(termName)
            });
        });

        return festivals;
    }

    /**
     * 更新日期计数（只在日期变化时调用）
     */
    updateDateCounts() {
        this.updateCurrentDate();
        this.updateLeapYear();
        
        this.updateWeekendDisplay();
        this.updateSundayDisplay();
        this.updateMonthEndDisplay();
        this.updateSpecificDays();
        this.updateLunarDisplay();
        this.updateFestivalDisplays();
    }

    /**
     * 启动定时器
     */
    startTimers() {
        // 每秒更新时间显示
        setInterval(() => {
            this.updateTodayDisplay();
            
            // 检查日期是否变化，如果变化则更新计数
            if (this.shouldUpdateDateCount()) {
                this.updateDateCounts();
            }
        }, 1000);
    }

    /**
     * 初始化所有显示
     */
    updateAllDisplays() {
        this.updateTodayDisplay();
        this.updateDateCounts();
    }
}

// 初始化：DOM加载完成后创建日期计算器实例
document.addEventListener('DOMContentLoaded', () => {
    // 正常使用
    new DateCalculator();
});