"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class Consultant extends Model {
  static get hidden() {
    return ["created_by", "updated_by"];
  }
  modules() {
    return this.belongsToMany(
      "App/Models/Admin/ProductModule/Module"
    ).pivotModel("App/Models/Admin/ConsultantModule/ConsultantTechnology");
  }

  technologies() {
    return this.hasMany(
      "App/Models/Admin/ConsultantModule/ConsultantTechnology"
    );
  }

  categories() {
    return this.belongsToMany(
      "App/Models/Admin/ProductModule/Category"
    ).pivotModel("App/Models/Admin/ConsultantModule/ConsultantTechnology");
  }

  countries() {
    return this.belongsToMany(
      "App/Models/Admin/LocationModule/Country"
    ).pivotModel("App/Models/Admin/ConsultantModule/ConsultantRegion");
  }
  country() {
    return this.belongsTo(
      "App/Models/Admin/LocationModule/Country",
      "country_id",
      "id"
    );
  }
  regions() {
    return this.belongsToMany(
      "App/Models/Admin/LocationModule/CountryGroup"
    ).pivotModel("App/Models/Admin/ConsultantModule/ConsultantRegion");
  }

  works() {
    return this.hasMany(
      "App/Models/Admin/ConsultantModule/ConsultantWorkExperience"
    );
  }
  rates() {
    return this.hasMany("App/Models/Admin/ConsultantModule/ConsultantRateCard");
  }

  skills() {
    return this.hasMany("App/Models/Admin/ConsultantModule/ConsultantRateCard");
  }
  booking() {
    return this.hasMany("App/Models/Admin/ConsultantModule/BookingHistory");
  }

  chat_history() {
    return this.hasMany(
      "App/Models/Admin/ConsultantModule/ConsultantChatHistory"
    );
  }

  static castDates(field, value) {
    if (["created_at", "updated_at"].includes(field)) {
      return moment(value).format("MM-DD-YYYY hh:m A");
    }
    return super.formatDates(field, value);
  }
}

module.exports = Consultant;
