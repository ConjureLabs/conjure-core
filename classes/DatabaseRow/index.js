'use strict';

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
      return callback(new Error('This row was previously deleted'));
    }

    const DatabaseTable = require('classes/DatabaseTable');

    // no .id, assuming it's a new row to insert
    if (this.id === undefined) {
      return DatabaseTable.insert(this[rowTableName], this, (err, rows) => {
        if (err) {
          return callback(err);
        }

        if (!rows.length) {
          return callback(new Error('Expected DatabaseTable.insert to return new table row'));
        }

        if (rows.length > 1) {
          return callback(new Error('Expected DatabaseTable.insert to return a single new table row'));
        }

        for (let key in rows[0]) {
          this[key] = rows[0][key];
        }

        callback(null, this);
      });
    }

    // have a .id, must do an update
    const rowContentWithoutId = Object.assign({}, this);
    delete rowContentWithoutId.id;
    DatabaseTable.update(this[rowTableName], rowContentWithoutId, {
      id: this.id
    }, err => {
      callback(err, this);
    });
  }

  delete(callback) {
    if (this[rowDeleted] === true) {
      return callback(new Error('This row was previously deleted'));
    }

    if (this.id === undefined) {
      return callback(new Error('Exepected row .id to exist, for deletion'));
    }

    const DatabaseTable = require('classes/DatabaseTable');
    DatabaseTable.delete(this[rowTableName], {
      id: this.id
    }, err => {
      if (!err) {
        this[rowDeleted] = true;
      }

      callback(err);
    });
  }
};
