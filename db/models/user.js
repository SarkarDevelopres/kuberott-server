const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

    // --------------------------------------------------
    // BASIC_DETAILS
    // --------------------------------------------------
    name: { type: String, required: true },
    phone: {
        number: { type: String },
        verified: { type: Boolean, default: false }
    },
    email: {
        email: { type: String, lowercase: true, required: true },
        verified: { type: Boolean, default: false, required: true },
    },
    password: { type: String, required: true },

    // --------------------------------------------------
    // SYSTEM
    // --------------------------------------------------
    status: { type: String, enum: ["active", "banned", "deleted"], default: "active" },
    createdAt: { type: Date, default: Date.now }

}, { timestamps: true });

UserSchema.pre('save', async function (next) {

    // Only hash if password is new or modified
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});


UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);