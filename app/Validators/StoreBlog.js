'use strict'

class StoreBlog {
  get rules() {
    return {
      blog_topic_id: 'required',
      name: 'required',
      details: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreBlog
