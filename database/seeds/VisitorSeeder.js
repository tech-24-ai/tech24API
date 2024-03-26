'use strict'

/*
|--------------------------------------------------------------------------
| VisitorSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Visitor = use('App/Models/Admin/VisitorModule/Visitor')
const Database = use('Database')
class VisitorSeeder {
  async run() {
    await Database.raw('SET FOREIGN_KEY_CHECKS = 0;')
    await Visitor.truncate()

    const data = [
      {
        visitor_group_id: 1,
        name: 'demo',
        email: 'demo@itmap.com',
        mobile: '',
        designation: 'developer',
        company: 'ITMAP',
        password: 'Demo@1234',
      },
      {
        visitor_group_id: 1,
        name: 'nadim',
        email: 'nadim.sheikh.07@gmail.com',
        mobile: '',
        designation: 'developer',
        company: 'ITMAP',
        password: 'Abcd@1234',
      },
      {
        visitor_group_id: 1,
        name: 'admin',
        email: 'admin@gmail.com',
        mobile: '',
        designation: 'developer',
        company: 'ITMAP',
        password: 'Abcd@1234',
      }
    ]

    await Visitor.createMany(data)
    await Database.raw('SET FOREIGN_KEY_CHECKS = 1;')
  }
}

module.exports = VisitorSeeder
