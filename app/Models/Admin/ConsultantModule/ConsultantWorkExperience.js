"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class ConsultantWorkExperience extends Model {
  consultant() {
    return this.belongsTo(
      "App/Models/Admin/ConsultantModule/Consultant",
      "consultant_id",
      "id"
    );
  }

  // static boot() {
  //   super.boot();

  //   /**
  //    * A hook to hash the user password before saving
  //    * it to the database.
  //    */
  //   this.addHook("beforeSave", async (userInstance) => {
  //     userInstance.from_year = moment(userInstance.from_year, "YYYY").format(
  //       "YYYY-MM-DD"
  //     );
  //     userInstance.to_year = moment(userInstance.to_year, "YYYY").format(
  //       "YYYY-MM-DD"
  //     );
  //   });
  // }

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

module.exports = ConsultantWorkExperience;
