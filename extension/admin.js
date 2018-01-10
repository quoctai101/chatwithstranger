const co = require('../custom/const');
const facebook = require('../facebook');
const pusage = require('pidusage-fork');
var SHA256 = require("crypto-js/sha256");
var CryptoJS = require("crypto-js");
var HASHED_PASS = SHA256(co.ADMIN_PASSWORD).toString();
var tools;
var sqlconn;

var init = function(app, toolsObj, sqlconnObj) {
  tools = toolsObj;
  sqlconn = sqlconnObj;
  if (co.ADMIN_PASSWORD == "") return;

  app.post('/admin/auth/', function (req, res) {
		if (!doAuth(req.body['token'])) {res.send('ERR_AUTH');return;}
		res.send('OK');
	});

  app.post('/admin/edit/chatroom/', function (req, res) {
    var data = req.body;
		if (!doAuth(data['token'])) {res.send('ERR_AUTH');return;}
    try {
      if (data['type'] == "cradd") {
        if (isNaN(data['id1']) || isNaN(data['id2'])) return;
        tools.writeToChatRoom(sqlconn, null, data['id1'], data['id2'], false);
      } else if (data['type'] == "del") {
        if (isNaN(data['id'])) return;
        tools.deleteFromChatRoom(sqlconn, data['id'], function(){});
        tools.deleteFromWaitRoom(sqlconn, data['id']);
      }
    } catch (e) {console.log(e)}
		res.send('OK');
	});

  app.post('/admin/read/', function (req, res) {
		if (!doAuth(req.body['token'])) {res.send('ERR_AUTH');return;}
		var out = {waitroom:{}, chatroom:{}};

		tools.getListWaitRoom(sqlconn, function(list, genderlist, timelist) {
		  out.waitroom.ids = list;
		  out.waitroom.gender = genderlist;
		  out.waitroom.time = timelist;

			tools.getListChatRoom(sqlconn, function(listt) {
				out.chatroom.ids = listt;
				out.stat = tools.getStats();

				pusage.stat(process.pid, function(err, stat) {
					var pstat = 'CPU: '+stat.cpu.toFixed(1) +'%, Mem: '+ ((+stat.memory)/1024/1024).toFixed(1)+'MB';
					out.pstat = pstat;
					res.send(JSON.stringify(out));
				});
			})
		})
	});

  app.post('/admin/userinfo/', function (req, res) {
		if (!doAuth(req.body['token']) || isNaN(req.body['id']))
      {res.send('ERR_AUTH');return;}
    try {
      facebook.getFbData(co.FB_PAGE_ACCESS_TOKEN, "/"+req.body['id'], function (data) {
        res.send(JSON.stringify(data));
      });
    } catch (e) {
      res.send("");
    }
	});
}

function doAuth(token) {
  if (!token) return false;
  try {
    var bytes = CryptoJS.AES.decrypt(token, HASHED_PASS);
    var data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    var d = new Date();
    return (d.getTime() - data.time < 24*60*60000 &&
        data.hash == SHA256(data.time+""+HASHED_PASS).toString())
  } catch (e) {
    return false;
  }
}

module.exports = {
  init:init
};
