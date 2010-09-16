jsTimeline
==========

(And why it's a lie.)

What?
-----

Ever wondered if creating tons of JavaScript timers and intervals hurt your performance? Well, I did. Maybe your PC is pure awesome but what about portable devices?

Ever wondered why all these tweening libraries do polynomial math for *each and every value* you want to change on *each and every step*? Well, I did. Easing is nothing more than a fancy name for a silly scaling function. It should take one parameter and return one value.

Easing should be *easy*. Take that, jQuery:

    easingInCubic: function(pos) {
        return pos * pos * pos;
    }

Ever wished you could stop time? Or step through time to debug that piece of animation you've spent last night hacking on? I did. How about being able to attach your timeline to a slider widget?

But what does it do?
--------------------

You could say that it lets you animate stuff over time but that would be like calling your laptop "the thing that displays cute kittens and naked people."

It certainly can animate stuff. Over any range of values. Finite or not. Discrete or continuous. Time is just the most obvious choice.

It can tween things using the duration and easing of your choice.

It does *not* alter any values directly, you probably already have a framework to do that. We simply ask for a callback and you change any attributes you want from there.

It is capable of shutting itself down when there's nothing to do. Who wants to do nothing at 50 frames per second anyway?

It does not use any JavaScript frameworks or libraries.
