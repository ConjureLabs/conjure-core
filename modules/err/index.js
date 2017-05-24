const nativeErrorKeys = ['address', 'code', 'errno', 'name', 'path', 'port', 'stack', 'syscall']; // omitting 'message' since that will be applied automatically

// basic error on our side
class ConjureError extends Error {
  static from(err) {
    const Constructor = this;
    const newError = new Constructor(err.message || err.toString());

    for (let i = 0; i < nativeErrorKeys.length; i++) {
      if (err[ nativeErrorKeys[i] ] === undefined) {
        continue;
      }

      newError[ nativeErrorKeys[i] ] = err[ nativeErrorKeys[i] ];
    }

    return newError;
  }

  get httpStatusCode() {
    return 500;
  }
}
module.exports.ConjureError = ConjureError;

// if something was not found (on web, should trigger a 404)
class NotFoundError extends ConjureError {
  get httpStatusCode() {
    return 404;
  }
}
module.exports.NotFoundError = NotFoundError;

// permissions are not valid
class PermissionsError extends ConjureError {
  get httpStatusCode() {
    return 403;
  }
}
module.exports.PermissionsError = PermissionsError;

// an error occurred where we don't think it should ever
class UnexpectedError extends ConjureError {}
module.exports.UnexpectedError = UnexpectedError;

// missing data, wrong keys passed, etc
class ContentError extends ConjureError {}
module.exports.ContentError = ContentError;
