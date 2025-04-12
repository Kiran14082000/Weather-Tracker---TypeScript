import Weather from '../models/Weather';

export class WeatherRepository {
  async save(data: any) {
    const record = new Weather({
      ...data,
      timestamp: new Date() // make sure each record has a fresh timestamp
    });
    await record.save();
  }

  async getAll() {
    return Weather.find().sort({ timestamp: -1 });
  }
}
