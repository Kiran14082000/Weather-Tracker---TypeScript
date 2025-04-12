# 🌦️ Weather Dashboard Backend

A full-featured **Node.js + Express + MongoDB** backend that fetches and stores weather data from the OpenWeatherMap API. Includes a rich UI built with Bootstrap for exploring temperature trends, analytics, filtering, and data export.

---

## 🚀 Features

- 🌐 Real-time Weather Fetching via OpenWeatherMap  
- 📋 Weather Table with city, temp range, and date filters  
- 📈 Summary Analytics (average, max/min, common condition)  
- 📊 Interactive Charts with toggles and tooltips  
- ⬇️ Data Export to JSON or CSV (filtered)  
- 🔄 Manual "Fetch Now" Button  
- 🌓 Dark Mode Toggle  
- 🔁 Auto-Refresh Toggle  

---

## 🛠️ Technologies Used

- Node.js + Express  
- MongoDB + Mongoose  
- Bootstrap 5  
- Chart.js  
- dotenv, cors, json2csv  

---

## 📦 Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` file

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/weather
CITIES=Toronto,New York,London,Tokyo,Sydney
OPENWEATHER_API_KEY=your_openweather_api_key
```

> You can get a free API key from: https://openweathermap.org/api

### 3. Start MongoDB

```bash
brew services start mongodb-community@7.0
```

### 4. Start the app

```bash
npx ts-node-dev src/app.ts
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🌐 App Overview

| Route                     | Description                        |
|--------------------------|------------------------------------|
| `/`                      | Home dashboard                     |
| `/fetch-now`             | Trigger a fresh weather fetch      |
| `/weather`               | Weather table (with filters)       |
| `/chart`                 | Temperature trend chart            |
| `/weather/summary`       | Aggregated city-wise summary       |
| `/weather/download`      | Export data (JSON or CSV)          |

---

## 🧪 Weather Table Filtering

You can filter by:

- City: `?city=London`  
- Temp range: `?min=5&max=30`  
- Date range: `?start=2025-01-01&end=2025-04-01`  

✅ Example:
```
/weather?city=Toronto&min=0&max=20&start=2025-03-01&end=2025-04-01
```

---

## 📥 Export Options

Download filtered data:

- `/weather/download?format=json`  
- `/weather/download?format=csv`  

With filters:
```
/weather/download?format=csv&city=Tokyo&min=10&start=2025-03-01
```

---

## 📊 Summary Analytics

View:
- 🌡️ Global average temperature  
- 🔥 Hottest city + temperature  
- ☁️ Most frequent condition  
- 💡 City-wise average/min/max summaries  

---

## 🔧 Project Structure

```
src/
├── app.ts                     # Main server file
├── models/Weather.ts          # Mongoose schema
├── services/WeatherService.ts # API fetch logic
├── config/db.ts               # DB connection config
```

---

## 💡 Future Ideas

- 📱 REST API for mobile  
- 🌍 Map with live weather pins  
- 📆 Auto-fetch scheduler  
- ☁️ Weather alerts  

---

## 🧑‍💻 Built by

**Kiran Gobi Manivannan**  
Feel free to connect on GitHub or LinkedIn!
