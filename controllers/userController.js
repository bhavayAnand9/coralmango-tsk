const bcrypt = require('bcryptjs');
const User = require('../schema/Users');
const config = require('../config');
const jwt = require('jsonwebtoken');

exports.signupUser = (req, res) => {
    const {email, password} = req.body;
    User.findOne({email: email})
        .then(user => {
            if (user) {
                return res.status(409).json({
                    Error: 'email already registered'
                })
            } else {
                const hashedPassword = bcrypt.hashSync(password, 12);
                const newUser = new User({
                    email: email,
                    password: hashedPassword,
                    filesUploaded: {
                        files: []
                    }
                });
                newUser.save()
                    .then(() => {
                        res.status(200).json({
                            Message: 'user created'
                        });
                    })
                    .catch(() => res.status(500).json({
                        Error: "some error happened"
                    }));
            }
        })
        .catch(err => res.status(500).json(err));
};

exports.loginUser = (req, res) => {
    const {email, password} = req.body;
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    Error: 'No such user found'
                })
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        const token = jwt.sign({
                            email: user.email,
                            userId: user._id.toString()
                        }, config.SECRET_KEY, {expiresIn: '36h'});

                        return res.status(200).json({
                            token: token
                        })
                    } else {
                        res.status(404).json({
                            Error: 'Credentials do not match',
                        })
                    }
                })
                .catch(() => res.status(500).json({
                    Error: "some error happened"
                }));
        })
        .catch(() => res.status(500).json({
            Error: "some error happened"
        }));
};

exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(404).json({
                Error: "some error occured while logging out",
            })
        } else {
            res.status(200).json({
                Message: 'User successfully logged out',
            })
        }
    })
};