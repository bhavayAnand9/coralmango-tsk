const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    filesUploaded: {
        files: [
            {
                fileid: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Files'
                }
            }
        ]
    }
});

module.exports = mongoose.model('Users', userSchema);