const mongoose = require('mongoose');

const AdWatchedSchema = new mongoose.Schema({
    userId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('AdWatched', AdWatchedSchema);