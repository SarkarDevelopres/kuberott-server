const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: Number },
    bio: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: Array, required: true },
    type: { type: String, enum: ["movie", "series", "tvshow"], default: "movie" },
    language: { type: Array, required: true },
    cast: { type: Array, required: true },
    director: { type: String, required: true },
    image: { type: String },
    videoUrl: { type: String },
    rating: { type: Number, min: 0, max: 10 },
    mediaSize: { type: Number, default: 0 },
    upBy: { type: String, default: "admin" },
    watched: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);