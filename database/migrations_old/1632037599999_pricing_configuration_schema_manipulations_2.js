'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricingConfigurationSchema extends Schema {
  up () {
    this.table('pricing_configurations', table => {
      table.renameColumn('deal_size', 'graph_y_label')
    })

    this.alter('pricing_congfiguration_region_mappings', table => {
      table.string('deal_size');
    })
  }

  down () {
  }
}

module.exports = PricingConfigurationSchema
