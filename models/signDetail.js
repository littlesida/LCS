var SignDetail = require('../lib/mongo').SignDetail;


module.exports = {
    create: function create(signDetail) {
    return SignDetail.create(signDetail).exec();
  },

// 获取某次签到的所有信息
  getItemsByCS: function getItemsByCS(course, sign) {
    var query = {};
    query.courseName = course;
    query.signName = sign;
    return SignDetail
      .find(query)
      .sort({_id: -1})
      .addCreatedAt()
      .exec();
  },
  // c = coursename  S= signname I = Id
  getItemByCSID: function getItemByCSID(course, sign, id) {
    var query = {};
    query.courseName = course;
    query.signName = sign;
    query.id = id;
    return SignDetail
      .find(query)
      .sort({_id: -1})
      .addCreatedAt()
      .exec();
  },
  getItemByCSIP: function getItemByCSIP(course, sign, ip) {
    var query = {};
    query.courseName = course;
    query.signName = sign;
    query.ip = ip;
    return SignDetail
      .find(query)
      .sort({_id: -1})
      .addCreatedAt()
      .exec();
  }
};