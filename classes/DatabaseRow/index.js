const UnexpectedError = require('conjure-core/modules/err').UnexpectedError;

const rowTableName = Symbol('instance row\'s table name');
const rowDeleted = Symbol('indicator that row was deleted');

module.exports = class DatabaseRow {
  constructor(tableName, rowData = {}) {
    this[rowTableName] = tableName;
    this[rowDeleted] = false;

    for (let key in rowData) {
      this[key] = rowData[key];
    }
  }

  /*
    .save is an upsert
    it will either
      A) update an existing record based on it's .id (assumes all tables have .id pk)
      B) inserts a new record if no .id is present
   */
  save(callback) {
    if (this[rowDeleted] === true) {
      callback(new UnexpectedError('This row was previously deleted'));
      return this;
    }

    const DatabaseTable = require('conjure-core/classes/DatabaseTable');

    // no .id, assuming it's a new row to insert
    if (this.id === undefined) {
      DatabaseTable.insert(this[rowTableName], this, (err, rows) => {
        if (err) {
          return callback(err);
        }

        if (!rows.length) {
          return callback(new UnexpectedError('Expected DatabaseTable.insert to return new table row'));
        }

        if (rows.length > 1) {
          return callback(new UnexpectedError('Expected DatabaseTable.insert to return a single new table row'));
        }

        for (let key in rows[0]) {
          this[key] = rows[0][key];
        }

        callback(null, this);
      });
      return this;
    }

    // have a .id, must do an update
    const rowContentWithoutId = Object.assign({}, this);
    delete rowContentWithoutId.id;
    DatabaseTable.update(this[rowTableName], rowContentWithoutId, {
      id: this.id
    }, err => {
      callback(err, this);
    });

    return this;
  }

  delete(callback) {
    if (this[rowDeleted] === true) {
      callback(new UnexpectedError('This row was previously deleted'));
      return this;
    }

    if (this.id === undefined) {
      callback(new UnexpectedError('Exepected row .id to exist, for deletion'));
      return this;
    }

    const DatabaseTable = require('conjure-core/classes/DatabaseTable');
    DatabaseTable.delete(this[rowTableName], {
      id: this.id
    }, err => {
      if (!err) {
        this[rowDeleted] = true;
      }

      callback(err);
    });

    return this;
  }

  // new row object, copies values, but without id
  copy() {
    return new DatabaseRow(this[rowTableName], Object.assign({}, this, {
      id: null
    }));
  }

  // useful for chaining
  set(data) {
    for (let key in data) {
      this[key] = data[key];
    }

    return this;
  }
};
