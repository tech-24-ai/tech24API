'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const User = use('App/Models/User');
const Database = use('Database')
class UserSeeder {
  async run() {
    await Database.raw('SET FOREIGN_KEY_CHECKS = 0;')
    await User.truncate()
    let query = new User()
    query.role_id = 1
    query.name = 'admin'
    query.email = 'admin@gmail.com'
    query.password = 'Abcd@1234'
    await query.save()
    await Database.raw('SET FOREIGN_KEY_CHECKS = 1;')
  }
}

module.exports = UserSeeder
