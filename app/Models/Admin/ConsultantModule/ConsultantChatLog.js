"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantChatLog extends Model {
  static get updatedAtColumn() {
    return null;
  }
  static get dates() {
    return super.dates.concat(["created_at", "message_datetime"]);
  }

  static castDates(field, value) {
    if (["created_at", "message_datetime"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = ConsultantChatLog;
