'use strict'

/*
|--------------------------------------------------------------------------
| OptionToSubOptionSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/
const Database = use('Database')
const Drive = use('Drive')
const table = 'option_sub_options'
const OptionSubOption = use('App/Models/Admin/ProductModule/OptionSubOption')
class OptionToSubOptionSeeder {
  async run() {
    const file = `../database/dump/${table}.json`
    const exists = await Drive.exists(file)
    if (exists) {
      const driveData = await Drive.get(file)
      const data = driveData.toString()
      await Database.raw('SET FOREIGN_KEY_CHECKS = 0;')
      await OptionSubOption.truncate()
      await OptionSubOption.createMany(JSON.parse(data))
      await Database.raw('SET FOREIGN_KEY_CHECKS = 1;')
    }
  }
}

module.exports = OptionToSubOptionSeeder
