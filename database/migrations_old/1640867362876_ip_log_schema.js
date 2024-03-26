'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IpLogSchema extends Schema {
  up () {
    this.create('ip_logs', (table) => {
      table.increments()
      table.timestamps()
      table.integer('visitor_id')
      table.string("ip").nullable();
      table.string("country").nullable();
      table.string("city").nullable();
    })
  }

  down () {
    this.drop('ip_logs')
  }
}

module.exports = IpLogSchema
