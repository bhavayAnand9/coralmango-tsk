const Files = require('../schema/Files');
const User = require('../schema/Users');
const node_path = require('path');
const fs = require('fs');
let ShortId = require('id-shorter');

exports.getUserFiles = async (req, res, next) => {
    Files.find({uploadedBy: req.loggedInUserId}, (err, data) => {
        if (err) {
            res.status(404).json({
                Error: "There are no files"
            });
        } else {
            res.status(200).json({
                allFiles: data
            });
        }
    });
};

exports.getFileByShortURL = async (req, res) => {
    const short_id = req.params.short_id;
    Files.findOne({shortUrl: short_id}, (err, f) => {
        if (err) res.status(404).json({Error: 'some error occured code: 0X098'});
        else {
            res.setHeader('Content-Disposition', `attachment; filename=${f.originalName}`);
            res.setHeader('Content-Transfer-Encoding', 'binary');
            res.setHeader('Content-Type', 'application/octet-stream');
            res.sendFile(node_path.resolve(__dirname + '/../' + 'uploads/' + f._id));
        }
    })
};

exports.getUrl = async (req, res, next) => {
    const {file_id} = req.body;
    Files.findById(file_id, (err, f) => {
        if (err) res.status(404).json({Error: "some error ocured"});
        else {
            if (f.shortUrl === undefined || f.shortUrl === null || f.shortUrl.length === 0) {
                const mongoDBShortId = ShortId();
                f.shortUrl = mongoDBShortId.encode(file_id);
                f.save();
                res.status(200).json({shortUrl: f.shortUrl});
            } else {
                res.status(200).json({shortUrl: f.shortUrl});
            }
        }
    });
};

exports.delUserFile = (req, res) => {
    const {file_id} = req.body;
    Files.findById(file_id, (err, f) => {
        if (err || f == null) {
            res.status(404).json({
                Error: "no such file"
            })
        } else {
            if (f.uploadedBy.toString().localeCompare(req.loggedInUserId) === 0) {
                try {
                    fs.unlinkSync(node_path.resolve(__dirname + '/../' + 'uploads/' + f._id));
                    Files.findByIdAndRemove(file_id, (err) => {
                        if (err) res.status(500).json({Error: "internal server error"});
                    });
                } catch (e) {
                    res.status(404).json({Error: 'some error occured code: 00XDLFLCTH'})
                }
                res.status(200).json({
                    Alert: "file deleted"
                })
            }
        }

        User.findById(req.loggedInUserId, (err, tt) => {
            if (err) res.status(404).json({Error: "some error occured"});
            else {
                let index = -1;
                for (let i = 0; i < tt.filesUploaded.files.length; ++i) {
                    if (!tt.filesUploaded.files[i]._id.toString().localeCompare(file_id)) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) tt.filesUploaded.files.splice(index, 1);
                tt.save();
            }
        })

    });
};

exports.submitFile = async (req, res) => {
    const {title, description} = req.body;
    const dateUploaded = new Date();
    const file = req.file;
    if (!file) {
        fs.unlinkSync(node_path.resolve(__dirname + '/../' + file.path));
        res.status(404).json({
            Error: 'file is corrupted or not supported'
        })
    }

    const fileObj = new Files({
        title: title,
        description: description,
        uploadedBy: req.loggedInUserId,
        dateUploaded: dateUploaded,
        originalName: file.originalname
    });
    fileObj
        .save()
        .then(result => {
            User.findById(result.uploadedBy)
                .then(u => {
                    u.filesUploaded.files.push(result._id);
                    u.save();
                })
                .catch(err => {
                    res.status(500).json({Error: 'some error occured'});
                });
            
            try {
                fs.renameSync(node_path.resolve(__dirname + '/../' + file.path), node_path.resolve(__dirname + '/../' + 'uploads/' + result._id));
            } catch (e) {
                res.status(404).json({Error: 'some error occured'});
            }
            res.status(200).json({
                dataUploaded: result
            });
        })
        .catch(err => {
            fs.unlinkSync(node_path.resolve(__dirname + '/../' + file.path));
            res.status(500).json({
                Error: "some err occured, code : 0X0001"
            })
        });
};


exports.getFile = async (req, res, next) => {
    const {file_id} = req.body;

    try {
        //check if any such file exist
        await fs.promises.access(node_path.resolve(__dirname + '/../' + 'uploads/' + file_id));

        //should this user be accessing this file?
        Files.findById(file_id, (err, f) => {
            if (err) {
                res.status(404).json({
                    Error: "No such file found"
                });
            } else {
                if (f.uploadedBy.toString().localeCompare(req.loggedInUserId) === 0) {
                    const file = fs.createReadStream(node_path.resolve(__dirname + '/../' + 'uploads/' + file_id));

                    res.setHeader('Content-Disposition', `attachment; filename=${file_id}`);
                    res.setHeader('Content-Transfer-Encoding', 'binary');
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.sendFile(node_path.resolve(__dirname + '/../' + 'uploads/' + file_id));
                } else {
                    res.status(404).json({
                        Error: "you are not allowed to access this file"
                    });
                }
            }
        });

    } catch (err) {
        res.status(404).json({
            Error: 'no such file found'
        });
    }
};
