'use strict'

class StorePermission {
  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        permission_group_id: `required`,
        code: `required|unique:permissions,code,id,${id}`,
      }
    } else {
      return {
        permission_group_id: `required`,
        code: 'required|unique:permissions,code',
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

module.exports = StorePermission
