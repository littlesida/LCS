var Sign = require('../lib/mongo').Sign;

module.exports = {

  create: function create(sign) {
    return Sign.create(sign).exec();
  },

  findSignByCourseAndSignName: function findSignByCourseAndSignName(course, sign) {
    return Sign
      .findOne({ courseName: course, signName: sign })
      .addCreatedAt()
      .exec();
  },

  getSigns: function getSigns(course) {
    var query = {};
    if (course) {
      query.courseName = course;
      query.del = false;
    }
    return Sign
      .find(query)
      .sort({ _id: -1 })
      .addCreatedAt()
      .exec();
  },

  deleteSign: function deleteSign(courseId, signname) {
    return Sign
        .update({courseName: courseId, signName: signname}, {$set:{del: true}})
        .exec();
  },

  updateTime: function updateTime(sign) {
    return Sign
        .update({courseName : sign.courseName, signName: sign.signName}, {$set:{st: sign.st, et: sign.et}})
        .exec();
  }
};