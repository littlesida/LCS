var express = require('express');
var xlsx = require('node-xlsx');
var router = express.Router();
var qr = require('qr-image');

var UserModel = require('../models/users');
var CourseModel = require('../models/courses');
var SignModel = require('../models/sign');
var StudentModel = require('../models/students');
var SignDetailModel = require('../models/signDetail');
var checkLogin = require('../middlewares/check').checkLogin;
var checkCourseBelong = require('../middlewares/check').checkCourseBelong;
var checkSignBelong = require('../middlewares/check').checkSignBelong;


// home 主页信息
router.get('/', checkLogin, function (req, res, next) {
  var manager = req.session.user.name;
  console.log("home");
  Promise.all([
    UserModel.getUserByName(manager),// 获取用户信息
  ])
  .then(function (result) {
    var author = result[0];
    if (!author) {
      throw new Error('用户不存在');
    }
    // 用户存在，则获取该用户的所有课程
    CourseModel.getCourses(manager)
    .then(function (courses) {
      res.render('home', {
        author: author,
        courses: courses
      });
    })
    
  })
  .catch(next);
});

router.post('/delete', checkLogin,  function(req, res, next) {
  console.log("Delete Yes!");
  var courseId = req.fields.courseId;
  console.log("Delete Course Id is " + courseId);
  Promise.all([
    CourseModel.delCourse(courseId),
  ])
  .then(function(result) {
    if (result == null) console.log("更新失败");
    var tc = result[0];
    console.log("TC bio is " + tc.bio);
  })
  .catch(next);
  
});



// 课程详细信息
router.get('/:courseName', checkLogin, checkCourseBelong, function (req, res, next) {
  var courseName = req.params.courseName;
  console.log("课程名称为:" + courseName);

  Promise.all([
    CourseModel.getCourseByName(courseName),// 获取课程信息
    SignModel.getSigns(courseName), // 获取签到列表
    StudentModel.getStudentByCoursename(courseName), // 读取学生
  ])
  .then(function (result) {
    var course = result[0]; 
    var signs = result[1];  // 签到列表
    var students = result[2];
    console.log("课程id为："+ course._id);
    

// 写入课程详细信息

    res.render('./course/courseDetail', {
      number: students.length,
      course: course,
      signs: signs,
    });

  })
  .catch(next);
});


// 获取学生名单
router.get('/:courseName/stulist', checkLogin, checkCourseBelong, function (req, res, next) {
  var courseName = req.params.courseName;
  Promise.all([
    StudentModel.getStudentByCoursename(courseName),
    CourseModel.getCourseByName(courseName),// 获取课程信息
  ])
  .then(function (result) {
      var students = result[0];
      var course = result[1];
      console.log("students.length = " + students.length);
      console.log("course.length = " + course.length );
      res.render('./course/studentList2', {
        number: students.length,
        datas: students,
        course: course,
      });
    })
    .catch(next);
  //res.render('studentList');
});

// 添加一个学生
router.post('/:courseName/addOneStudent', function(req, res, next) {
  var sid = req.fields.sid;
  var sname = req.fields.sname;
  var courseId = req.params.courseName;
  var addS = {
    stdId : sid,
    name : sname,
    course : courseId
  };
  // console.log("添加学生这里啊");
  // console.log(courseId);
  Promise.all([
    StudentModel.create(addS),
    ])
    .then(function(result) {
      console.log("进入成功.");
      res.writeHead( 200, {'Content-type' : 'text/html'});
      res.end();
    })
    .catch(function (e) {
    if (e.message.match('E11000 duplicate key')) {
      console.log("学生添加失败！")
      res.writeHead( 400, {'Content-type' : 'text/html'});
      return res.end();
    }
    next(e);
  });
    
});


router.post('/:courseName/deleteOneStudent', function(req, res, next) {
  var sid = req.fields.sid;
  var sname = "";
  var courseId = req.params.courseName;
  var deleteS = {
    stdId : sid,
    name : sname,
    course : courseId
  };

  console.log("删除学生这里啊");
  // console.log(courseId);
  Promise.all([
    StudentModel.deleteStudent(deleteS),
    ])
    .then(function(result) {
      var delC = result[0].deletedCount;
      if (delC != 0) {
      // console.log(result[0].deletedCount);
      console.log("删除成功");
      res.writeHead( 200, {'Content-type' : 'text/html'});
      res.end();
    } else {
      console.log("删除失败");
      res.writeHead( 400, {'Content-type' : 'text/html'});
      res.end();
    }
    })
    .catch(next);
    
});


// 删除签到
router.post('/:courseName/delete', function(req, res, next) {
  console.log("Delete Sign Yes!");
  var courseId = req.fields.courseId;
  var signname = req.fields.signname;
  console.log("Delete Course Id is " + courseId);
  Promise.all([
    // CourseModel.delCourse(courseId),
    SignModel.deleteSign(courseId, signname),
  ])
  .then(function(result) {
    console.log("删除签到，输出result!");
    // console.log(result);
    if (result == null) console.log("更新失败");
  })
  .catch(next);
});

// 获取签到详情
router.get('/:courseName/:signName', checkLogin, checkCourseBelong, checkSignBelong, function (req, res, next) {
  console.log("进入签到详情: ", req.params.signName);
  var coursename = req.params.courseName;
  var signname = req.params.signName;
  var hadsigns = [];
  var notsigns = [];
  var errorsigns = [];
  var students = [];
  Promise.all([
    StudentModel.getStudentByCoursename(coursename),   // 读取学生名单
    SignDetailModel.getItemsByCS(coursename, signname),// 获取签到正确名单
    // SignDetailModel.getErrorItemsByCourseAndSignName(coursename, signname), // 获取签到错误名单
  ])
  .then(function (result) {
    students = result[0];
    hadsigns = result[1];
    // errorsigns = result[2];
    notsigns = students.filter(item => !hadsigns.map(item1 => item1.id).includes(item.stdId));
    res.render('./sign/signDetail', {
      coursename: req.params.courseName,
      signname: req.params.signName,
      hadSigns: hadsigns,
      notSigns: notsigns
    });
  })
  .catch(next);
  
});


