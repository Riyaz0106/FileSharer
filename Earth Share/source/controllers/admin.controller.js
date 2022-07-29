const request = require('request');
const con = require("../configDB");

// Function to get all completed Requests
const getCompletedrequests = async (req, res) => {
    try {
            if(req.session.user && req.session.role === 'admin'){
                con.query(`SELECT filestorage.fileHash, filestorage.fileName, filestorage.uploadBy, requests.reqType, requests.reqStatus FROM FileStorage
                            JOIN requests 
                            WHERE FileStorage.fileHash LIKE requests.fileHash AND requests.reqStatus NOT LIKE 'Pending' 
                            GROUP BY requests.fileHash, requests.reqType;`, (error, rows) => {
                    if (!error) {

                        res.format({                            
                            'application/json': function () {
                                res.status(200).json({ success: true, data: rows });
                            },

                            'text/plain': function () {
                                res.send(rows);
                            },
                            
                            'text/html': function () {
                                res.render('pages/completedRequests.ejs',{reqData: rows});
                            },
                            
                            default: function () {
                                // log the request and respond with 406
                                res.status(406).send('Not Acceptable protocal to view the result.');
                            }
                        });

                    }else {
                        res.status(400).json({ success: false, error });
                    }
                });
            }else{
                res.redirect('/login');
            }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Function to get all pending requests
const getPendingrequests = async (req, res) => {
    try {
            if(req.session.user && req.session.role === 'admin'){
                con.query(`SELECT filestorage.fileHash, filestorage.fileName, filestorage.uploadBy, requests.reqType, requests.reqStatus FROM FileStorage
                            JOIN requests 
                            ON FileStorage.fileHash LIKE requests.fileHash AND requests.reqStatus LIKE 'Pending' 
                            GROUP BY requests.fileHash;`, (error, rows) => {
                    if (!error) {
                        const msgs = req.flash('msg');

                        res.format({
                            'application/json': function () {
                                res.status(200).json({ success: true, data: rows });
                            },
                            
                            'text/plain': function () {
                                res.send(rows);
                            },
                            
                            'text/html': function () {
                                res.render('pages/pendingRequests.ejs',{reqData: rows, msgs});
                            },
                            
                            default: function () {
                                // log the request and respond with 406
                                res.status(406).send('Not Acceptable protocal to view the result.');
                            }
                        });
                    }else {
                        res.status(400).json({ success: false, error });
                    }
                });
            }else{
                res.redirect('/login');
            }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Function to approve or decline requests.
const processPendingrequests = async (req, res) => {
    try {
            if(req.session.user && req.session.role === 'admin' && req.session.WTCauth){
                const mdate = new Date();
				const event = new Date(mdate.getFullYear(), mdate.getMonth(), mdate.getDate(), mdate.getHours(), mdate.getMinutes(), mdate.getSeconds());
                const { id, state } = req.params;
                var reqType = req.query.reqType;

                con.query(`SELECT fileHash, reqStatus FROM requests WHERE fileHash LIKE ? AND requests.reqStatus LIKE 'Pending' LIMIT 1`, id, (error, rows) => {
                    if(!error){
                        if(rows.length){
                            if(state === 'Approved'){
                                if(reqType === "Block"){
                                    request.put({
                                        headers: {
                                            'Cookie': `WTC_AUTHENTICATED=`+req.session.WTCuser+';'
                                                        +`_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468=`+req.session.WTCauth
                                        },
                                        uri: 'https://www.tu-chemnitz.de/informatik/DVS/blocklist/'+id,
                                    }, function (error, response) {
                                        if(!error){
                                            if(response.statusCode === 201){
                                                // var checkBlock="error";
                                                request.get({
                                                    headers: {
                                                        'Cookie': `WTC_AUTHENTICATED=`+req.session.WTCuser+';'
                                                                    +`_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468=`+req.session.WTCauth
                                                    },
                                                    uri: 'https://www.tu-chemnitz.de/informatik/DVS/blocklist/'+id,
                                                }, function (error, response) {
                                                    if(!error){
                                                        if(response.statusCode === 210){
                                                            con.query(`UPDATE requests SET reqStatus = ? WHERE fileHash LIKE ? AND reqStatus LIKE 'Pending';`, [state, id], (error) => {
                                                                if (!error) {
                                                                    reqType = reqType === "Activate" ? "Active" : "Blocked";
                                                                    con.query(`UPDATE fileStorage SET fileStatus = ?, lasStatusupdate = ? WHERE fileHash LIKE ?;`,[reqType, event, id], (error) => {
                                                                        if(!error){
                                                                            req.flash('msg', 'Request for blocking is approved.');
            
                                                                            res.format({
                                                                                'application/json': function () {
                                                                                    res.status(210).json({ success: true, message: req.flash('msg')[0] });
                                                                                },
                                                                                
                                                                                'text/plain': function () {
                                                                                    res.send(req.flash('msg')[0]);
                                                                                },
                                                                                
                                                                                'text/html': function () {
                                                                                    res.redirect('/admin/pendingRequests');
                                                                                },
                                                                                
                                                                                default: function () {
                                                                                    // log the request and respond with 406
                                                                                    res.status(406).send('Not Acceptable protocal to view the result.');
                                                                                }
                                                                            });
                                                                        } else{
                                                                            res.status(400).json({ success: false, error });
                                                                        }
                                                                    });
                                                                } else{
                                                                    res.status(400).json({ success: false, error });
                                                                }
                                                            });
                                                        } else{
                                                            req.flash('msg', 'Failed to process request, an error occurred. Please try again later.');
                                                            
                                                            res.format({
                                                                'application/json': function () {
                                                                    res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                                                },
                                                                
                                                                'text/plain': function () {
                                                                    res.send(req.flash('msg')[0]);
                                                                },
                                                                
                                                                'text/html': function () {
                                                                    res.redirect('/admin/pendingRequests');
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
                                                req.flash('msg', 'Failed to process request, an error occurred. Please try again later.');
            
                                                res.format({
                                                    'application/json': function () {
                                                        res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                                    },
                                                    
                                                    'text/plain': function () {
                                                        res.send(req.flash('msg')[0]);
                                                    },
                                                    
                                                    'text/html': function () {
                                                        res.redirect('/admin/pendingRequests');
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
                                    request.delete({
                                        headers: {
                                            'Cookie': `WTC_AUTHENTICATED=`+req.session.WTCuser+';'
                                                        +`_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468=`+req.session.WTCauth
                                        },
                                        uri: 'https://www.tu-chemnitz.de/informatik/DVS/blocklist/'+id,
                                    }, async function (error, response) {
                                        if(!error){
                                            if(response.statusCode === 204){
                                                request.get({
                                                    headers: {
                                                        'Cookie': `WTC_AUTHENTICATED=`+req.session.WTCuser+';'
                                                                    +`_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468=`+req.session.WTCauth
                                                    },
                                                    uri: 'https://www.tu-chemnitz.de/informatik/DVS/blocklist/'+id,
                                                }, function (error, response) {
                                                    if(!error){
                                                        if(response.statusCode === 200){
                                                            con.query(`UPDATE requests SET reqStatus = ? WHERE fileHash LIKE ? AND reqStatus LIKE 'Pending';`, [state, id], (error) => {
                                                                if (!error) {
                                                                    reqType = reqType === "Activate" ? "Active" : "Blocked";
                                                                    con.query(`UPDATE fileStorage SET fileStatus = ?, lasStatusupdate = ? WHERE fileHash LIKE ?;`,[reqType, event, id], (error) => {
                                                                        if(!error){
                                                                            req.flash('msg', 'Request for activation is approved.');
            
                                                                            res.format({
                                                                                'application/json': function () {
                                                                                    res.status(200).json({ success: true, message: req.flash('msg')[0] });
                                                                                },
                                                                                
                                                                                'text/plain': function () {
                                                                                    res.send(req.flash('msg')[0]);
                                                                                },
                                                                                
                                                                                'text/html': function () {
                                                                                    res.redirect('/admin/pendingRequests');
                                                                                },
                                                                                
                                                                                default: function () {
                                                                                    // log the request and respond with 406
                                                                                    res.status(406).send('Not Acceptable protocal to view the result.');
                                                                                }
                                                                            });
                                                                        } else{
                                                                            res.status(400).json({ success: false, error });
                                                                        }
                                                                    });
                                                                } else{
                                                                    res.status(400).json({ success: false, error });
                                                                }
                                                            });
                                                        } else{
                                                            req.flash('msg', 'Failed to process request, an error occurred. Please try again later.');
            
                                                            res.format({
                                                                'application/json': function () {
                                                                    res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                                                },
                                                                
                                                                'text/plain': function () {
                                                                    res.send(req.flash('msg')[0]);
                                                                },
                                                                
                                                                'text/html': function () {
                                                                    res.redirect('/admin/pendingRequests');
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
                                            }else{
                                                req.flash('msg', 'Failed to process request, an error occurred. Please try again later.');
            
                                                res.format({
                                                    'application/json': function () {
                                                        res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                                    },
                                                    
                                                    'text/plain': function () {
                                                        res.send(req.flash('msg')[0]);
                                                    },
                                                    
                                                    'text/html': function () {
                                                        res.redirect('/admin/pendingRequests');
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
                                }
                            } else{
                                con.query(`UPDATE requests SET reqStatus = ? WHERE fileHash LIKE ? AND reqStatus LIKE 'Pending';`, [state, id], (error) => {
                                    if (!error) {
            
                                        if(reqType === "Block"){
                                            req.flash('msg', 'Request for blocking is declined.');
                                        } else{
                                            req.flash('msg', 'Request for activation is declined.');
                                        }
            
                                        res.format({
                                            'application/json': function () {
                                                res.status(200).json({ success: true, message: req.flash('msg')[0] });
                                            },
                                            
                                            'text/plain': function () {
                                                res.send(req.flash('msg')[0]);
                                            },
                                            
                                            'text/html': function () {
                                                res.redirect('/admin/pendingRequests');
                                            },
                                            
                                            default: function () {
                                                // log the request and respond with 406
                                                res.status(406).send('Not Acceptable protocal to view the result.');
                                            }
                                        });
                                    } else{
                                        res.status(400).json({ success: false, error });
                                    }
                                });
                            }
                        } else{
                            req.flash('msg', 'Failed to process request, this request has already been processed.');
                                                        
                            res.format({
                                'application/json': function () {
                                    res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                },
                                
                                'text/plain': function () {
                                    res.send(req.flash('msg')[0]);
                                },
                                
                                'text/html': function () {
                                    res.redirect('/admin/pendingRequests');
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
                res.redirect('/login');
            }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Function to view details of the pending request.
const viewRequestdetails = async (req, res) => {
    try {
            if(req.session.user && req.session.role === 'admin'){
                const { id } = req.params;
                const reqStatus = req.query.reqStatus;
                con.query(`SELECT fileHash, fileName, fileSize, fileStatus, uploadDateTime, uploadBy, lasStatusupdate FROM fileStorage WHERE fileHash = ?;`, id, (error, filerows) => {
                    if(!error){
                        if(filerows.length){
                            if(reqStatus === 'Pending'){
                                con.query(`SELECT * FROM requests 
                                            WHERE requests.fileHash LIKE ?
                                            AND requests.reqStatus LIKE 'Pending'`, id, (error, reqrows) => {
                                    if (!error) {
    
                                        res.format({
                                            'application/json': function () {
                                                res.status(200).json({ success: false, data: {fileData: filerows, reqData: reqrows} });
                                            },
                                            
                                            'text/plain': function () {
                                                res.send({fileData: filerows, reqData: reqrows});
                                            },
                                            
                                            'text/html': function () {
                                                res.render('pages/viewPendingrequestDetails.ejs',{fileData: filerows, reqData: reqrows});
                                            },
                                            
                                            default: function () {
                                                // log the request and respond with 406
                                                res.status(406).send('Not Acceptable protocal to view the result.');
                                            }
                                        });
                                    } else{
                                        res.status(400).json({ success: false, error });
                                    }
                                });
                            } else{
                                const reqType = req.query.reqType;
                                con.query(`SELECT * FROM requests 
                                            WHERE requests.fileHash LIKE ?
                                            AND requests.reqStatus NOT LIKE 'Pending' AND reqType LIKE ? AND reqStatus LIKE ?`, [id, reqType, reqStatus], (error, reqrows) => {
                                    if (!error) {
    
                                        res.format({
                                            'application/json': function () {
                                                res.status(200).json({ success: false, data: {fileData: filerows, reqData: reqrows} });
                                            },
                                            
                                            'text/plain': function () {
                                                res.send({fileData: filerows, reqData: reqrows});
                                            },
                                            
                                            'text/html': function () {
                                                res.render('pages/viewCompletedrequestDetails.ejs',{fileData: filerows, reqData: reqrows});
                                            },
                                            
                                            default: function () {
                                                // log the request and respond with 406
                                                res.status(406).send('Not Acceptable protocal to view the result.');
                                            }
                                        });
                                    }else {
                                        res.status(400).json({ success: false, error });
                                    }
                                });
                            }
                        } else{
                            req.flash('msg','Failed to load details of the file. Details Not found.');
                            
                            res.format({
                                'application/json': function () {
                                    res.status(400).json({ success: false, message: req.flash('msg')[0] });
                                },
                                
                                'text/plain': function () {
                                    res.send(req.flash('msg')[0]);
                                },
                                
                                'text/html': function () {
                                    res.redirect('/admin/pendingRequests');
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
            }else{
                res.redirect('/login');
            }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

module.exports = {
    getCompletedrequests,
    getPendingrequests,
    processPendingrequests,
    viewRequestdetails
  }