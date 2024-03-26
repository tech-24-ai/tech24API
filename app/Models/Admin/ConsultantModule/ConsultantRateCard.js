"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantRateCard extends Model {
  static get hidden() {
    return ["created_by", "updated_by"];
  }

  skills() {
    return this.belongsTo("App/Models/Skill");
  }

  sub_skills() {
    return this.hasMany("App/Models/Skill", "skill_id", "parent_id");
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

module.exports = ConsultantRateCard;
