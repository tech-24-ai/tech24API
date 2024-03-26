'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NubelaLogSchema extends Schema {
  up () {
    this.create('nubela_logs', (table) => {
      table.increments();
      table.text("type");
      table.string("json_data");
      table.integer("vendor_id");
      table.timestamps();
    })
  }

  down () {
    this.drop('nubela_logs')
  }
}

module.exports = NubelaLogSchema
