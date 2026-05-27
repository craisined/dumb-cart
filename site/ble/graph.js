import {sensor_data} from "./bluetooth.js"

const ctx = document.getElementById("chart");

console.log(sensor_data.time)
let datasets = {
    datasets: [
        {
            label: 'Force',
            data: Array.from(
                {length: sensor_data.time.length},
                (_, i) => ({
                    x: sensor_data.time[i],
                    y: sensor_data.force[i],
                })
            )
        },
    ],
};
console.log(datasets);
let options = {
    responsive: true,
    scales: {
        x: {
            type: 'linear',
            position: 'bottom'
        }
    },
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Chart.js Line Chart'
        }
    }
};

let chart = new Chart(ctx, {
    type: "line",
    data: datasets,
    options: options
})