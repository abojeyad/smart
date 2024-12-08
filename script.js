document.addEventListener("DOMContentLoaded", function () {
    // عناصر الأسبوع الأول
    const week1TargetInput = document.getElementById("week1-target");
    const week1AchievedInput = document.getElementById("week1-achieved");
    const week1Percentage = document.getElementById("week1-percentage");
    const week1DailyGoal = document.getElementById("week1-daily-goal");

    // عناصر الأسبوع الثاني
    const week2TargetInput = document.getElementById("week2-target");
    const week2AchievedInput = document.getElementById("week2-achieved");
    const week2Percentage = document.getElementById("week2-percentage");
    const week2DailyGoal = document.getElementById("week2-daily-goal");
    const week2CarriedOver = document.getElementById("week2-carried-over");

    // عناصر الأسبوع الثالث
    const week3TargetInput = document.getElementById("week3-target");
    const week3AchievedInput = document.getElementById("week3-achieved");
    const week3Percentage = document.getElementById("week3-percentage");
    const week3DailyGoal = document.getElementById("week3-daily-goal");
    const week3CarriedOver = document.getElementById("week3-carried-over");

    // عناصر الأسبوع الرابع
    const week4TargetInput = document.getElementById("week4-target");
    const week4AchievedInput = document.getElementById("week4-achieved");
    const week4Percentage = document.getElementById("week4-percentage");
    const week4DailyGoal = document.getElementById("week4-daily-goal");
    const week4CarriedOver = document.getElementById("week4-carried-over");

    // عناصر الهدف الشهري
    const monthlyTargetElement = document.getElementById("monthly-target");
    const monthlyAchievedElement = document.getElementById("monthly-achieved");
    const monthlyPercentageElement = document.getElementById("monthly-percentage");

    // تحديد الأيام المتبقية بناءً على النطاق الأسبوعي
    function calculateRemainingDays(startDay, endDay) {
        const today = new Date().getDate();
        if (today < startDay) return endDay - startDay + 1; // إذا كان اليوم الحالي قبل الأسبوع
        if (today > endDay) return 0; // إذا كان الأسبوع قد انتهى
        return endDay - today + 1; // عدد الأيام المتبقية
    }

    // تحديث القيم الأسبوعية
    function updateWeek(weekTargetInput, weekAchievedInput, weekPercentage, weekDailyGoal, startDay, endDay, carriedOver = 0) {
        const target = parseFloat(weekTargetInput.value) || 0;
        const achieved = parseFloat(weekAchievedInput.value) || 0;

        // حساب الإجمالي المطلوب تحقيقه (المتبقي من الأسبوع السابق + الهدف الجديد)
        const totalRequired = target + carriedOver;

        // حساب النسبة المئوية
        const percentage = totalRequired > 0 ? ((achieved / totalRequired) * 100).toFixed(2) : 0;
        weekPercentage.textContent = `${percentage}%`;

        // حساب الهدف اليومي بناءً على الأيام المتبقية
        const remainingGoal = totalRequired - achieved > 0 ? totalRequired - achieved : 0;
        const remainingDays = calculateRemainingDays(startDay, endDay);
        const dailyGoal = remainingDays > 0 ? remainingGoal / remainingDays : 0;
        weekDailyGoal.textContent = dailyGoal.toFixed(2);

        return remainingGoal; // إرجاع المتبقي لترحيله إلى الأسبوع التالي
    }

    // حساب المبلغ المرحل بين الأسابيع
    function calculateCarriedOver() {
        const week1Remaining = updateWeek(
            week1TargetInput,
            week1AchievedInput,
            week1Percentage,
            week1DailyGoal,
            1,
            8
        );
        week2CarriedOver.textContent = week1Remaining.toFixed(2);

        const week2Remaining = updateWeek(
            week2TargetInput,
            week2AchievedInput,
            week2Percentage,
            week2DailyGoal,
            9,
            16,
            week1Remaining
        );
        week3CarriedOver.textContent = week2Remaining.toFixed(2);

        const week3Remaining = updateWeek(
            week3TargetInput,
            week3AchievedInput,
            week3Percentage,
            week3DailyGoal,
            17,
            24,
            week2Remaining
        );
        week4CarriedOver.textContent = week3Remaining.toFixed(2);

        // تحديث الأسبوع الرابع بناءً على عدد الأيام المتبقية
        updateWeek4(week3Remaining);
    }

    // حساب الأسبوع الرابع بناءً على الأيام المتبقية في الشهر
    function updateWeek4(week3Remaining) {
        const currentMonth = new Date().getMonth(); // الشهر الحالي
        const currentYear = new Date().getFullYear(); // السنة الحالية
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // عدد أيام الشهر

        updateWeek(
            week4TargetInput,
            week4AchievedInput,
            week4Percentage,
            week4DailyGoal,
            25,
            daysInMonth,
            week3Remaining
        );
    }

    // تحديث القيم الشهرية
    function updateMonthly() {
        const totalTarget =
            parseFloat(week1TargetInput.value || 0) +
            parseFloat(week2TargetInput.value || 0) +
            parseFloat(week3TargetInput.value || 0) +
            parseFloat(week4TargetInput.value || 0);

        const totalAchieved =
            parseFloat(week1AchievedInput.value || 0) +
            parseFloat(week2AchievedInput.value || 0) +
            parseFloat(week3AchievedInput.value || 0) +
            parseFloat(week4AchievedInput.value || 0);

        const percentage = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(2) : 0;

        // تحديث القيم المعروضة
        monthlyTargetElement.textContent = totalTarget.toFixed(2);
        monthlyAchievedElement.textContent = totalAchieved.toFixed(2);
        monthlyPercentageElement.textContent = `${percentage}%`;
    }

    // حفظ البيانات في Local Storage
    function saveToLocalStorage() {
        const data = {
            week1: {
                target: week1TargetInput.value,
                achieved: week1AchievedInput.value,
            },
            week2: {
                target: week2TargetInput.value,
                achieved: week2AchievedInput.value,
            },
            week3: {
                target: week3TargetInput.value,
                achieved: week3AchievedInput.value,
            },
            week4: {
                target: week4TargetInput.value,
                achieved: week4AchievedInput.value,
            },
        };
        localStorage.setItem("salesData", JSON.stringify(data));
    }

    // تحميل البيانات من Local Storage
    function loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem("salesData"));
        if (data) {
            week1TargetInput.value = data.week1.target || "";
            week1AchievedInput.value = data.week1.achieved || "";
            week2TargetInput.value = data.week2.target || "";
            week2AchievedInput.value = data.week2.achieved || "";
            week3TargetInput.value = data.week3.target || "";
            week3AchievedInput.value = data.week3.achieved || "";
            week4TargetInput.value = data.week4.target || "";
            week4AchievedInput.value = data.week4.achieved || "";

            // تحديث الحسابات بناءً على البيانات المحملة
            calculateCarriedOver();
            updateMonthly();
        }
    }

    // إضافة الأحداث لحفظ القيم وحسابها عند التغيير
    function addInputListeners() {
        const inputs = [
            week1TargetInput,
            week1AchievedInput,
            week2TargetInput,
            week2AchievedInput,
            week3TargetInput,
            week3AchievedInput,
            week4TargetInput,
            week4AchievedInput,
        ];

        inputs.forEach(input => {
            input.addEventListener("input", () => {
                calculateCarriedOver();
                updateMonthly();
                saveToLocalStorage(); // حفظ البيانات
            });
        });
    }

    // زر حذف البيانات
    document.getElementById("clearDataButton").addEventListener("click", function () {
        if (confirm("هل تريد حذف جميع البيانات؟")) {
            localStorage.removeItem("salesData"); // حذف البيانات من Local Storage
            location.reload(); // إعادة تحميل الصفحة
        }
    });

    // تحميل البيانات عند بدء الصفحة
    loadFromLocalStorage();
    addInputListeners();
});

        // JavaScript لإضافة اسم الشهر وعدد الأيام
        const monthInfo = document.getElementById("month-info");
        const now = new Date();
        const monthNames = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ];

        // اسم الشهر الحالي
        const monthName = monthNames[now.getMonth()];

        // عدد الأيام في الشهر الحالي
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        // عرض المعلومات
        monthInfo.textContent = `الشهر الحالي: ${monthName} - عدد الأيام: ${daysInMonth}`;
