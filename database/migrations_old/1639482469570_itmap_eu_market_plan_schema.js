'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuMarketPlanSchema extends Schema {
  up () {
    this.create('itmap_eu_market_plans', (table) => {
      table.increments()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.string('plan_name').notNullable()
      table.decimal('plan_price', 10, 2).unsigned();
      table.decimal('current_price_or_special_price', 10, 2).unsigned();


      table.string('is_active')
      table.string('paypal_plan_id')
    })
  }

  down () {
    this.drop('itmap_eu_market_plans')
  }
}

module.exports = ItmapEuMarketPlanSchema
