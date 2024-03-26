'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuMarketPlansSchema extends Schema {
  up () {
    this.table('itmap_eu_market_plans', (table) => {
      // alter table
      table.string('description1').notNullable()
      table.string('description2').notNullable()
      table.string('description3').notNullable()
    })
  }

  down () {
    this.table('itmap_eu_market_plans', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ItmapEuMarketPlansSchema
