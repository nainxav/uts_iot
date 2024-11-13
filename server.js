const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'uts_iot',
  multipleStatements: true
});

function formatTimestamp(ts) {
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


app.get('/temperature-stats', (req, res) => {
  const query = `
    SELECT 
      MAX(suhu) AS max_temperature, 
      MIN(suhu) AS min_temperature, 
      AVG(suhu) AS avg_temperature 
    FROM tb_cuaca;
  `;

  const queryDetails = `
    SELECT id, suhu, humid, lux, ts 
    FROM tb_cuaca 
    WHERE suhu = (SELECT MAX(suhu) FROM tb_cuaca) 
      AND humid = (SELECT MAX(humid) FROM tb_cuaca);
  `;

  const queryMonthYear = `
    (SELECT DATE_FORMAT(ts, '%Y-%m') AS month_year FROM tb_cuaca ORDER BY ts ASC LIMIT 1)
    UNION
    (SELECT DATE_FORMAT(ts, '%Y-%m') AS month_year FROM tb_cuaca ORDER BY ts DESC LIMIT 1);
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Query gagal:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }

    if (results.length > 0) {
      const maxTemperature = results[0].max_temperature;
      const minTemperature = results[0].min_temperature;
      const avgTemperature = parseFloat(results[0].avg_temperature.toFixed(2));

      connection.query(queryDetails, (err, detailResults) => {
        if (err) {
          console.error('Query kedua gagal:', err);
          return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }

        const suhuMaxHumMax = detailResults.map(row => ({
          id: row.id,
          suhu: row.suhu,
          humid: row.humid,
          lux: row.lux,
          timestamp: formatTimestamp(row.ts) 
        }));

        connection.query(queryMonthYear, (err, monthYearResults) => {
          if (err) {
            console.error('Query ketiga gagal:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
          }

          const monthYearMax = monthYearResults.map((row, index) => (
            { month_year: row.month_year }
          ));

          res.json({
            max_temperature: maxTemperature,
            min_temperature: minTemperature,
            avg_temperature: avgTemperature,
            suhu_max_hum_max: suhuMaxHumMax,
            month_year_max: monthYearMax
          });
        });
      });
    } else {
      res.status(404).json({ error: 'Data tidak ditemukan' });
    }
  });
});

app.get('/temperature-data', (req, res) => {
  const query = `
    SELECT 
      suhu, humid, ts 
    FROM tb_cuaca
    ORDER BY ts ASC
    LIMIT 10;
  `;

  const queryMaxMin = `
    SELECT 
      suhu, ts AS max_timestamp 
    FROM tb_cuaca 
    WHERE suhu = (SELECT MAX(suhu) FROM tb_cuaca)
    LIMIT 1;

    SELECT 
      suhu, ts AS min_timestamp 
    FROM tb_cuaca 
    WHERE suhu = (SELECT MIN(suhu) FROM tb_cuaca)
    LIMIT 1;

    SELECT 
      humid, ts AS max_humid_timestamp 
    FROM tb_cuaca 
    WHERE humid = (SELECT MAX(humid) FROM tb_cuaca)
    LIMIT 1;

    SELECT 
      humid, ts AS min_humid_timestamp 
    FROM tb_cuaca 
    WHERE humid = (SELECT MIN(humid) FROM tb_cuaca)
    LIMIT 1;
  `;

  connection.query(query, (err, dataResults) => {
    if (err) return res.status(500).json({ error: 'Database query failed' });

    connection.query(queryMaxMin, (err, maxMinResults) => {
      if (err) return res.status(500).json({ error: 'Database query failed' });

      const formattedData = dataResults.map(row => ({
        suhu: row.suhu,
        humid: row.humid,
        ts: formatTimestamp(row.ts)
      }));

      const maxTemperature = maxMinResults[0][0];
      const minTemperature = maxMinResults[1][0];

      const maxHumid = maxMinResults[2][0];
      const minHumid = maxMinResults[3][0];

      res.json({
        data: formattedData, 
        max_temperature: {
          suhu: maxTemperature.suhu,
          max_timestamp: formatTimestamp(maxTemperature.max_timestamp)
        },
        min_temperature: {
          suhu: minTemperature.suhu,
          min_timestamp: formatTimestamp(minTemperature.min_timestamp)
        },
        max_humid: {
          humid: maxHumid.humid,
          max_humid_timestamp: formatTimestamp(maxHumid.max_humid_timestamp)
        },
        min_humid: {
          humid: minHumid.humid,
          min_humid_timestamp: formatTimestamp(minHumid.min_humid_timestamp)
        }
      });
    });
  });
});


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
