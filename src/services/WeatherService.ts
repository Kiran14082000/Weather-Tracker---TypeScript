import { WeatherRepository } from '../repositories/WeatherRepository';
import { getWeatherByCity } from '../utils/apiClient';
import { logger } from '../utils/logger';

export class WeatherService {
  private repo = new WeatherRepository();

  async fetchAndStore(cities: string[]) {
    for (const city of cities) {
      try {
        const weatherData = await getWeatherByCity(city);
        await this.repo.save({
          city,
          temperature: weatherData.main.temp,
          condition: weatherData.weather[0].description
        });
        logger.info(`Weather saved for ${city}`);
      } catch (err) {
        logger.error(`Failed to fetch/store weather for ${city}: ${err}`);
      }
    }
  }
}
