'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VisitorSchema extends Schema {
  up () {
    this.alter('pricing_configurations', table => {
      table.string('deal_size');
    })
  }

  down () {
  }
}

module.exports = VisitorSchema