router.get('/:courseName/:signName/checkRemote', checkLogin, checkCourseBelong, checkSignBelong, function (req, res, next) {
  console.log("进入检查远程签到: ", req.params.signName);
  var coursename = req.params.courseName;
  var signname = req.params.signName;
  var hadsigns = [];
  var students = [];
  var x = [];
  var y = [];
  var X = 0;
  var Y = 0;
  Promise.all([
    // StudentModel.getStudentByCoursename(coursename),   // 读取学生名单
    SignDetailModel.getItemsByCS(coursename, signname),// 获取签到名单
    // SignDetailModel.getErrorItemsByCourseAndSignName(coursename, signname), // 获取签到错误名单
  ])
  .then(function (result) {
    hadsigns = result[0];
    for (var i = 0; i < hadsigns.length; ++i) {
      var tx= parseFloat(hadsigns[i].gps.split(',')[0]);
      var ty= parseFloat(hadsigns[i].gps.split(',')[1]);
      X += tx; Y += ty;
    }
    var tl = hadsigns.length;
    if (tl != 0) {
      X = X / tl;
      Y = Y / tl;
    }
    for (var i = 0; i < hadsigns.length; ++i) {
      var ttx= parseFloat(hadsigns[i].gps.split(',')[0]);
      var tty= parseFloat(hadsigns[i].gps.split(',')[1]);
      if ((ttx-X > 0.003) || (X-ttx > 0.003) || (tty-Y > 0.003) || (Y-tty > 0.003)) {
        students.push(hadsigns[i]);
      } else {
        // students.push(hadsigns[i]);
      }
    }
    
    res.render('./sign/remoteSign', {
      coursename: req.params.courseName,
      signname: req.params.signName,
      hadSigns: students,
    });
  })
  .catch(next);
  
});


router.get('/:courseName/:signName/changeTime', checkLogin, checkCourseBelong, function (req, res, next) {
  var courseId = req.params.courseName;
  var signname = req.params.signName;
  Promise.all([
    CourseModel.getCourseByName(courseId),
    SignModel.findSignByCourseAndSignName(courseId, signname),
  ])
  .then(function (result) {
   var courseName = result[0].name;
   var sign = result[1];
     // var date = new Date();
     var st = sign.st.split(' ')[0] + 'T' + sign.st.split(' ')[1];
     var et = sign.et.split(' ')[0] + 'T' + sign.et.split(' ')[1];
      // var Y = date.getFullYear() + '-';
      // var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
      //  var D = date.getDate() + 'T';
      //  var  h = (date.getHours()<10?'0'+date.getHours(): date.getHours())+ ':';
      //   var m = date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes();
      //   var st = Y+M+D+h+m;
        console.log("默认的开始时间为:" + st);

      // var nextweek = new Date(date);
      // nextweek.setDate(date.getDate()+7);
      // var nY = nextweek.getFullYear()+'-';
      // var nM = (nextweek.getMonth()+1<10 ? '0'+(nextweek.getMonth()+1) : nextweek.getMonth()+1) + '-';
      // var nD = nextweek.getDate()+'T';
      // var nh = (nextweek.getHours()<10 ? '0'+nextweek.getHours() : nextweek.getHours())+':';
      // var nm = nextweek.getMinutes() < 10 ? '0' + nextweek.getMinutes() : nextweek.getMinutes();
      //  var et = nY+nM+nD+nh+nm;
       console.log("默认的结束时间为:" + et);
        console.log("course is "+courseName);
          res.render('./sign/changeTime', {
            courseId : courseId,
    courseName : courseName,
    signName: sign.signName,
    st : st,
    et: et
  });
  })
  .catch(next);
});


router.post('/:courseName/:signName/changeTime', checkLogin, checkCourseBelong, function (req, res, next) {
  var courseId = req.params.courseName;
  var signname = req.params.signName;
    var st = req.fields.st;
  var et = req.fields.et;
  st = st.split('T')[0] + ' ' + st.split('T')[1];
  et = et.split('T')[0] + ' ' + et.split('T')[1];
  var coursename = req.fields.courseName;

  var ST = st+':00';
  var ET = et + ':00';
  var sDate = new Date(ST);
  var eDate = new Date(ET);
  var sTime = parseInt(sDate.getTime());
  var eTime = parseInt(eDate.getTime());
  try {
    if (eTime < sTime) throw new Error('结束时间不能比开始时间晚');
  } catch(e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }
  var sign = {
courseName: courseId,
signName: signname,
st : st,
et:et,
  };
  Promise.all([
    SignModel.updateTime(sign),
  ])
  .then(function (result) {
      res.redirect('/home/' + courseId);
  })
  .catch(next);
});


router.get('/:courseName/:signName/qrcode', checkLogin, checkCourseBelong, checkSignBelong, function (req, res, next) {
  console.log('查看当前签到的二维码');
  var coursename = req.params.courseName;
  var signname = req.params.signName;
  Promise.all([
      SignModel.findSignByCourseAndSignName(coursename, signname),
    ])
  .then(function(result) {
        var tSign = result[0];
        res.render('qrcode2', {sign:tSign});
  })
  .catch(next);
  // res.render('qrcode2', {
  //   coursename: coursename,
  //   signname : signname
  // });
});

module.exports = router;