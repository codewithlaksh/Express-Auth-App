const mongoose = require('mongoose');
require('dotenv').config();

const connectToMongo = async () => {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to mongodb!')
}

module.exports = connectToMongo;
