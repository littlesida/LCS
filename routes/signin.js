var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;
var getClientIp = require('../middlewares/Utils').getClientIp;
// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next) {
  res.render('./login/signin');
});

// POST /signin 用户登录
router.post('/', checkNotLogin, function(req, res, next) {
  var name = req.fields.name;
  var password = req.fields.password;

  UserModel.getUserByName(name)
    .then(function (user) {
      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('back');
      }
      // 检查密码是否匹配
      if (sha1(password) !== user.password) {
        req.flash('error', '用户名或密码错误');
        return res.redirect('back');
      }
      req.flash('success', '登录成功');
      // 用户信息写入 session
      delete user.password;
      req.session.user = user;
       userIP = getClientIp(req);
      console.log("登录成功!");
      console.log('\n\n\n 用户的IP地址是 user IP is ' + userIP);
      // 跳转到主页
      res.redirect('/home');
    })
    .catch(next);
});

module.exports = router;