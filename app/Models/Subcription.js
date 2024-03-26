'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Subcription extends Model {

    users() {
        return this.belongsTo('App/Models/Investor','user_id','id')
    }

    plans() {
        return this.belongsTo('App/Models/MarketPlan','plan_id','id')
    }

    transactions() {
        return this.belongsTo('App/Models/TransactionHistory','transaction_id','id')
    }


    invoices() {
        return this.belongsTo('App/Models/Invoice','id','subscription_id')
    }

    modules() {
        return this.belongsToMany('App/Models/Admin/ProductModule/Module')
            .pivotModel('App/Models/ModuleSubscription')            
    }

    countries() {
        return this.belongsToMany(
          "App/Models/Admin/LocationModule/Country"
        ).pivotModel("App/Models/Admin/PartnerModule/CountriesSubscription");
      }

    regions() {
        return this.belongsToMany(
            "App/Models/Admin/LocationModule/CountryGroup"
        ).pivotModel("App/Models/Admin/PartnerModule/RegionsSubscription");
    }

    static get dates() {
        return super.dates.concat(['created_at', 'updated_at','subscription_start_date', 'subscription_end_date'])
    }

    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('DD-MM-YYYY hh:mm A')
        }

        if (['subscription_start_date', 'subscription_end_date'].includes(field)) {
            return moment(value).format('DD-MM-YYYY')
        }
        return super.formatDates(field, value)
    }
}

module.exports = Subcription
