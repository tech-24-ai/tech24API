"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantTechnology extends Model {
  // static get incrementing() {
  //   return false;
  // }
  // static get createdAtColumn() {
  //   return null;
  // }
  // static get updatedAtColumn() {
  //   return null;
  // }

  consultant() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/Consultant",
      "consultant_id",
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

module.exports = ConsultantTechnology;
