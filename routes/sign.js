var express = require('express');
var router = express.Router();
var qr = require('qr-image');

var SignModel = require('../models/sign');
var SignDetailModel = require('../models/signDetail');
var StudentModel = require('../models/students');
var checkSignBelong = require('../middlewares/check').checkSignBelong;
var getClientIp = require('../middlewares/Utils').getClientIp;

router.get('/', checkSignBelong, function (req, res, next) {
  console.log('进入sign get');
  var st = req.query.st +':00';
  var et = req.query.et + ':00';
  var sDate = new Date(st);
  var eDate = new Date(et);
  var nDate = new Date();
  var sTime = parseInt(sDate.getTime());
  var eTime = parseInt(eDate.getTime());
  var nTime = parseInt(nDate.getTime());
  console.log("ST is " + sTime);
  console.log("ET is " + eTime);
  console.log("NT is " + nTime);
  if (nTime < sTime) {
    console.log("签到还未开始!");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<h1>签到还未开始!</h1>');
    res.end();
  } else if (nTime > eTime) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<h1>签到已经结束!</h1>');
    res.end();
    console.log("签到已经结束!");
  } else {
      res.render('./sign/sign', {
    coursename: req.query.courseName,
    signname: req.query.signName
  });
    console.log("签到进行中!");
  }

});

router.post('/', checkSignBelong, function (req, res, next) {
  var id = req.fields.stdId;
  var name = req.fields.name;
  var coursename = req.query.courseName;
  var signname = req.query.signName;
  var ip = getClientIp(req);
  var gps = req.fields.gps;

// console.log("学号是：" + id);
console.log("课程名是:" + coursename);
  console.log('用户的IP地址是：' + ip);
  console.log('用户的GPS地址是：' +  gps);
  try {
    if (!id) {
      console.log("没有填写学号");
      throw new Error('没有填写学号');
    }
    if (!name) {
      console.log('没有填写姓名');
      throw new Error('没有填写姓名');
    }
  } catch(e) {
    req.flash('error', e.message);
    return res.redirect('sign?courseName='+coursename+'\&signName='+signname);
  }
  Promise.all([
    StudentModel.findStudentByIdAndCoursename(id, coursename),
    SignDetailModel.getItemByCSID(coursename, signname, id),
    SignDetailModel.getItemByCSIP(coursename, signname, ip)
  ])
    .then(function (result) {
      var student = result[0];
      // console.log("数据库的学生：" + student.toString());
      var s1 = result[1];
      var s2 = result[2];
      var signDetail = {};
      signDetail.courseName = coursename;
      signDetail.signName = signname;
      signDetail.name = name+"";
      signDetail.id = id+"";
      console.log("学号是：" + id);
      if (!student) {
        console.log("该学生学号不在本课程");
        req.flash('error', "该学生学号不在本课程");
        return res.redirect('back');
      } else if (student.name != name) {
        req.flash('error', "姓名与学号不匹配");
        console.log("姓名与学号不匹配");
        return res.redirect('back');
      } else {
        console.log("学号与姓名匹配");
        if (s1.length != 0) {
          console.log(s1);
          req.flash('error', "该同学已签到!");
          console.log("该同学已签到!");
          return res.redirect('back');

        } else if (s2.length != 0) {
          req.flash('error', "该IP地址已签到！");
          console.log("该IP地址已签到！");
          return res.redirect('back');
        } else {
          console.log("写入数据库！");
          signDetail.ip = ip;
          signDetail.gps = gps;
      
      SignDetailModel.create(signDetail)
        .then(function (result) {
          // res.redirect('sign?courseName='+coursename+'\&signName='+signname);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write('<h1>Sign Success!</h1>');
          res.end();
        })
        .catch(function (e) {
          if (e.message.match('E11000 duplicate key')) {
            req.flash('error', '该学号已签到');
            return res.redirect('sign?courseName='+coursename+'\&signName='+signname);
          }
        });
      }

        }
      
    })
    .catch(next);
});

router.get('/create_qrcode', function (req, res, next) {
   var text = req.query.text;
   console.log("二维码的text = " + text);
    try {
        var img = qr.image(text,{size :10});
        res.writeHead(200, {'Content-Type': 'image/png'});
        img.pipe(res);
    } catch (e) {
        res.writeHead(414, {'Content-Type': 'text/html'});
        res.end('<h1>414 Request-URI Too Large</h1>');
    }
});


module.exports = router;