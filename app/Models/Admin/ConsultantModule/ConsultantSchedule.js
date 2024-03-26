"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantSchedule extends Model {
  static get hidden() {
    return ["created_by", "updated_by"];
  }

  consultant() {
    return this.hasOne(
      "App/Models/Admin/ConsultantModule/Consultant",
      "consultant_id",
      "id"
    );
  }

  scheduleTime() {
    return this.hasMany(
      "App/Models/Admin/ConsultantModule/ConsultantScheduleTime",
      "id",
      "schedule_id"
    );
  }
  timeZone() {
    return this.belongsTo(
      "App/Models/Admin/LocationModule/TimeZone",
      "time_zone_id",
      "id"
    );
  }

  static get dates() {
    return super.dates.concat(["created_at", "updated_at"]);
  }

  static castDates(field, value) {
    if (["created_at", "updated_at"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = ConsultantSchedule;
