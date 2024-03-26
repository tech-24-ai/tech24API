'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricingConfigurationSchemaChanges extends Schema {
  up () {

    this.alter('pricing_configuration_price_mappings', table => {
      table.integer('currencies_id').unsigned().nullable()
    })

    this.alter('pricing_configuration_price_mappings', table => {
      table.foreign('currencies_id')
       .references('currencies.id')
       .onDelete('CASCADE')
    })
  }

  down () {
    this.drop('pricing_configuration_price_mappings')
  }
}

module.exports = PricingConfigurationSchemaChanges
