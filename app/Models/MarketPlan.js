'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");

class MarketPlan extends Model {

    modules() {
        return this.belongsToMany('App/Models/Admin/ProductModule/Module')
            .pivotModel('App/Models/ModuleMarketPlan')            
    }

    countries() {
        return this.belongsToMany(
          "App/Models/Admin/LocationModule/Country"
        ).pivotModel("App/Models/CountriesMarketPlan");
      }

    regions() {
        return this.belongsToMany(
            "App/Models/Admin/LocationModule/CountryGroup"
        ).pivotModel("App/Models/RegionsMarketPlan");
    }

    static get dates() {
        return super.dates.concat(['created_at', 'updated_at'])
    }

    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = MarketPlan
