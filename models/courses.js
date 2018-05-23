var Course = require('../lib/mongo').Course;

module.exports = {
  // 创建一个课程
  create: function create(course) {
    return Course.create(course).exec();
  },

    // 通过课程名获取课程信息
  getCourseByName: function getCourseByName(name) {
    console.log("courses.js 中 name 是:" + name);
    return Course
      .findOne({ _id: name })
      .addCreatedAt()
      .exec();
  },

// 获取用户的所有课程
  getCourses: function getCourses(manager) {
    var query = {};
    if (manager) {
      query.manager = manager;
      query.del = false;
    }
    return Course
      .find(query)
      .sort({ _id: -1 })
      .addCreatedAt()
      .exec();
  },

  delCourse: function delCourse(courseId) {
    var CourseId = courseId;
    console.log("进入删除课程");
    return Course
        .update({_id: CourseId}, {$set:{del: true}})
        .exec()
  },

// 获取某课程的名单
  getListByCourse: function getListByCourse(course) {
    return Course
      .findOne({ stulist: course })
      .addCreatedAt()
      .exec();
  }
};
