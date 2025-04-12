import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db';
import { scheduleWeatherJob } from './jobs/WeatherJob';
import { WeatherService } from './services/WeatherService';

const start = async () => {
  try {
    await connectDB();

    const service = new WeatherService();
    const cities = process.env.CITIES!.split(',');

    for (let i = 0; i < 5; i++) {
      console.log(`🌐 Fetch round ${i + 1}`);
      await service.fetchAndStore(cities);
      await new Promise(res => setTimeout(res, 3000));
    }

    scheduleWeatherJob();
  } catch (err) {
    console.error('❌ Startup failed:', err);
  }
};

start();
