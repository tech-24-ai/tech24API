'use strict'

class StoreFaq {
  get rules() {
    return {
      faq_category_id: 'required',
      faq_question: 'required',
      faq_answer: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreFaq
