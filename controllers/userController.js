const bcrypt = require('bcryptjs');
const User = require('../schema/Users');
const config = require('../config');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const uuidv4 = require('uuid/v4');

sgMail.setApiKey(config.SENDGRID_API_key);

exports.confirmUser = (req, res) => {
    const verId = req.params.verificationId;
    User.find({emialVerificationId: verId}).then((u) => {
        u.confirmed = true;
        u.save();
    }).catch(err => res.status(404).json({
        Error: 'some error occured code: 0x0873',
        Alert: 'Something went wrong, contact support team'
    }))
};

exports.signupUser = (req, res) => {
    const {email, password} = req.body;
    const uuid = uuidv4();
    User.findOne({email: email})
        .then(user => {
            if (user) {
                return res.status(404).json({
                    Error: 'some error occured code: 00xc568',
                    Alert: 'Email already in use'
                });
            } else {
                const hashedPassword = bcrypt.hashSync(password, 12);
                const newUser = new User({
                    email: email,
                    password: hashedPassword,
                    filesUploaded: {
                        files: []
                    },
                    confirmed: false,
                    emialVerificationId: uuid
                });
                newUser.save()
                    .then(() => {
                        res.status(200).json({
                            Message: 'user created',
                            Alert: 'Please check your email inbox for email confirmation'
                        });

                        const msg = {
                            to: email,
                            from: 'signup@filesportal.com',
                            subject: 'filesportal email confirmation',
                            text: 'Click the below link to confirm your email address',
                            html: `<a href=${config.BACKEND_IP}user/confirm-user/${uuid}>CONFIRM EMAIL</a>`,
                        };
                        sgMail.send(msg).then(r => {
                            console.log(r);
                        });

                    });
            }
        })
        .catch(err => res.status(500).json({Error: 'some error occured code: 0x00012'}));
};

exports.loginUser = (req, res) => {
    const {email, password} = req.body;
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    Alert: 'No such user exist',
                    Error: 'some error occured code: 00XUSRNTFND'
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
                            Alert: 'Wrong credentials',
                            Error: 'some error occured code: 00XWRGCRD'
                        })
                    }
                })
                .catch(() => res.status(500).json({
                    Error: "some error happened code: 00XCTHLGIN"
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
