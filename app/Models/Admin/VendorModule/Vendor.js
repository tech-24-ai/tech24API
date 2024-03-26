'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Vendor extends Model {
    static get hidden() {
        return ['password']
    }
    country() {
        return this.belongsTo('App/Models/Admin/LocationModule/Country','region_id','id')
    }
    locations() {
        return this.hasMany('App/Models/Admin/VendorModule/VendorLocations')                
    }


    financials() {
        return this.hasMany('App/Models/Admin/VendorModule/VendorFinancials')                
    }


    patentips() {
        return this.hasMany('App/Models/Admin/VendorModule/VendorIps')                
    }

    webtraffics() {
        return this.hasMany('App/Models/Admin/VendorModule/VendorWebTraffics')                
    }

    googletrends() {
        return this.hasMany('App/Models/Admin/VendorModule/VendorGoogleTrends')                
    }

    industries() {
        return this.belongsToMany('App/Models/Admin/ProductModule/Industry')
            .pivotModel('App/Models/Admin/VendorModule/IndustryVendor')            
    }
    
    modules() {
        return this.belongsToMany('App/Models/Admin/ProductModule/Module')
            .pivotModel('App/Models/Admin/VendorModule/ModuleVendor')            
    }

    itmap_score() {
        return this.hasMany("App/Models/Admin/VendorModule/VendorItmapScores",'id','vendor_id')    
    }

    vendor_category() {
        return this.belongsTo('App/Models/Admin/VendorModule/VendorCategory')
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

module.exports = Vendor
