'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class ItmapEuDocPurchase extends Model {

    users() {
        return this.belongsTo('App/Models/Admin/VisitorModule/Visitor','user_id','id')
    }

    documents() {
        return this.belongsTo('App/Models/Admin/DocumentModule/Document','document_id','id')
    }

    invoices() {
        return this.belongsTo('App/Models/Admin/VisitorSubscriptionModule/Euinvoice','id','subscription_purchase_id')
    }

    transactions() {
        return this.belongsTo('App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory','payment_transaction_id','id')
    }

    createdbyusers() {
        return this.belongsTo('App/Models/Admin/UserModule/User','created_by','id')
    }

 
    static get dates() {
        return super.dates.concat(['created_at', 'updated_at','purchase_date'])
    }

    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('DD-MM-YYYY hh:mm A')
        }

        if (['purchase_date'].includes(field)) {
            return moment(value).format('DD-MM-YYYY')
        }
        return super.formatDates(field, value)
    }
}

module.exports = ItmapEuDocPurchase
