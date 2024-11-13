document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/temperature-data');
        const { data, max_temperature, min_temperature, max_humid, min_humid } = await response.json();

        document.getElementById('max-temp').textContent = max_temperature.suhu;
        document.getElementById('max-timestamp').textContent = max_temperature.max_timestamp;
        document.getElementById('min-temp').textContent = min_temperature.suhu;
        document.getElementById('min-timestamp').textContent = min_temperature.min_timestamp;

        document.getElementById('max-humid').textContent = max_humid.humid;
        document.getElementById('max-humid-timestamp').textContent = max_humid.max_humid_timestamp;
        document.getElementById('min-humid').textContent = min_humid.humid;
        document.getElementById('min-humid-timestamp').textContent = min_humid.min_humid_timestamp;

        const labels = data.map(item => item.ts);
        const suhuData = data.map(item => item.suhu);
        const humidData = data.map(item => item.humid);

        const ctx = document.getElementById('temperatureChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Suhu (°C)',
                        data: suhuData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true
                    },
                    {
                        label: 'Kelembaban (%)',
                        data: humidData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (err) {
        console.error('Gagal mengambil data:', err);
    }
});

// document.getElementById('add-data-btn').addEventListener('click', () => {
//     document.getElementById('add-data-modal').classList.remove('hidden');
// });

// document.getElementById('close-modal-btn').addEventListener('click', () => {
//     document.getElementById('add-data-modal').classList.add('hidden');
// });

// document.getElementById('add-data-form').addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const temperature = document.getElementById('temperature').value;
//     const humidity = document.getElementById('humidity').value;
//     const timestamp = document.getElementById('timestamp').value;

//     try {
//         const response = await fetch('/add-temperature-data', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 temperature,
//                 humidity,
//                 timestamp
//             })
//         });

//         if (response.ok) {
//             alert('Data successfully added!');
//             document.getElementById('add-data-modal').classList.add('hidden');
//             location.reload(); 
//         } else {
//             alert('Failed to add data');
//         }
//     } catch (err) {
//         console.error('Error adding data:', err);
//     }
// });
