'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubcriptionsSchema extends Schema {
  up () {
    this.table('subcriptions', (table) => {
      table.string("paypal_subscription_id")
      // alter table
    })
  }

  down () {
    this.table('subcriptions', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SubcriptionsSchema
