'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class subcriptionsMappingSchema extends Schema {
  up () {

    this.create('module_subscriptions', (table) => {
      table.integer('subcription_id').unsigned().references('id').inTable('subcriptions').onDelete('cascade').onUpdate('cascade')
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('cascade').onUpdate('cascade')
    })

  }

  down () {
    this.drop('module_subscriptions')
  }
}

module.exports = subcriptionsMappingSchema

