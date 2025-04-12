import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import Weather from './models/Weather';
import { Parser } from 'json2csv';
import { WeatherService } from './services/WeatherService';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string).then(() => {
  console.log('✅ MongoDB connected');
});

// 🔁 Real-time weather updates every 10 minutes
const service = new WeatherService();
const cities = process.env.CITIES?.split(',') ?? [];
setInterval(async () => {
  console.log(`🌐 Auto-fetching weather for: ${cities.join(', ')}`);
  await service.fetchAndStore(cities);
}, 10 * 60 * 1000);

// Manual Fetch Now
app.get('/fetch-now', async (req, res) => {
  try {
    await service.fetchAndStore(cities);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Fetch failed');
  }
});

// Home
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Weather Dashboard</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <script>
          function toggleTheme() {
            document.body.classList.toggle('bg-dark');
            document.body.classList.toggle('text-light');
          }
          function autoRefresh(toggle) {
            if(toggle.checked) setInterval(() => window.location.reload(), 15000);
          }
        </script>
      </head>
      <body class="bg-light">
        <div class="container py-5">
          <h1 class="mb-4">🌦️ Weather Dashboard</h1>
          <div class="d-flex justify-content-between mb-3">
            <a href="/fetch-now" class="btn btn-success">🔄 Fetch Now</a>
            <div>
              <label class="form-check-label me-2">Auto Refresh</label>
              <input type="checkbox" class="form-check-input" onchange="autoRefresh(this)">
              <button onclick="toggleTheme()" class="btn btn-sm btn-secondary ms-3">🌓 Toggle Theme</button>
            </div>
          </div>
          <div class="list-group">
            <a href="/weather" class="list-group-item list-group-item-action">📋 View Weather Table</a>
            <a href="/chart" class="list-group-item list-group-item-action">📊 Temperature Chart</a>
            <a href="/weather/summary" class="list-group-item list-group-item-action">📈 View Summary</a>
            <a href="/weather/download?format=json" class="list-group-item list-group-item-action">⬇️ Download JSON</a>
            <a href="/weather/download?format=csv" class="list-group-item list-group-item-action">⬇️ Download CSV</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Weather Table
app.get('/weather', async (req, res) => {
  const city = req.query.city as string;
  const min = parseFloat(req.query.min as string);
  const max = parseFloat(req.query.max as string);
  const start = req.query.start ? new Date(req.query.start as string) : undefined;
  const end = req.query.end ? new Date(req.query.end as string) : undefined;

  const filter: any = {};
  if (city) filter.city = city;
  if (!isNaN(min) || !isNaN(max)) filter.temperature = {};
  if (!isNaN(min)) filter.temperature.$gte = min;
  if (!isNaN(max)) filter.temperature.$lte = max;
  if (start || end) filter.timestamp = {};
  if (start) filter.timestamp.$gte = start;
  if (end) filter.timestamp.$lte = end;

  const data = await Weather.find(filter).sort({ timestamp: -1 });

  const rows = data.map(item => `
    <tr>
      <td>${item.city}</td>
      <td>${item.temperature?.toFixed(1) ?? 'N/A'}°C</td>
      <td>${item.condition ?? 'N/A'}</td>
      <td>${new Date(item.timestamp ?? Date.now()).toLocaleString()}</td>
    </tr>
  `).join('');

  res.send(`
    <html>
      <head><title>Weather Table</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"></head>
      <body class="bg-light">
        <div class="container py-5">
          <h2>📋 Weather Table</h2>
          <form class="row g-3 mb-4">
            <div class="col-md-2"><input class="form-control" name="city" placeholder="City" /></div>
            <div class="col-md-2"><input class="form-control" name="min" placeholder="Min Temp" type="number" /></div>
            <div class="col-md-2"><input class="form-control" name="max" placeholder="Max Temp" type="number" /></div>
            <div class="col-md-3"><input class="form-control" name="start" placeholder="Start Date" type="date" /></div>
            <div class="col-md-3"><input class="form-control" name="end" placeholder="End Date" type="date" /></div>
            <div class="col-md-12"><button class="btn btn-primary">Filter</button></div>
          </form>
          <table class="table table-bordered">
            <thead class="table-light">
              <tr><th>City</th><th>Temperature</th><th>Condition</th><th>Timestamp</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <a href="/" class="btn btn-secondary">⬅️ Back</a>
        </div>
      </body>
    </html>
  `);
});

// Download
app.get('/weather/download', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const data = await Weather.find({}).sort({ timestamp: -1 });

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(data.map(doc => doc.toObject()));
      res.header('Content-Type', 'text/csv');
      res.attachment('weather.csv');
      res.send(csv);
      return; // Just return without sending back a value
    }

    res.header('Content-Type', 'application/json');
    res.attachment('weather.json');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// Summary
