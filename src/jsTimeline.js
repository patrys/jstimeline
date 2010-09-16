jsAnimator = function(attach, detach) {
    if (this === window) {
        return new jsAnimator(attach, detach);
    }
    var that = this;
    that.attach = attach;
    that.detach = detach;
    that.listeners = [];
    that.connected = false;
    that.lastTime = 0;
    that.tick = function(time) {
        that.lastTime = time;
        var listeners = that.listeners;
        for (var i = listeners.length - 1; i >= 0; i--) {
            var callback = listeners[i];
            result = callback(time);
            if (!result) {
                that.disconnect(callback);
            }
        }
    }
    that.connect = function(listener) {
        var listeners = that.listeners;
        for (var i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i] === listener) {
                return;
            }
        }
        listeners.unshift(listener);
        that.attach(that.tick);
    }
    that.disconnect = function(listener) {
        var listeners = that.listeners;
        for (var i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i] === listener) {
                listeners.splice(i, 1);
                break;
            }
        }
        if (!listeners.length) {
            that.detach(that.tick);
        }
    }
    that.getTime = function() {
        return that.lastTime;
    }
}

jsTweener = function(animator, duration, callback, easing, autoDisconnect, doneCallback) {
    if (this === window) {
        return new jsTweener(animator, duration, callback, easing, autoDisconnect, doneCallback);
    }
    var that = this;
    that.animator = animator;
    that.duration = duration;
    that.callback = callback;
    that.easing = easing;
    that.autoDisconnect = (typeof autoDisconnect == 'undefined') ? true : autoDisconnect;
    that.doneCallback = doneCallback;
    that.startTime = that.animator.getTime();
    that.tick = function(timestamp) {
        var delta = timestamp - that.startTime;
        var duration = that.duration;
        var pos = (delta < 0) ? 0 : ((delta > duration) ? 1 : delta / duration);
        if (that.easing) {
            pos = that.easing(pos);
        }
        that.callback(pos);
        if (delta > duration && that.doneCallback) {
            that.doneCallback();
        }
        if (that.autoDisconnect && (delta < 0 || delta > duration)) {
            return false;
        }
        return true;
    }
    that.animator.connect(that.tick);
    that.terminate = function() {
        that.animator.disconnect(that.tick);
    }
}

jsEasing = {
    easingInCubic: function(pos) {
        return pos * pos * pos;
    },
    easingInQuadratic: function(pos) {
        return pos * pos;
    },
    easingOutCubic: function(pos) {
        return pos * pos * pos - 3 * pos * pos + 3 * pos;
    },
    easingOutQuadratic: function(pos) {
        return -pos * (pos - 2);
    },
    easingInOutCubic: function(pos) {
        return -2 * pos * pos * pos + 3 * pos * pos;
    },
    easingInOutQuadratic: function(pos) {
        var pos = pos * 2;
        if (pos < 1) {
            return 1 / 2 * pos * pos;
        }
        pos--;
        return -1/2 * (pos * (pos - 2) - 1);
    }
}

jsTimeline = function() {
    var timer = null;
    var offset = 0;
    function attach(callback) {
        function tick() {
            var time = +new Date();
            callback((time - offset) / 100);
        }
        if (!timer) {
            offset = +new Date();
            timer = setInterval(tick, 20);
        }
    }
    function detach(callback) {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
    return new jsAnimator(attach, detach);
}()

jsTimelineTweener = function(duration, callback, easing, autoDisconnect, doneCallback) {
    return new jsTweener(jsTimeline, duration, callback, easing, autoDisconnect, doneCallback);
}

