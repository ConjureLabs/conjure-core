const nativeErrorKeys = ['address', 'code', 'errno', 'name', 'path', 'port', 'stack', 'syscall']; // omitting 'message' since that will be applied automatically

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
}
module.exports.ConjureError = ConjureError;

class NotFoundError extends ConjureError {}
module.exports.NotFoundError = NotFoundError;

class PermissionsError extends ConjureError {}
module.exports.PermissionsError = PermissionsError;

class UnexpectedError extends ConjureError {}
module.exports.UnexpectedError = UnexpectedError;
