const crypto = require('crypto');
const request = require('request');
const { Readable } = require('stream');
const con = require("../configDB");
const WTCcon = require('../configWTC');
const { LimitStream } = require("../services/LimitStream");

const maxSize = 10 * 1024 * 1024; // Define Max size of the file that can be uploaded.

/**************************************************************************************************************************************************/
/*********************************************************** UPLOAD, DELETE, GET FILE FUNCTIONS ***************************************************/
/**************************************************************************************************************************************************/
// Upload File Function.
const uploadFile = async (req, res) => {
    try {
		if(req.session.user && req.session.role === 'user' && req.session.WTCauth){
			if(req.method === 'POST'){
				const file  = req.file;
				const origin = req.headers.origin;
				console.log(origin)
				if(file.size <= maxSize){
					const hash = crypto.createHash('sha256');
					const finalHex = hash.update(file.buffer).digest('hex'); // generate 64 bit hash of the uploaded file.
					var fileStatus;

					request.get({
							headers: {
								'Cookie': `WTC_AUTHENTICATED=`+req.session.WTCuser+';'
											+`_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468=`+req.session.WTCauth
							},
							uri: 'https://www.tu-chemnitz.de/informatik/DVS/blocklist/'+finalHex,
						}, function (error, response) {
						if(!error){
							if(response.statusCode === 210){
								fileStatus = 'BLocked';
							} else if(response.statusCode === 200){
								fileStatus = 'Active';
							} else{
								fileStatus = 'error';
								req.flash('msg', 'File Check failed. Invalid status received at blocklist gateway. Please try again.');
								if(origin !== undefined){
									res.redirect('/upload/file?errmsg='+req.flash('msg')[0]); // On unsuccessfull Insert redirect to upload file page with error message.
								} else{
									res.format({
										'application/json': function () {
											res.status(400).json({ success: false, message: req.flash('msg')[0] });
										},
						
										'text/plain': function () {
											res.send( req.flash('msg')[0] );
										},
										
										default: function () {
											// log the request and respond with 406
											res.status(406).send('Not Acceptable protocal to view the result.');
										}
									});
								}
							}

							if(fileStatus !== 'error'){
								const values = [finalHex, file.originalname, String(file.size), file.mimetype, file.buffer, fileStatus, req.session.user];
								con.query(`INSERT IGNORE INTO FileStorage (fileHash, fileName, fileSize, fileType, file, fileStatus, uploadBy) VALUES (?,?,?,?,?,?,?)`, values, (error, result) => {
									if (error) {
										res.status(400).json({ success: false, error });
									} else if(result.affectedRows === 1){
										if(origin !== undefined){
											res.redirect('/upload/file?downurl=http://localhost:5000/get/file/id='+finalHex); // On successfull Insert redirect to upload file page with download url.
										} else{
											res.format({
												'application/json': function () {
													res.status(201).json({ success: true, message: "File Uploaded Successfully.", downloadurl: 'http://localhost:5000/get/file/id='+finalHex });
												},
								
												'text/plain': function () {
													res.send( 'http://localhost:5000/get/file/id='+finalHex );
												},
												
												default: function () {
													// log the request and respond with 406
													res.status(406).send('Not Acceptable protocal to view the result.');
												}
											});
										}
									} else{
										req.flash('msg', 'File has already been uploaded.');
										if(origin !== undefined){
											res.redirect('/upload/file?errmsg='+req.flash('msg')[0]); // On unsuccessfull Insert redirect to upload file page with error message.
										} else{
											res.format({
												'application/json': function () {
													res.status(400).json({ success: false, message: req.flash('msg')[0] });
												},
								
												'text/plain': function () {
													res.send( req.flash('msg')[0] );
												},
												
												default: function () {
													// log the request and respond with 406
													res.status(406).send('Not Acceptable protocal to view the result.');
												}
											});
										}
									}
								}); 
							}
						}
					});
				} else{
					if(origin !== undefined){
						res.redirect('/upload/file?errmsg=File size is too big.'); // if file size is > 10 MB redirect to upload file page with error message.
					} else{
						res.format({
							'application/json': function () {
								res.status(400).json({ success: false, message: "File size is too big. Failed to upload file." });
							},
			
							'text/plain': function () {
								res.send( 'File size is too big. Failed to upload file.' );
							},
							
							default: function () {
								// log the request and respond with 406
								res.status(406).send('Not Acceptable protocal to view the result.');
							}
						});
					}
				}
			} else{
				res.render('pages/uploadFile.ejs'); // Render Upload File Page.
			}
		}else{
			res.redirect('/login'); // Redirect back to Login Page.
		}
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Function to get all files uploaded by a user.
const getAllfilesUser = async (req, res) => {
    try {
        if(req.session.user && req.session.role === 'user'){
			const user = req.session.user;
            con.query(`SELECT fileHash, fileName, fileSize, fileStatus, uploadDateTime, uploadBy FROM fileStorage WHERE uploadBy LIKE ? ORDER BY uploadDateTime`, user, async (error, rows) => {
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
							res.render('pages/allfiles.ejs',{ allFilesdata: rows, msgs });
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
            res.redirect('/login'); // Redirect back to Login Page.
        }
    } catch (error) {
        res.status(400).json({ success: false, error });
    }
}

// Delete File Function.
const deleteFile = async (req, res) => {
	try {
		if(req.session.user && req.session.role === 'user'){
			const { id } = req.params;
			con.query(`DELETE FROM fileStorage WHERE fileHash LIKE ? AND uploadBy LIKE ?;`, [id, req.session.user], (error, result) => {
				if (!error) {
					if(result.affectedRows === 1){
						req.flash('msg', 'File Deleted successfully!');

						res.format({
							'application/json': function () {
								res.status(200).json({ success: true, message: req.flash('msg')[0] });
							},
						
							'text/plain': function () {
								res.send(req.flash('msg')[0]);
							},
						
							'text/html': function () {
								res.redirect('/user/myfiles');
							},
						
							default: function () {
								// log the request and respond with 406
								res.status(406).send('Not Acceptable protocal to view the result.');
							}
						});
					} else{
						req.flash('msg', 'File Not Found!');

						// Render 404 Page.
						res.format({
							'application/json': function () {
								res.status(404).json({ success: false, message: req.flash('msg')[0] });
							},
						
							'text/plain': function () {
								res.send(req.flash('msg')[0]);
							},
						
							'text/html': function () {
								res.statusMessage = req.flash('msg')[0];
								res.status(404).render('pages/404.ejs');
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
			res.redirect('/login'); // Redirect back to Login Page.
		}
	} catch (error) {
		res.status(400).json({ success: false, error });
	}
}

/**************************************************************************************************************************************************/
/***************************************************************** DOWNLOAD FILE FUNCTIONS ********************************************************/
/**************************************************************************************************************************************************/
// Get File Details Function.
const getFiledetails = async (req, res) => {
	try {
		const { id } = req.params;
		let fileStatus;
		con.query(`SELECT fileHash, fileName, fileSize, fileStatus, uploadDateTime, uploadBy, lasStatusupdate FROM filestorage WHERE filehash LIKE ?`, id, (error, rows) => {
            if (!error) {
				if(rows.length){
					const mdate = new Date();
					const today = new Date(mdate.getFullYear(), mdate.getMonth(), mdate.getDate(), mdate.getHours(), mdate.getMinutes(), mdate.getSeconds());
					const difference = Math.abs( today - rows[0].lasStatusupdate) / 36e5;
					if(WTCcon.shibSess){
						if(parseInt(difference) > 12){
							request.get({
								headers: {
									'Cookie': `WTC_AUTHENTICATED=`+WTCcon.WTCuser+';'
												+`_shibsession_7777772e74752d6368656d6e69747a2e64655f61707068747470733a2f2f7777772e74752d6368656d6e69747a2e64652f73686962626f6c657468=`+WTCcon.shibSess
								},
								uri: 'https://www.tu-chemnitz.de/informatik/DVS/blocklist/'+id,
							}, function (error, response) {
								if(!error){
									if(response.statusCode === 210){
										fileStatus = 'BLocked';
									} else if(response.statusCode === 200){
										fileStatus = 'Active';
									} else{
										fileStatus = 'error';
										req.flash('msg', 'File Check failed. Invalid status received at blocklist gateway. Please try again.');
									}

									if(fileStatus !== 'error'){
										con.query(`UPDATE fileStorage SET fileStatus = ?, lasStatusupdate = ? WHERE fileHash LIKE ?;`,[fileStatus, today, id], (error) => {
											if(error){
												res.status(400).json({ success: false, error });
											} else{
												rows[0].fileStatus = fileStatus;
											}
										});
									}
								}
							});

						} else{
							fileStatus = rows[0].fileStatus;
						}
					} else{
						fileStatus = 'error';
						req.flash('msg', 'File Check failed. Shibsession not available.');
					}
				} else{
					fileStatus = 'error';
					req.flash('msg', 'File Not Found!');
				}

				if(fileStatus !== 'error'){

					const msgs = req.flash('msg');

					// Render Download Page.
					res.format({
						'application/json': function () {
							res.status(200).json({ success: true, data: rows[0] });
						},
					
						'text/plain': function () {
							res.send(rows[0]);
						},
					
						'text/html': function () {
							res.render('pages/downloadFile.ejs',{filedata: rows[0], user: req.session.user, msgs });
						},
					
						default: function () {
							// log the request and respond with 406
							res.status(406).send('Not Acceptable protocal to view the result.');
						}
					});
				} else {
					// Render 404 Page.
					res.format({
						'application/json': function () {
							res.status(404).json({ success: false, message: req.flash('msg')[0] });
						},
					
						'text/plain': function () {
							res.send(req.flash('msg')[0]);
						},
					
						'text/html': function () {
							res.statusMessage = req.flash('msg')[0];
							res.status(404).render('pages/404.ejs');
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
  } catch (error) {
      	res.status(400).json({ success: false, error });
  }
}

// Download File Function.
const downloadFile = async (req, res) => {
  try {
	const { id } = req.params;
	var referer = req.headers.referer !== undefined ? req.headers.referer : 'none';
	// console.log(referer);
	if(referer.search("get/file/id") !== -1){
		con.query(`SELECT fileName, file, fileType FROM filestorage WHERE filehash LIKE ?`, id, (error, rows) => {
            if (!error) {
				if(rows.length){
					const mdate = new Date();
					const today = new Date(mdate.getFullYear(), mdate.getMonth(), mdate.getDate(), mdate.getHours(), mdate.getMinutes(), mdate.getSeconds());
					con.query(`UPDATE filestorage SET lasDowndate = ? WHERE fileHash LIKE ?;`, [today, id], (error) => {
						if (!error) {
							//Set headers for file Download.
							res.set({
								"Content-Type": rows[0].fileType,
								"Content-Disposition": "attachment; filename="+rows[0].fileName
							});

							// Save File.
							if(req.session.user){
								res.end(rows[0].file);
							} else{

								// limit speed
								var myBuffer = new Buffer.from(rows[0].file);
								var readStream = Readable.from(myBuffer.toString());

								var limitStream = new LimitStream();
								limitStream.setLimit(100); // in KiB/s

								readStream.pipe(limitStream);

								limitStream.on('pause', function () {
									readStream.pause();
								});

								limitStream.on('resume', function () {
									readStream.resume();
									res.end(rows[0].file);
								});

								
							}
						} else{
							res.status(400).json({ success: false, error });
						}
					});
				} else{
					req.flash('msg', 'File Not Found!');

					// Render 404 Page.
					res.format({
						'application/json': function () {
							res.status(404).json({ success: false, message: req.flash('msg')[0] });
						},
					  
						'text/plain': function () {
							res.send(req.flash('msg')[0]);
						},
					  
						'text/html': function () {
							res.statusMessage = req.flash('msg')[0];
							res.status(404).res.render('pages/404.ejs');
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
		req.flash('msg', 'Unauthorized access!');

		// Render 401 Page.
		res.format({
			'application/json': function () {
				res.status(401).json({ success: false, message: req.flash('msg')[0] });
			},
			
			'text/plain': function () {
				res.send(req.flash('msg')[0]);
			},
			
			'text/html': function () {
				res.status(401).render('pages/401.ejs');
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

// Function to create blocking or un-blocking request of a file.
const createPendingrequests = async (req, res) => {
	try {
		const { id } = req.params;
		const values = [req.body.userName, req.body.blockReason, id, req.body.reqtype];
		con.query(`INSERT INTO requests (name, reason, fileHash, reqType) VALUES (?,?,?,?)`, values, (error) => {
			if (!error) {
				req.flash('msg', 'Request Sent Successfully.');

				res.format({
					'application/json': function () {
						res.status(201).json({ success: true, message: req.flash('msg')[0] });
					},

					'text/plain': function () {
						res.send(req.flash('msg')[0]);
					},
					
					'text/html': function () {
						res.status(201).redirect('/get/file/id='+id);
					},
					
					default: function () {
						// log the request and respond with 406
						res.status(406).send('Not Acceptable protocal to view the result.');
					}
				});
			} else {
				res.status(400).json({ success: false, error });
			}
		});
	} catch (error) {
		res.status(400).json({ success: false, error });
	}
}

module.exports = {
	createPendingrequests,
	getAllfilesUser,
	getFiledetails,
	downloadFile,
	deleteFile,
    uploadFile
  }