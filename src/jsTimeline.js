/*!
 * jsTimeline JavaScript Library
 * http://github.com/patrys/jstimeline
 *
 * Copyright 2010, Patryk Zawadzki
 * Copyright 2010, Toms Baugis
 *
 */

/*global jsAnimator: true, jsTimeline: true, jsTweener: true, jsEasing: true, jsGenericTimeline: true, jsNativeTimeline: true, jsTimelineTweener: true, window: false*/

jsAnimator = function(attach, detach) {
    if (this === window) {
        return new jsAnimator(attach, detach);
    }
    var that = this;
    that.attach = attach;
    that.detach = detach;
    that.listeners = [];
    that.connected = false;
    that.paused = false;
    that.pausedAt = 0;
    that.offset = 0;
    that.lastTime = 0;
    that.tick = function(time) {
        that.lastTime = time;
        if (that.paused) {
            return;
        }
        var listeners = that.listeners;
        var correctedTime = time - that.offset;
        for (var i = listeners.length - 1; i >= 0; i--) {
            var callback = listeners[i];
            var result = callback(correctedTime);
            if (!result) {
                that.disconnect(callback);
            }
        }
    };
    that.connect = function(listener) {
        var listeners = that.listeners;
        for (var i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i] === listener) {
                return;
            }
        }
        listeners.unshift(listener);
        that.attach(that.tick);
    };
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
    };
    that.getTime = function() {
        if (that.paused) {
            return that.pausedAt - that.offset;
        }
        return that.lastTime - that.offset;
    };
    that.pause = function() {
        if (!that.paused) {
            that.paused = true;
            that.pausedAt = that.lastTime;
        }
    };
    that.unpause = function() {
        if (that.paused) {
            that.paused = false;
            that.offset += that.lastTime - that.pausedAt;
        }
    };
};

jsTweener = function(animator, duration, callback, easing, autoDisconnect, doneCallback) {
    if (this === window) {
        return new jsTweener(animator, duration, callback, easing, autoDisconnect, doneCallback);
    }
    var that = this;
    that.animator = animator;
    that.duration = duration;
    that.callback = callback;
    that.easing = easing;
    that.autoDisconnect = (typeof autoDisconnect === 'undefined') ? true : autoDisconnect;
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
    };
    that.animator.connect(that.tick);
    that.terminate = function() {
        that.animator.disconnect(that.tick);
    };
};

jsEasing = function() {
    /*
       a closure of available functions - scroll to the bottom to see them all.
       the variable "t" used throughout this function refers to a normalized
       (0..1) value that easer represents the position on timeline. Like for
       example second 5 of an animation with duration 10 would be 0.5.
       A fraction is used to highlight the fact that it does not have to be just
       about time. See demos to get an idea.
    */
    var symmetric = function(easeIn, easeOut) {
        var inverse = function(ease) {
            return function(t) {
                t = 1 - t
                return 1 - ease(t)
            };
        };

        easeIn = easeIn || inverse(easeOut);
        easeOut = easeOut || inverse(easeIn);
        return {
            easeIn: easeIn,
            easeOut: easeOut,
            easeInOut: function(t) {
                if (t < 0.5) {
                    return easeIn(t * 2) / 2
                }
                return easeOut((t - 0.5) * 2) / 2 + 0.5
            }
        };
    };

    var backIn = function(t) {
        var s = 1.70158;
        return t * t * ((s + 1) * t - s);
    };

    var bounceOut = function(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            t = t - 1.5 / 2.75;
            return 7.5625 * t * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            t = t - 2.25 / 2.75;
            return 7.5625 * t * t + .9375;
        } else {
            t = t - 2.625 / 2.75;
            return 7.5625 * t * t + 0.984375;
        }
    };

    var expoIn = function(t) {
        if (t == 0 || t == 1)
            return t;

        return Math.pow(2, 10 * t) * 0.001;
    };

    var elasticIn = function(t) {
        var springiness = 0;
        var waveLength = 0;

        if (t == 0 || t == 1) {
            return t;
        }

        waveLength = waveLength || (1 - t) * 0.3;

        var s;
        if (springiness <= 1) {
            springiness = t
            s = waveLength / 4;
        } else {
            s = waveLength / (2 * Math.PI) * Math.asin(t / springiness);
        }

        t = t - 1;
        return -(springiness * Math.pow(2, 10 * t) * Math.sin((t * t - s) * (2 * Math.PI) / waveLength));

    };

    return {
        Linear: symmetric(function(t){return t;}),
        Quad: symmetric(function(t){return t * t;}),
        Cubic: symmetric(function(t){return t * t * t;}),
        Quart: symmetric(function(t){return t * t * t * t;}),
        Quint: symmetric(function(t){return t * t * t * t * t;}),
        Circ: symmetric(function(t){return 1 - Math.sqrt(1 - t * t);}),
        Sine: symmetric(function(t){return 1 - Math.cos(t * (Math.PI / 2));}),
        Back: symmetric(backIn),
        Bounce: symmetric(null, bounceOut),
        Expo: symmetric(expoIn),
        Elastic: symmetric(elasticIn)
    };
}();

jsGenericTimeline = function() {
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
}();

jsTimeline = jsGenericTimeline;

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

if (typeof requestAnimationFrame !== 'undefined') {
    jsNativeTimeline = function() {
        var attached = null;
        var offset = 0;
        function attach(callback) {
            function tick(ev) {
                var time = +new Date();
                callback((time - offset) / 100);
                if (attached) {
                    requestAnimationFrame(attached);
                }
            }
            if (!attached) {
                attached = tick;
                offset = +new Date();
                requestAnimationFrame(attached);
            }
        }
        function detach(callback) {
            if (attached) {
                attached = null;
            }
        }
        return new jsAnimator(attach, detach);
    }();

    jsTimeline = jsNativeTimeline;
}

jsTimelineTweener = function(duration, callback, easing, autoDisconnect, doneCallback) {
    return new jsTweener(jsTimeline, duration, callback, easing, autoDisconnect, doneCallback);
};
