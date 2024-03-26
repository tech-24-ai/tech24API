'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MiSegmentSchema extends Schema {
  up () {
    this.create('mi_segments', (table) => {
      table.increments()
      table.string('name')
      table.string('description')
      table.integer('parent_id')
      table.timestamps()
    })

    this.create('investor_mi_segments', (table) => {
      table.integer('investor_id').unsigned().references('id').inTable('investors').onDelete('cascade').onUpdate('cascade')
      table.integer('mi_segment_id').unsigned().references('id').inTable('mi_segments').onDelete('cascade').onUpdate('cascade')
    })
  }

  down () {
    this.drop('investor_mi_segments')
    this.drop('mi_segments')
  }
}

module.exports = MiSegmentSchema
