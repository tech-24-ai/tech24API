'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Hash = use('Hash')
const moment = require("moment");

class Investor extends Model {

    static get hidden() {
        return ['password']
    }
    static get computed() {
        return ['investor_type']
    }
    static boot() {
        super.boot()

        /**
         * A hook to hash the user password before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (userInstance) => {
            if (userInstance.dirty.password) {
                userInstance.password = await Hash.make(userInstance.password)
            }
        })
    }

    getInvestorType() {
        return this.is_company ? "Company" : "Investor"
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
    
    mi_segments() {
        return this.belongsToMany('App/Models/Admin/MISegmentModule/MISegment')
            .pivotModel('App/Models/InvestorMISegment')            
    }
}

module.exports = Investor
