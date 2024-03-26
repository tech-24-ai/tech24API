"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require("moment");
class Partner extends Model {
  modules() {
    return this.belongsToMany(
      "App/Models/Admin/ProductModule/Module"
    ).pivotModel("App/Models/Admin/PartnerModule/ModulePartner");
  }
  vendors() {
    return this.belongsToMany(
      "App/Models/Admin/VendorModule/Vendor"
    ).pivotModel("App/Models/Admin/PartnerModule/VendorsPartners");
  }
  countries() {
    return this.belongsToMany(
      "App/Models/Admin/LocationModule/Country"
    ).pivotModel("App/Models/Admin/PartnerModule/CountriesPartners");
  }
  regions() {
    return this.belongsToMany(
      "App/Models/Admin/LocationModule/CountryGroup"
    ).pivotModel("App/Models/Admin/PartnerModule/RegionsPartners");
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

module.exports = Partner;
