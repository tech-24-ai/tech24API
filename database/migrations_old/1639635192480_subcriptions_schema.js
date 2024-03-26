'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubcriptionsSchema extends Schema {
  up () {
    this.table('subcriptions', (table) => {
      // alter table
      table.string('subcription_code').notNullable()
      table.enum('created_type', ['1', '2']).defaultTo('1').notNullable()//1 = Admin ,  2 = Investor
      table.enum('updated_type', ['1', '2']).defaultTo('1').notNullable()//1 = Admin ,  2 = Investor
    })
  }

  down () {
    this.table('subcriptions', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SubcriptionsSchema
