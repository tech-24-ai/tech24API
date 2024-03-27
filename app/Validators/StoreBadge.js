'use strict'

class StoreBadge {
	get rules() {
		const id = this.ctx.params.id
		if (id) {
			return {
				title: `required|unique:badges,title,id,${id}`,
				min_range: 'required',
				max_range: 'required',
			}
		} else {
			return {
				title: 'required|unique:badges,title',
				min_range: 'required',
				max_range: 'required',
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

module.exports = StoreBadge
