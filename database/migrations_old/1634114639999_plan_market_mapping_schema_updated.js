'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PlanMarketMappingSchema extends Schema {
  up () {

    this.create('module_market_plans', (table) => {
      table.integer('market_plan_id').unsigned().references('id').inTable('market_plans').onDelete('cascade').onUpdate('cascade')
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('cascade').onUpdate('cascade')
    })
  }

  down () {
    this.drop('module_market_plans')
  }
}

module.exports = PlanMarketMappingSchema