app.get('/weather/summary', async (req, res) => {
  const data = await Weather.find({});

  const summary: Record<string, any> = {};
  const conditionCount: Record<string, number> = {};
  let globalTotal = 0;
  let globalCount = 0;
  let hottestCity = '';
  let maxTemp = -Infinity;

  for (const item of data) {
    const city = item.city ?? 'Unknown';
    const temp = item.temperature ?? 0;
    const condition = item.condition ?? 'Unknown';

    globalTotal += temp;
    globalCount += 1;
    if (temp > maxTemp) {
      maxTemp = temp;
      hottestCity = city;
    }
    conditionCount[condition] = (conditionCount[condition] || 0) + 1;

    if (!summary[city]) {
      summary[city] = {
        count: 0, total: 0,
        max: temp, min: temp,
        conditions: {}
      };
    }

    const stats = summary[city];
    stats.count += 1;
    stats.total += temp;
    stats.max = Math.max(stats.max, temp);
    stats.min = Math.min(stats.min, temp);
    stats.conditions[condition] = (stats.conditions[condition] || 0) + 1;
  }

  const mostCommonCondition = Object.entries(conditionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
  const rows = Object.entries(summary).map(([city, stats]) => {
    const frequent = (Object.entries(stats.conditions) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
      return `<tr><td>${city}</td><td>${(stats.total / stats.count).toFixed(1)}°C</td><td>${stats.min}°C</td><td>${stats.max}°C</td><td>${frequent}</td></tr>`;
  }).join('');

  res.send(`
    <html>
      <head><title>Summary</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"></head>
      <body class="bg-light">
        <div class="container py-5">
          <h2>📈 Aggregated Summary</h2>
          <div class="row mb-4">
            <div class="col-md-4"><div class="card text-bg-primary"><div class="card-body"><h5>🌡️ Global Avg Temp</h5><p>${(globalTotal / globalCount).toFixed(1)}°C</p></div></div></div>
            <div class="col-md-4"><div class="card text-bg-danger"><div class="card-body"><h5>🔥 Hottest City</h5><p>${hottestCity} (${maxTemp.toFixed(1)}°C)</p></div></div></div>
            <div class="col-md-4"><div class="card text-bg-success"><div class="card-body"><h5>☁️ Most Common</h5><p>${mostCommonCondition}</p></div></div></div>
          </div>
          <table class="table table-bordered"><thead class="table-light"><tr><th>City</th><th>Avg</th><th>Min</th><th>Max</th><th>Common Condition</th></tr></thead><tbody>${rows}</tbody></table>
          <a href="/" class="btn btn-secondary">⬅️ Back</a>
        </div>
      </body>
    </html>
  `);
});

// Chart
app.get('/chart', async (req, res) => {
  const data = await Weather.find({}).sort({ timestamp: 1 });
  const grouped: Record<string, { timestamps: string[], temps: number[] }> = {};

  data.forEach(item => {
    const city = item.city ?? 'Unknown';
    const temp = item.temperature ?? 0;
    const time = new Date(item.timestamp ?? Date.now()).toLocaleString();
    if (!grouped[city]) grouped[city] = { timestamps: [], temps: [] };
    grouped[city].timestamps.push(time);
    grouped[city].temps.push(temp);
  });

  const labels = Object.values(grouped)[0]?.timestamps ?? [];
  const datasets = Object.entries(grouped).map(([city, group], i) => `
    {
      label: "${city}",
      data: ${JSON.stringify(group.temps)},
      borderColor: "hsl(${i * 72}, 70%, 50%)",
      fill: false,
      tension: 0.3
    }
  `).join(',');

  res.send(`
    <html>
      <head>
        <title>Temperature Charts</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body class="bg-light">
        <div class="container py-5">
          <h2>📊 Temperature Charts</h2>
          <canvas id="weatherChart" height="400"></canvas>
          <a href="/" class="btn btn-secondary mt-4">⬅️ Back</a>
        </div>
        <script>
          new Chart(document.getElementById("weatherChart").getContext("2d"), {
            type: "line",
            data: {
              labels: ${JSON.stringify(labels)},
              datasets: [${datasets}]
            },
            options: {
              responsive: true,
              interaction: { mode: "index", intersect: false },
              plugins: {
                legend: { display: true },
                tooltip: { mode: "index", intersect: false }
              },
              scales: {
                y: { beginAtZero: false, title: { display: true, text: "Temperature (°C)" } },
                x: { title: { display: true, text: "Time" } }
              }
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Weather Dashboard running at http://localhost:${PORT}`);
});
