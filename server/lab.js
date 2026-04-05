const charcoal_blue = "#404e5cff";
const blue_slate = "#4f6272ff";
const seaweed = "#06a77dff";
const bright_snow = "#f6f7f8ff";
const golden_orange = "#f1a208ff";

var max_time = 5;
var velocity_data = [-1, -2, -3, -2, -3];

Chart.defaults.font.family = "'Lexend', sans-serif";
Chart.defaults.font.style = 'light';

const datasets = {
    labels: [...Array(max_time).keys()],
    datasets: [{
        label: 'Velocity (m/s)',
        data: velocity_data,
        borderColor: golden_orange,
    }]
};
const lab_chart_config = {
    type: 'line',
    data: datasets,
    options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: "bottom",
                onClick: (e) => e.stopPropagation()
            },
        }
    },
};
const ctx = document.getElementById("lab_chart");
const lab_chart = new Chart(ctx, lab_chart_config);