'use strict'

class StoreVisitor {
  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        name: 'required',
        mobile: 'required',
        email: `required|unique:visitors,email,id,${id}`,
      }
    } else {
      return {
        name: 'required',
        mobile: 'required',
        email: 'required|unique:visitors,email',
      }
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVisitor
