'use strict'

/*
|--------------------------------------------------------------------------
| VisitorGroupSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const VisitorGroup = use('App/Models/Admin/VisitorModule/VisitorGroup')
class VisitorGroupSeeder {
  async run() {
    const modules = []
    const query = new VisitorGroup()
    query.name = 'Default'
    await query.save()
    await query.modules().detach()
    await query.modules().attach(modules)
  }
}

module.exports = VisitorGroupSeeder
