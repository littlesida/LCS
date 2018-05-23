var express = require('express');
var router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin;
var checkCourseBelong = require('../middlewares/check').checkCourseBelong;
var CourseModel = require('../models/courses');
var SignModel = require('../models/sign');

router.get('/', checkLogin, checkCourseBelong, function (req, res, next) {
  var courseId = req.query.courseName;
  Promise.all([
    CourseModel.getCourseByName(courseId),
  ])
  .then(function (result) {
   var courseName = result[0].name;
     var date = new Date();
      var Y = date.getFullYear() + '-';
      var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
       var D = date.getDate() + 'T';
       var  h = (date.getHours()<10?'0'+date.getHours(): date.getHours())+ ':';
        var m = date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes();
        var st = Y+M+D+h+m;
        console.log("默认的开始时间为:" + st);

      var nextweek = new Date(date);
      nextweek.setDate(date.getDate()+7);
      var nY = nextweek.getFullYear()+'-';
      var nM = (nextweek.getMonth()+1<10 ? '0'+(nextweek.getMonth()+1) : nextweek.getMonth()+1) + '-';
      var nD = nextweek.getDate()+'T';
      var nh = (nextweek.getHours()<10 ? '0'+nextweek.getHours() : nextweek.getHours())+':';
      var nm = nextweek.getMinutes() < 10 ? '0' + nextweek.getMinutes() : nextweek.getMinutes();
       var et = nY+nM+nD+nh+nm;
       console.log("默认的结束时间为:" + et);
        console.log("course is "+courseName);
          res.render('./sign/createSign', {
            courseId : courseId,
    courseName : courseName,
    st : st,
    et: et
  });
  })
  .catch(next);
});

router.post('/', checkLogin, checkCourseBelong, function(req, res, next) {
  var courseName = req.fields.courseName;
  var signName = req.fields.signName;
  var st = req.fields.st;
  var et = req.fields.et;
  st = st.split('T')[0] + ' ' + st.split('T')[1];
  et = et.split('T')[0] + ' ' + et.split('T')[1];
  // var courseId = req.params.courseName;
  var courseId = req.query.courseName;
  console.log('开始时间为:' + st);
  console.log('结束时间为:' + et);
  console.log('课程名称为:' + courseName);
  console.log('签到名称为:' + signName);
  console.log('课程签到名称为:' + courseName);
  try {
    if (!(signName.length >=1 && signName.length <= 20)) {
      console.log('签到名称长度为:' + signName.length);
      throw new Error('签到名称请限制在 1-20 个字符');
    } else if (st == "") {
      throw new Error('请选择签到开始时间');
    } else if (et == "") {
      throw new Error('请选择签到结束时间');
    } else {
      var ST = st+':00';
      var ET = et + ':00';
        var sDate = new Date(ST);
  var eDate = new Date(ET);
    var sTime = parseInt(sDate.getTime());
  var eTime = parseInt(eDate.getTime());
  if (eTime < sTime) throw new Error('结束时间不能比开始时间晚');
    }
  } catch(e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }
// 保存信息
var sign = {
  courseName: courseId,
  signName: signName,
  st : st,
  et : et,
  del : false
};
SignModel.create(sign)
  .then(function(result) {
    
      console.log('创建签到成功');
      console.log('创建签到的id为：' + sign._id);
      req.flash('success', '创建签到成功');
      res.redirect('/home/'+courseId);
  })
  .catch(function (e) {
    if (e.message.match('E11000 duplicate key')) {
      req.flash('error', '该签到已存在');
      return res.redirect('back');
    }
    next(e);
  });
  //req.flash('error', '测试错误');
  //res.redirect('back');
});

module.exports = router;