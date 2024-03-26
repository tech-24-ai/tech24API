'use strict'

class StoreVendor {

  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        name: `required|unique:vendors,name,id,${id}`,
        mobile: 'required',
        email: `required|unique:vendors,email,id,${id}`,
      }
    } else {
      return {
        name: 'required|unique:vendors,name',
        mobile: 'required',
        email: 'required|unique:vendors,email',
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

module.exports = StoreVendor
