import test from 'ava';

import waterfall from '../../../modules/async/waterfall';

test.cb('waterfall runs tasks', t => {
  let a = 0;
  let b = 0;
  let c = 0;

  waterfall([
    next => {
      a = 1;
      next();
    },

    next => {
      b = 1;
      next();
    },

    next => {
      c = 1;
      next();
    }
  ], err => {
    const expected = !err && (a & b & c);
    t.end(!expected); // passing inverse to signal no error
  });
});

test.cb('err during flow skips rest of flow', t => {
  let a = 0;
  let b = 0;
  let c = 0; // should not change

  waterfall([
    next => {
      a = 1;
      next();
    },

    next => {
      b = 1;
      next();
    },

    next => {
      next(new Error('forced'));
    }
  ], err => {
    const expected = err && (a & b & ~c);
    t.end(!expected); // passing inverse to signal no error
  });
});

test.cb('args should carry through', t => {
  waterfall([
    next => {
      next(null, 'abc');
    },

    (a, next) => {
      next(null, a, 'okay', 'yup');
    },

    (a, b, c, next) => {
      next(null, a, c);
    }
  ], (err, a, c, nada) => {
    const expected = !err && a === 'abc' && c === 'yup' && !nada;
    t.end(!expected); // passing inverse to signal no error
  })
});

test.cb('initial args should be sent', t => {
  waterfall([
    (a, b, next) => {
      if (a !== 'one' || b !== 'two') {
        next(new Error('something wrong happened'));
      }
      next();
    }
  ], t.end, 'one', 'two');
});

test.cb('empty tasks should finish', t => {
  waterfall([], t.end);
});

test.cb('break func should end flow, with no error', t => {
  let a = 0;
  let b = 0; // should not change
  let c = 0; // should not change

  waterfall([
    next => {
      a = 1;
      next();
    },

    (next, breakFlow) => {
      breakFlow();
    },

    next => {
      next(new Error('should not happen'));
    }
  ], err => {
    const expected = !err && (a & ~b & ~c);
    t.end(!expected); // passing inverse to signal no error
  });
});
