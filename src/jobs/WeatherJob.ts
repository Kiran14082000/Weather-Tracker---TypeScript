import cron from 'node-cron';
import { WeatherService } from '../services/WeatherService';
import { logger } from '../utils/logger';

export const scheduleWeatherJob = () => {
  const cities = (process.env.CITIES || '').split(',');
  const weatherService = new WeatherService();

  cron.schedule(process.env.FETCH_INTERVAL || '*/15 * * * *', async () => {
    logger.info('Fetching weather data...');
    await weatherService.fetchAndStore(cities);
  });
};
