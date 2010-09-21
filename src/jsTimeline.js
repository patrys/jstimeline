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
    };
    that.animator.connect(that.tick);
    that.terminate = function() {
        that.animator.disconnect(that.tick);
    };
};

jsEasing = function() {
    var symmetric = function(easeIn, easeOut) {
        var inverse = function(ease, a, b, c) {  // a, b, c are just some extra vars that function might have
            return function(pos, a, b, c) {
                pos = 1 - pos;
                return 1 - ease(pos, a, b, c);
            };
        };

        easeIn = easeIn || inverse(easeOut);
        easeOut = easeOut || inverse(easeIn);
        return {
            easeIn: easeIn,
            easeOut: easeOut,
            easeInOut: function(pos, a, b, c) {
                if (pos < 0.5) {
                    return easeIn(pos * 2, a, b, c) / 2;
                }
                return easeOut((pos - 0.5) * 2, a, b, c) / 2 + 0.5;
            }
        };
    };

    var backIn = function(pos, s) {
        s = s || 1.70158;
        return pos * pos * ((s + 1) * pos - s);
    };

    var bounceOut = function(pos) {
        if (pos < 1 / 2.75) {
            return 7.5625 * pos * pos;
        } else if (pos < 2 / 2.75) {
            pos = pos - 1.5 / 2.75;
            return 7.5625 * pos * pos + 0.75;
        } else if (pos < 2.5 / 2.75) {
            pos = pos - 2.25 / 2.75;
            return 7.5625 * pos * pos + 0.9375;
        } else {
            pos = pos - 2.625 / 2.75;
            return 7.5625 * pos * pos + 0.984375;
        }
    };

    var expoIn = function(pos) {
        if (pos === 0 || pos == 1) {
            return pos;
        }

        return Math.pow(2, 10 * pos) * 0.001;
    };

    var elasticIn = function(pos, springiness, waveLength) {
        springiness = springiness || 0;
        waveLength = waveLength || 0;

        if (pos === 0 || pos == 1) {
            return pos;
        }

        waveLength = waveLength || (1 - pos) * 0.3;

        var s;
        if (springiness <= 1) {
            springiness = pos;
            s = waveLength / 4;
        } else {
            s = waveLength / (2 * Math.PI) * Math.asin(pos / springiness);
        }

        pos = pos - 1;
        return -(springiness * Math.pow(2, 10 * pos) * Math.sin((pos * pos - s) * (2 * Math.PI) / waveLength));
    };

    return {
        Linear: symmetric(function(pos){return pos;}),
        Quad: symmetric(function(pos){return pos * pos;}),
        Cubic: symmetric(function(pos){return pos * pos * pos;}),
        Quart: symmetric(function(pos){return pos * pos * pos * pos;}),
        Quint: symmetric(function(pos){return pos * pos * pos * pos;}),
        Circ: symmetric(function(pos){return 1 - Math.sqrt(1 - pos * pos);}),
        Sine: symmetric(function(pos){return 1 - Math.cos(pos * (Math.PI / 2));}),
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

if ('mozRequestAnimationFrame' in window) {
    jsNativeTimeline = function() {
        var attached = null;
        var offset = 0;
        function attach(callback) {
            function tick(ev) {
                callback((ev.timeStamp - offset) / 100);
                if (attached) {
                    window.mozRequestAnimationFrame();
                }
            }
            if (!attached) {
                attached = tick;
                offset = window.mozAnimationStartTime;
                window.addEventListener("MozBeforePaint", attached, false);
                window.mozRequestAnimationFrame();
            }
        }
        function detach(callback) {
            if (attached) {
                window.removeEventListener("MozBeforePaint", attached, false);
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
