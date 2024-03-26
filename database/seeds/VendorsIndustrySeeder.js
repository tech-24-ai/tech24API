'use strict'

/*
|--------------------------------------------------------------------------
| VendorIndustrySeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Database = use('Database')
const Drive = use('Drive')
const table = 'industry_vendors'
const IndustryVendor = use('App/Models/Admin/VendorModule/IndustryVendor')
class VendorIndustrySeeder {
  async run () {
    const file = `../database/dump/${table}.json`
    const exists = await Drive.exists(file)
    if (exists) {
      const driveData = await Drive.get(file)
      const data = driveData.toString()
      await Database.raw('SET FOREIGN_KEY_CHECKS = 0;')
      await IndustryVendor.truncate()
      await IndustryVendor.createMany(JSON.parse(data))
      await Database.raw('SET FOREIGN_KEY_CHECKS = 1;')
    }
  }
}

module.exports = VendorIndustrySeeder
