module.exports = class Repo {
  constructor(data = {}) {
    for (let key in data) {
      this[key] = data[key]
    }

    // service should be overridden by any 
    this.service = 'other'
  }
}
