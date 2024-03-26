'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricingConfigurationSchema extends Schema {
  up () {
    this.createIfNotExists('pricing_configurations', (table) => {
      table.increments()
      table.timestamps()
      table.string('name').notNullable()
      table.string('unit').notNullable()
      table.integer('pricing_model_id').unsigned().notNullable()
      table.text('notes', 'text').nullable()
      table.integer('category_id').unsigned().notNullable() 
      table.integer('module_id').unsigned().notNullable() 

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()
    })

    this.alter('pricing_configurations', table => {
      table.foreign('pricing_model_id')
       .references('pricing_models.id')
       .onDelete('CASCADE')

      table.foreign('category_id')
      .references('categories.id')
      .onDelete('CASCADE')

      table.foreign('module_id')
      .references('modules.id')
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
    this.drop('pricing_configurations')
  }
}

module.exports = PricingConfigurationSchema
