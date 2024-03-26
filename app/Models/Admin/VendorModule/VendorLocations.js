"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class VendorLocations extends Model {
  country() {
    return this.belongsTo('App/Models/Admin/LocationModule/Country')
  }
  static castDates(field, value) {
    if (["created_at", "updated_at"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = VendorLocations;
