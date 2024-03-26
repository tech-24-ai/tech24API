'use strict'

/*
|--------------------------------------------------------------------------
| OptionSubOptionSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Database = use('Database')
const Drive = use('Drive')
const table = 'sub_options'
const SubOption = use('App/Models/Admin/ProductModule/SubOption')
class OptionSubOptionSeeder {
  async run() {
    const file = `../database/dump/${table}.json`
    const exists = await Drive.exists(file)
    if (exists) {
      const driveData = await Drive.get(file)
      const data = driveData.toString()
      await Database.raw('SET FOREIGN_KEY_CHECKS = 0;')
      await SubOption.truncate()
      await SubOption.createMany(JSON.parse(data))
      await Database.raw('SET FOREIGN_KEY_CHECKS = 1;')
    }
  }
}

module.exports = OptionSubOptionSeeder
