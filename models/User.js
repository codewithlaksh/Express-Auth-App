const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid')

const generateHandle = () => {
    return uuidv4();
}

const UserSchema = new Schema({
    handle: {
        type: String,
        default: generateHandle()
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: { updatedAt: false }
})

mongoose.models = {};
const User = mongoose.model('users', UserSchema);

module.exports = User;
