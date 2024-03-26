'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricingConfigurationPriceMappingSchema extends Schema {
  up () {
    this.createIfNotExists('pricing_configuration_price_mappings', (table) => {
      table.increments()
      table.timestamps()
      table.integer('region_mapping_id').unsigned().nullable()
      table.string('avgprice', 100)
      table.string('currency')

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()
    })

    this.alter('pricing_configuration_price_mappings', table => {
      table.foreign('region_mapping_id')
       .references('pricing_congfiguration_region_mappings.id')
       .onDelete('CASCADE')

       table.foreign('created_by')
       .references('users.id')
       .onDelete('CASCADE')
 
       table.foreign('updated_by')
       .references('users.id')
       .onDelete('CASCADE')
   })
  }

  down () {
    this.drop('pricing_configuration_price_mappings')
  }
}

module.exports = PricingConfigurationPriceMappingSchema
