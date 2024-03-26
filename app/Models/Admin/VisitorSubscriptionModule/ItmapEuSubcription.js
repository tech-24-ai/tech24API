'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class ItmapEuSubcription extends Model {

    users() {
        return this.belongsTo('App/Models/Admin/VisitorModule/Visitor','user_id','id')
    }

    plans() {
        return this.belongsTo('App/Models/Admin/VisitorSubscriptionModule/ItmapEuMarketPlan','plan_id','id')
    }

    transactions() {
        return this.belongsTo('App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory','payment_transaction_id','id')
    }

    invoices() {
        return this.belongsTo('App/Models/Admin/VisitorSubscriptionModule/Euinvoice','id','subscription_purchase_id')
    }

    createdbyusers() {
        return this.belongsTo('App/Models/Admin/UserModule/User','created_by','id')
    }

    updatedbyusers() {
        return this.belongsTo('App/Models/Admin/UserModule/User','updated_by','id')
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

module.exports = ItmapEuSubcription
