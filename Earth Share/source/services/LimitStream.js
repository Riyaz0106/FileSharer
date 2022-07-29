// @refereence https://gist.github.com/4poc/1454516/8208b391adf7b7af8841c1bee6309f66eb244535

var fs     = require('fs'),
    util   = require('util'),
    Stream = require('stream').Stream;

/**
 * Create a bandwidth limited stream
 *
 * This is a read+writeable stream that can limit how fast it
 * is written onto by emitting pause and resume events to
 * maintain a specified bandwidth limit, that limit can
 * furthermore be changed during the transfer.
 */
function LimitStream() {
  this.readable = true;
  this.writable = true;

  this.limit = null;
  this.sentBytes = this.tmpSentBytes = 0;
  this.startTime = this.tmpStartTime = new Date();
}
util.inherits(LimitStream, Stream);

/**
 * Sets a bandwidth limit in KiB/s
 *
 * Change or sets the bandwidth limit, this also resets
 * the temporary variables tmpSentBytes and tmpStartTime.
 * There extra temporary values because we want to be able
 * to access the global transfer traffic and duration.
 * You can change the bandwidth during the transfer.
 *
 * @param limit the bandwidth (in KiB/s)
 */
LimitStream.prototype.setLimit = function (limit) {
  this.limit = (limit * 1024) / 1000.0; // converts to bytes per ms
  this.tmpSentBytes = 0;
  this.tmpStartTime = new Date();
};

LimitStream.prototype.write = function (data) {
  var self = this;

  this.sentBytes += data.length;
  this.tmpSentBytes += data.length;

  console.log('emit data');
  this.emit('data', data);

  if (self.limit) {
    var elapsedTime = new Date() - this.tmpStartTime,
        assumedTime = this.tmpSentBytes / this.limit,
        lag = assumedTime - elapsedTime;

    if (lag > 0) {
      console.log('emit pause, will resume in: ' + lag + 'ms');
      this.emit('pause');
      setTimeout(function () {
        console.log('emit resume');
        self.emit('resume');
      }, lag);
    }
  }
};

LimitStream.prototype.end = function () {
  console.log('emit end');
  this.emit('end');
};

LimitStream.prototype.error = function (err) {
  console.log('emit error: ' + err);
  this.emit('error', err);
};

LimitStream.prototype.close = function () {
  console.log('emit close');
  this.emit('close');
};

LimitStream.prototype.destroy = function () {
  console.log('emit destroy');
  this.emit('destroy');
};

module.exports = {
  LimitStream
}