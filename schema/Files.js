const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const filesSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    originalName: {
        type: String
    },
    dateUploaded: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Files', filesSchema);
