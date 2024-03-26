'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvestorFilterSchema extends Schema {
  up () {
    this.create('investor_filters', (table) => {      
      table.integer('investor_id').unsigned().references('id').inTable('investors').onDelete('cascade').onUpdate('cascade')
      table.text('text')      
    })
  }

  down () {
    this.drop('investor_filters')
  }
}

module.exports = InvestorFilterSchema
