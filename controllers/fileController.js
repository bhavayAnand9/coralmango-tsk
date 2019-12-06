const Files = require('../schema/Files');
const User = require('../schema/Users');
const node_path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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

exports.delUserFile = (req, res) => {
    const {whichFile_id} = req.body;
    Files.findById(whichFile_id, (err, f) => {
        if (err) {
            res.status(404).json({
                Error: "no such file"
            })
        } else {
            if (f.uploadedBy === req.loggedInUserId) {
                fs.unlinkSync(node_path.resolve(__dirname + '/../' + 'uploads/' + f._id + '.pdf'));
                res.status(500).json({
                    Message: "file deleted"
                })
            }
        }

        User.findById(req.loggedInUserId, (err, tt) => {
            if (err) res.status(404).json({Error: "some error occured"});
            else {
                let index = -1;
                for (let i = 0; i < tt.filesUploaded.files.length; ++i) {
                    if (!tt.filesUploaded.files[i]._id.toString().localeCompare(whichFile_id)) {
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
                    console.error(err);
                    res.status(500).json({});
                });

            try {
                fs.renameSync(node_path.resolve(__dirname + '/../' + file.path), node_path.resolve(__dirname + '/../' + 'uploads/' + result._id + '.pdf'));
            } catch (e) {
                res.status(404).json({e});
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
        await fs.promises.access(node_path.resolve(__dirname + '/../' + 'uploads/' + file_id + '.pdf'));

        let shouldStreamFile = undefined;

        //should this user be accessing this file?
        Files.findById(file_id, (err, f) => {
            if (err) {
                res.status(404).json({
                    Error: "No such file found"
                });
            } else {
                shouldStreamFile = f.uploadedBy === req.loggedInUserId;
            }
        });

        if (shouldStreamFile) {
            const file = await fs.createReadStream(node_path.resolve(__dirname + '/../' + 'uploads/' + file_id + '.pdf'));
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="' + file.name + '"'
            );
            file.pipe(res);
        } else {
            res.status(404).json({
                Error: "you are not allowed to access this file"
            });
        }

    } catch (err) {
        res.status(404).json({
            Error: 'no such file found'
        });
    }
};