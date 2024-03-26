'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuMarketPlansSchema extends Schema {
  up () {
    this.table('itmap_eu_market_plans', (table) => {
      // alter table
      table.enum('plan_duration', ['Monthly', 'Yearly']).defaultTo('Yearly').notNullable()
      table.enum('plan_category', ['1', '2','3']).defaultTo('1').notNullable()
    })
  }

  down () {
    this.table('itmap_eu_market_plans', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ItmapEuMarketPlansSchema
