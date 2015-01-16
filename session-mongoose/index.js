// Generated by CoffeeScript 1.6.3
(function() {
  var Mongoose, Schema, defaultCallback, key, mongoose, value,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Mongoose = require('mongoose');

  mongoose = new Mongoose.Mongoose();

  for (key in Mongoose) {
    value = Mongoose[key];
    if ((mongoose[key] == null) && Mongoose.hasOwnProperty(key)) {
      mongoose[key] = value;
    }
  }

  Schema = mongoose.Schema;

  defaultCallback = function(err) {};

  module.exports = function(connect) {
    var SessionStore;
    return SessionStore = (function(_super) {
      __extends(SessionStore, _super);

      function SessionStore(options) {
        var SessionSchema, connection, err, _base, _base1, _base2, _base3,
          _this = this;
        this.options = options != null ? options : {};
        if ((_base = this.options).url == null) {
          _base.url = "mongodb://localhost/sessions";
        }
        if ((_base1 = this.options).interval == null) {
          _base1.interval = 60000;
        }
        if ((_base2 = this.options).sweeper == null) {
          _base2.sweeper = true;
        }
        if ((_base3 = this.options).modelName == null) {
          _base3.modelName = "Session";
        }
        this.sweeps = 0;
        if (this.options.connection) {
          connection = this.options.connection;
        } else {
          if (mongoose.connection.readyState === 0) {
            connection = mongoose.connect(this.options.url);
          } else {
            connection = mongoose.connection;
          }
        }
        if (this.options.ttl > 0) {
          this.options.sweeper = false;
          SessionSchema = new Schema({
            sid: {
              type: String,
              required: true,
              unique: true
            },
            data: {
              type: Schema.Types.Mixed,
              required: true
            },
            usedAt: {
              type: Date,
              expires: this.options.ttl
            }
          });
        } else {
          SessionSchema = new Schema({
            sid: {
              type: String,
              required: true,
              unique: true
            },
            data: {
              type: Schema.Types.Mixed,
              required: true
            },
            expires: {
              type: Date,
              index: true
            }
          });
          SessionSchema.index({
            sid: 1,
            expires: 1
          });
        }
        try {
          this.model = connection.model(this.options.modelName);
        } catch (_error) {
          err = _error;
          this.model = connection.model(this.options.modelName, SessionSchema);
        }
        if (this.options.sweeper === true) {
          setInterval(function() {
            _this.sweeps++;
            return _this.model.remove({
              expires: {
                '$lte': new Date()
              }
            }, defaultCallback);
          }, this.options.interval);
        }
      }

      SessionStore.prototype.get = function(sid, cb) {
        var query;
        if (cb == null) {
          cb = defaultCallback;
        }
        if (this.options.ttl > 0) {
          query = {
            sid: sid
          };
        } else {
          query = {
            sid: sid,
            expires: {
              '$gte': new Date()
            }
          };
        }
        return this.model.findOne(query, function(err, session) {
          var data;
          if (err || !session) {
            return cb(err);
          } else {
            data = session.data;
            try {
              if (typeof data === 'string') {
                data = JSON.parse(data);
              }
              return cb(null, data);
            } catch (_error) {
              err = _error;
              return cb(err);
            }
          }
        });
      };

      SessionStore.prototype.set = function(sid, data, cb) {
        var cookie, err, expires, session;
        if (cb == null) {
          cb = defaultCallback;
        }
        if (!data) {
          return this.destroy(sid, cb);
        } else {
          try {
            if (this.options.ttl > 0) {
              session = {
                sid: sid,
                data: data,
                usedAt: new Date()
              };
            } else {
              if (cookie = data.cookie) {
                if (cookie.expires) {
                  expires = cookie.expires;
                } else if (cookie.maxAge) {
                  expires = new Date(Date.now() + cookie.maxAge);
                }
              }
              if (expires == null) {
                expires = null;
              }
              session = {
                sid: sid,
                data: data,
                expires: expires
              };
            }
            return this.model.update({
              sid: sid
            }, session, {
              upsert: true
            }, cb);
          } catch (_error) {
            err = _error;
            return cb(err);
          }
        }
      };

      SessionStore.prototype.destroy = function(sid, cb) {
        if (cb == null) {
          cb = defaultCallback;
        }
        return this.model.remove({
          sid: sid
        }, cb);
      };

      SessionStore.prototype.all = function(cb) {
        var select;
        if (cb == null) {
          cb = defaultCallback;
        }
        select = this.options.ttl > 0 ? 'sid' : 'sid expires';
        return this.model.find({}, select, function(err, sessions) {
          var now, session;
          if (err || !sessions) {
            return cb(err);
          } else if (this.options.ttl > 0) {
            return cb(null, (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = sessions.length; _i < _len; _i++) {
                session = sessions[_i];
                _results.push(session.sid);
              }
              return _results;
            })());
          } else {
            now = Date.now();
            sessions = sessions.filter(function(session) {
              if (!session.expires || session.expires.getTime() > now) {
                return true;
              }
            });
            return cb(null, (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = sessions.length; _i < _len; _i++) {
                session = sessions[_i];
                _results.push(session.sid);
              }
              return _results;
            })());
          }
        });
      };

      SessionStore.prototype.clear = function(cb) {
        if (cb == null) {
          cb = defaultCallback;
        }
        return this.model.collection.drop(cb);
      };

      SessionStore.prototype.length = function(cb) {
        if (cb == null) {
          cb = defaultCallback;
        }
        return this.model.count({}, cb);
      };

      return SessionStore;

    })(connect.session.Store);
  };

}).call(this);
