import mongoose from 'mongoose';

const WeatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  condition: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Weather', WeatherSchema);
