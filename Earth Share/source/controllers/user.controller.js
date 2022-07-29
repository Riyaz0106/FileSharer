const bcrypt = require('bcrypt');
const con  = require("../configDB");
const WTCcon  = require("../configWTC");

// Get Dashboard for User/Admin Function.
const getDashboard = async (req, res) => {
    try {
        if(req.session.user && req.session.role === 'user'){
            const msgs = req.flash('msg');
            const user = req.session.user;

            // Render User Dashboard.
            res.format({
                'application/json': function () {
                    res.status(200).json({ success: true, message: "Welcome," + user });
                },

                'text/plain': function () {
                    res.send( "Welcome," + user);
                },
                
                'text/html': function () {
                    res.render('pages/userDashboard.ejs', { msgs, user }); // Render User Dashboard.
                },
                
                default: function () {
                    // log the request and respond with 406
                    res.status(406).send('Not Acceptable protocal to view the result.');
                }
            });
        } else if(req.session.user && req.session.role === 'admin'){
            const msgs= req.flash('msg');
            
            // Render Admin Dashboard.
            res.format({                
                'application/json': function () {
                    res.status(200).json({ success: true, message: "Welcome, Admin" });
                },

                'text/plain': function () {
                    res.send("Welcome, Admin");
                },
                
                'text/html': function () {
                    res.render('pages/adminDashboard.ejs', { msgs }); // Render Admin Dashboard.
                },
                
                default: function () {
                    // log the request and respond with 406
                    res.status(406).send('Not Acceptable protocal to view the result.');
                }
            });
        } else{
            res.redirect('/login'); //Redirect to Login Page.
        }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Get Login Page Function.
const getLoginPage = async (req, res) => {
    try {
        const msgs= req.flash('msg');
        res.render("pages/login.ejs", { msgs }); // Render Login Page.
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Signup Function.
const signup = async (req, res) => {
    try {
        const saltRounds = 10;
        const { signupuserName, signuppassword, signuprepassword } = req.body;
        if(signuppassword === signuprepassword){
            bcrypt.genSalt(saltRounds, function(error, salt) {
                if (!error){
                    //Encrypt password.
                    bcrypt.hash(signuppassword, salt, function(error, hash) {
                        if (!error){
                            con.query(`INSERT IGNORE INTO Users (userName, password, role) VALUES (?,?,?)`, [signupuserName, hash, 'user'], (error, result) => {
                                if(error){
                                    res.status(400).json({ success: false, message: error });
                                } else if(result.affectedRows === 1){
                                    req.flash('msg','Signup Successful.');
                                } else{
                                    req.flash('msg', 'Signup failed. User already exists!');
                                }

                                // Redirect back to Login Page.
                                res.format({
                                    'application/json': function () {
                                        if (req.flash('msg').toString().search("failed") !== -1){
                                            res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                        } else{
                                            res.status(201).json({ success: true, message: req.flash('msg')[0] });
                                        }
                                    },
                                    
                                    'text/plain': function () {
                                        res.send(req.flash('msg'));
                                    },
                                    
                                    'text/html': function () {
                                        res.redirect('/login');
                                    },

                                    default: function () {
                                        // log the request and respond with 406
                                        res.status(406).send('Not Acceptable protocal to view the result.');
                                    }
                                });
                            });
                        } else{
                            res.status(400).json({ success: false, message: error });
                        }
                    });
                } else{
                    res.status(400).json({ success: false, message: error });
                }
            });
        } else{
            req.flash('msg', 'Signup failed. Both password and repeat password should match!');

            // Redirect back to Login Page if password and repassword does not match.
            res.format({
                'application/json': function () {
                    res.status(400).json({ success: false, message: req.flash('msg')[0] });
                },
                
                'text/plain': function () {
                    res.send(req.flash('msg'));
                },
                
                'text/html': function () {
                    res.redirect('/login');
                },
                
                default: function () {
                    // log the request and respond with 406
                    res.status(406).send('Not Acceptable protocal to view the result.');
                }
            });
        }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Logout Function.
const logout = async (req, res) => {
    try {
        if(req.session.user){
            req.session.destroy(); // Delete all sessionStorage.
        }

        // Redirect back to Login Page if Logout success.
        res.format({
            'application/json': function () {
                res.status(200).json({ success: true, message: 'Logout Successful.' });
            },
          
            'text/plain': function () {
                res.send('Logout Successful.');
            },
          
            'text/html': function () {
                res.redirect('/login');
            },
          
            default: function () {
                // log the request and respond with 406
                res.status(406).send('Not Acceptable protocal to view the result.');
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Login Function.
const login = async (req, res) => {
    try {
        const { loginuserName, loginpassword, lgntype } = req.body;
        if(lgntype && WTCcon.shibSess){
            con.query(`SELECT * FROM Users WHERE userName LIKE ? AND role LIKE ?`, [loginuserName, lgntype], async (error, rows) => {
                if (!error) {
                    if(rows.length) {
                        //Login for user via mysql.
                        bcrypt.compare(loginpassword, rows[0].password, async function(error, result) {
                            if (!error){
                                if(result == true){
                                    // Log into user account using general login method.
                                    // Set User account session variables.
                                    req.session.user = loginuserName;
                                    req.session.role = rows[0].role;
                                    req.session.WTCuser = WTCcon.username;
                                    req.session.WTCauth = WTCcon.shibSess;

                                    req.flash('msg', 'Login Successful.');

                                    // Redirect to the respective Dashboard.
                                    res.format({
                                        'application/json': function () {
                                            res.status(200).json({ success: true, message: req.flash('msg')[0] });
                                        },

                                        'text/plain': function () {
                                            res.send(req.flash('msg'));
                                        },
                                        
                                        'text/html': function () {
                                            res.redirect('/dashboard');
                                        },
                                        
                                        default: function () {
                                            // log the request and respond with 406
                                            res.status(406).send('Not Acceptable protocal to view the result.');
                                        }
                                    });
                                } else{
                                    req.flash('msg', 'Login failed. Invalid password.');

                                    // Redirect back to login.
                                    res.format({
                                        'application/json': function () {
                                            res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                        },

                                        'text/plain': function () {
                                            res.send(req.flash('msg'));
                                        },
                                        
                                        'text/html': function () {
                                            res.redirect('/login');
                                        },
                                        
                                        default: function () {
                                            // log the request and respond with 406
                                            res.status(406).send('Not Acceptable protocal to view the result.');
                                        }
                                    });
                                }
                            } else {
                                res.status(400).json({ success: false, error });
                            }
                        });
                    } else{
                        req.flash('msg', 'Login failed. User not found.');

                        // Redirect back to login.
                        res.format({
                            'application/json': function () {
                                res.status(400).json({ success: false, message: req.flash('msg')[0] });
                            },
                            
                            'text/plain': function () {
                                res.send(req.flash('msg'));
                            },
                            
                            'text/html': function () {
                                res.redirect('/login');
                            },
                            
                            default: function () {
                                // log the request and respond with 406
                                res.status(406).send('Not Acceptable protocal to view the result.');
                            }
                        });
                    }
                } else{
                    res.status(400).json({ success: false, error });
                }
            });
        } else{
            req.flash('msg', 'Login failed. Please select a login type.');

            // Redirect back to login.
            res.format({
                'application/json': function () {
                    res.status(400).json({ success: false, message: req.flash('msg')[0] });
                },

                'text/plain': function () {
                    res.send(req.flash('msg'));
                },
                
                'text/html': function () {
                    res.redirect('/login');
                },
                
                default: function () {
                    // log the request and respond with 406
                    res.status(406).send('Not Acceptable protocal to view the result.');
                }
            });
        }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

module.exports = {
    getDashboard,
    getLoginPage,
    signup,
    logout,
    login
  }