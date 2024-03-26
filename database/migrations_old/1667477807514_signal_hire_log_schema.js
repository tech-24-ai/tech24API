'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SignalHireLogSchema extends Schema {
  up () {
    this.create('signalhire_logs', (table) => {
      table.increments()
      table.string("type").nullable();
      table.text("json_data").nullable();
      table.integer("visitor_id").nullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('signalhire_logs')
  }
}

module.exports = SignalHireLogSchema
