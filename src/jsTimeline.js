jsAnimator = function(attach, detach) {
    var _private = {
        listeners: [],
        connected: false,
        lastTime: 0,
        tick: function(time) {
            _private.lastTime = time;
            var listeners = _private.listeners;
            for (var i = listeners.length - 1; i >= 0; i--) {
                var callback = listeners[i];
                result = callback(time);
                if (!result) {
                    _public.disconnect(callback);
                }
            }
            return false;
        }
    }
    var _public = {
        connect: function(listener) {
            var listeners = _private.listeners;
            for (var i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i] == listener) {
                    return;
                }
            }
            listeners.unshift(listener);
            attach(_private.tick);
        },
        disconnect: function(listener) {
            var listeners = _private.listeners;
            for (var i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i] == listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
            if (!listeners.length) {
                detach(_private.tick);
            }
        },
        getTime: function() {
            return _private.lastTime;
        }
    }
    return _public;
}

jsTimeline = function() {
    var _private = {
        timer: null,
        offset: 0,
        attach: function(callback) {
            function tick() {
                var time = +new Date();
                callback((time - _private.offset) / 100);
            }
            if (!_private.timer) {
                _private.offset = +new Date();
                _private.timer = setInterval(tick, 20);
            }
        },
        detach: function(callback) {
            if (_private.timer) {
                clearInterval(_private.timer);
                _private.timer = null;
            }
        }
    }
    _public = jsAnimator(_private.attach, _private.detach)
    return _public;
}()

jsTweener = function(animator) {
    var _public = {
        tween: function(duration, callback, easing, autoDisconnect, doneCallback) {
            var startTime = animator.getTime();
            autoDisconnect = (typeof autoDisconnect == 'undefined') ? true : autoDisconnect;
            tweener = function(timestamp) {
                var delta = timestamp - startTime;
                var pos = (delta < 0) ? 0 : ((delta > duration) ? 1 : delta / duration);
                if (easing) {
                    pos = easing(pos);
                }
                callback(pos);
                if (autoDisconnect && (delta < 0 || delta > duration)) {
                    if (doneCallback) {
                        doneCallback();
                    }
                    return false;
                }
                return true;
            }
            callback(0);
            animator.connect(tweener);
            return tweener;
        }
    }
    return _public;
}

jsTimelineTweener = jsTweener(jsTimeline);

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
