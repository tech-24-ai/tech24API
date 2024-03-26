'use strict'
const moment = require("moment");

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PricingConfiguration extends Model {

    modules() {
        return this.belongsTo('App/Models/Admin/ProductModule/Module','module_id','id')
    }

    categories() {
        return this.belongsTo('App/Models/Admin/ProductModule/Category','category_id','id')
    }

    pricingModels() {
        return this.belongsTo('App/Models/PricingModel','pricing_model_id','id')
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

module.exports = PricingConfiguration
