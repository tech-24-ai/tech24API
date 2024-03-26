'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SearchReportQuestionsTimeSchema extends Schema {
  up () {
    this.create('search_report_questions_times', (table) => {
      table.increments()
      table.integer('search_report_questions_id').unsigned().references('id').inTable('search_report_questions').onDelete('cascade').onUpdate('cascade')
      table.integer('question_id').unsigned().references('id').inTable('questions').onDelete('cascade').onUpdate('cascade')
      table.datetime('start_date')
      table.datetime('end_date')
      table.integer('time')
    })
  }

  down () {
    this.drop('search_report_questions_times')
  }
}

module.exports = SearchReportQuestionsTimeSchema
