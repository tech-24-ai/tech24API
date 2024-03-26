'use strict'

class StorePage {
  get rules() {
    return {
      name: 'required',
      slug: `required|unique:pages,slug`,
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StorePage
