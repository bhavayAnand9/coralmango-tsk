const Files = require('../schema/Files');
const User = require('../schema/Users');
const node_path = require('path');
const fs = require('fs');

exports.getUserFiles = (req, res, next) => {
    Files.find({}, (err, allfiles) => {
        if (err) {
            res.status(404).json({
                Error: 'There are no notes'
            });
        } else {
            res.status(200).json({
                allfiles: allfiles
            });
        }
    })
};

exports.submitFile = (req, res, next) => {
    const {title, description} = req.body;
    const dateUploaded = new Date();
    const file = req.file;
    if (!file) {
        fs.unlinkSync(node_path.resolve(__dirname + '/../' + file.path));
        return res.status(404).json({
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
                .then(user => {
                    user.filesUploaded.push(result._id);
                    user.save();
                })
                .catch(err => res.status(500).json(err));

            try {
                fs.renameSync(node_path.resolve(__dirname + '/../' + file.path), node_path.resolve(__dirname + '/../' + 'uploads/' + result._id + '.pdf'));
            } catch (e) {
                return res.status(404).json({e});
            }
            res.status(200).json({
                dataUploaded: result,
                operation: 'successful'
            });
        })
        .catch(err => {
            fs.unlinkSync(node_path.resolve(__dirname + '/../' + file.path));
            return res.status(500).json({
                Error: err,
                operation: 'unsuccessful'
            })
        });
};

exports.getNote = async (req, res, next) => {
    const note_id = req.params.noteId;
    // const note = await Files.findById(note_id);
    try {
        await fs.promises.access(node_path.resolve(__dirname + '/../' + 'uploads/' + note_id + '.pdf'));
        const file = await fs.createReadStream(node_path.resolve(__dirname + '/../' + 'uploads/' + note_id + '.pdf'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            'inline; filename="' + note.title + '"'
        );
        file.pipe(res);
    } catch (err) {
        res.status(500).json({
            Error: 'no notes found',
            operation: 'unsuccessful'
        });
    }


};