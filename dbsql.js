var writeToWaitRoom = function (sqlconn, id, gender, prefer) {
	var d = new Date();
	sqlconn.conn.query('INSERT INTO waitroom (uid, gender, prefer, time) VALUES (?,?,?,?) '+
		'ON DUPLICATE KEY UPDATE time=VALUES(time)',
		[+id,gender,prefer,d.getTime()], function (err, results, fields) {
			if(err) {
				console.log('__writeToWaitRoom error: ',err);
				setTimeout(function(){writeToWaitRoom(sqlconn, id, gender, prefer)}, 1000);
			}
		}
	);
}

var findInWaitRoom = function (sqlconn, id, callback) {
	sqlconn.conn.query('SELECT uid,gender FROM waitroom WHERE uid=?', [id], function (err, results, fields) {
		if (err) {
			console.log('__findInWaitRoom error: ',err);
			callback(false);
		} else if (results.length > 0) {
			callback(true);
		} else {
			callback(false);
		}
	});
}

var deleteFromWaitRoom = function (sqlconn, id) {
	sqlconn.conn.query('DELETE FROM waitroom WHERE uid=?', [id], function (err, results, fields) {
		if(err) {
			console.log('__deleteFromWaitRoom error: ',err);
			setTimeout(function(){deleteFromWaitRoom(sqlconn, id)}, 1000);
		}
	});
}

var getListWaitRoom = function (sqlconn, callback) {
	sqlconn.conn.query('SELECT uid,gender,prefer,time FROM waitroom ORDER BY RAND()', function (err, results, fields) {
		if (err) {
			console.log('__getListWaitRoom error: ',err);
			callback([],[]);
		} else {
			var files = [];
			var genderlist = [];
			var preferlist = [];
			var time = [];
			results.forEach(function(item, index) {
				files[index] = item.uid+'';
				genderlist[index] = item.gender;
				preferlist[index]= item.prefer;
				time[index] = item.time;
			});
			callback(files, genderlist, preferlist, time);
		}
	});
}

//chatroom tools
var writeToChatRoom = function (sqlconn, fs, id1, id2, isWantedGender) {
	var d = new Date();
	var genderint = (isWantedGender ? 1 : 0);
	sqlconn.conn.query('INSERT INTO chatroom (id1, id2, starttime, char1, msg1, char2, msg2, genderok) '+
					'VALUES (?,?,?,0,0,0,0,?) '+
					'ON DUPLICATE KEY UPDATE starttime=VALUES(starttime)',
					[id1,id2,d.getTime(),genderint],
					function (err, results, fields) {
		if(err) {
			console.log('__writeToChatRoom error: ',err);
			setTimeout(function(){writeToChatRoom(sqlconn, fs, id1, id2, isWantedGender)}, 1000);
		}
	});
	//sqlconn.query('DELETE FROM game WHERE id=? OR id=?', [id1,id2], function (err1, results1, fields1) {});//
}

//callback(id, haveToReview, role, data);
var findPartnerChatRoom = function (sqlconn, id, callback) {
	sqlconn.conn.query('SELECT id1,id2,msg1,msg2,gamedata,gamemode FROM chatroom WHERE id1=? OR id2=?', [id,id], function (err, results, fields) {
		if (err) {
			console.log('__findPartnerChatRoom error: ',err);
			setTimeout(function(){findPartnerChatRoom(sqlconn, id, callback)}, 1000);
			//callback(null, false);
		} else if (results.length > 0) {
			//var haveToReview = (results[0].msg1 < 10 || results[0].msg2 < 10);
			var haveToReview = false;
			if (results[0].id1 == id) {
				callback(results[0].id2, haveToReview, 1, results[0]);
			} else {
				callback(results[0].id1, haveToReview, 2, results[0]);
			}
		} else {
			callback(null, false, 1, {});
		}
	});
}

var deleteFromChatRoom = function (sqlconn, id, callback) {
	sqlconn.conn.query('SELECT * FROM chatroom WHERE id1=? OR id2=?', [id,id], function (err, results, fields) {
		sqlconn.conn.query('DELETE FROM chatroom WHERE id1=? OR id2=?', [id,id], function (err1, results1, fields1) {});
		if (!err && results[0])
			callback(results[0]);
		if (err) {
			setTimeout(function(){deleteFromChatRoom(sqlconn, id, callback)}, 1000);
		}
	});
}

var getListChatRoom = function (sqlconn, callback) {
	sqlconn.conn.query('SELECT id1,id2,starttime FROM chatroom', function (err, results, fields) {
		if (err) {
			console.log('__getListChatRoom error: ',err);
			setTimeout(function(){deleteFromChatRoom(sqlconn, callback)}, 1000);
		} else {
			callback(results);
		}
	});
}

// LAST TALK
var findInLastTalk = function (fs, fn, callback) {
	fs.stat("./lasttalk/"+fn, function(err, stat) {
		if(err == null) {
			callback(true);
		} else {
			callback(false);
		}
	});
}

var deleteFromLastTalk = function (fs, id) {
	fs.readdir("./lasttalk/", (err, files) => {
		var i;
		for (i=0 ; i<files.length ; i++) {
			var fn = files[i];
			if (fn.indexOf("m"+id) !== -1) {
				fs.unlink("./lasttalk/"+fn, function(err) {
					if(err) { console.log(err); }
				});
			}
		}
	});
}

var getListLastTalk = function (fs, callback) {
	fs.readdir("./lasttalk/", (err, files) => {
		callback(files);
	});
}

module.exports = {
	writeToWaitRoom:writeToWaitRoom,
	findInWaitRoom:findInWaitRoom,
	deleteFromWaitRoom:deleteFromWaitRoom,
	getListWaitRoom:getListWaitRoom,
	writeToChatRoom:writeToChatRoom,
	findPartnerChatRoom:findPartnerChatRoom,
	deleteFromChatRoom:deleteFromChatRoom,
	getListChatRoom:getListChatRoom,
	findInLastTalk:findInLastTalk,
	deleteFromLastTalk:deleteFromLastTalk,
	getListLastTalk:getListLastTalk
};
