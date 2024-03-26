'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MiSegmentNotesSchema extends Schema {
  up () {
    this.alter('mi_segments', table => {
      table.text('notes', 'text').nullable()
    })
  }

  down () {
    this.drop('notes')
  }
}

module.exports = MiSegmentNotesSchema
