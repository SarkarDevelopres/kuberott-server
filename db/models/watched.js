const mongoose = require('mongoose');

const WatchedSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    movieId: { type: String, required: true },
    duration: { type: Number, required: true },
    adsWatched: { type: Number, default: 0},
}, { timestamps: true });

module.exports = mongoose.model('Watched', WatchedSchema);