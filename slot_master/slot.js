
var $y = jQuery.noConflict();

(function($) {
    $._spritely = {
        // shared methods and variables used by spritely plugin
        animate: function(options) {
            var el = $(options.el);
            var el_id = el.attr('id');
            options = $.extend(options, $._spritely.instances[el_id] || {});
            if (options.play_frames && !$._spritely.instances[el_id]['remaining_frames']) {
                $._spritely.instances[el_id]['remaining_frames'] = options.play_frames + 1;
            }
            if (options.type == 'sprite' && options.fps) {
                var frames;
                var animate = function(el) {
                    var w = options.width,
                        h = options.height;
                    if (!frames) {
                        frames = [];
                        total = 0
                        for (var i = 0; i < options.no_of_frames; i++) {
                            frames[frames.length] = (0 - total);
                            total += w;
                        }
                    }

                    if (options.rewind == true) {
                        if ($._spritely.instances[el_id]['current_frame'] <= 0) {
                            $._spritely.instances[el_id]['current_frame'] = frames.length - 1;
                        } else {
                            $._spritely.instances[el_id]['current_frame'] = $._spritely.instances[el_id]['current_frame'] - 1;
                        };
                    } else {
                        if ($._spritely.instances[el_id]['current_frame'] >= frames.length - 1) {
                            $._spritely.instances[el_id]['current_frame'] = 0;
                        } else {
                            $._spritely.instances[el_id]['current_frame'] = $._spritely.instances[el_id]['current_frame'] + 1;
                        }
                    }

                    var yPos = $._spritely.getBgY(el);
                    el.css('background-position', frames[$._spritely.instances[el_id]['current_frame']] + 'px ' + yPos);
                    if (options.bounce && options.bounce[0] > 0 && options.bounce[1] > 0) {
                        var ud = options.bounce[0]; // up-down
                        var lr = options.bounce[1]; // left-right
                        var ms = options.bounce[2]; // milliseconds
                        el
                            .animate({
                                top: '+=' + ud + 'px',
                                left: '-=' + lr + 'px'
                            }, ms)
                            .animate({
                                top: '-=' + ud + 'px',
                                left: '+=' + lr + 'px'
                            }, ms);
                    }
                }
                if ($._spritely.instances[el_id]['remaining_frames'] && $._spritely.instances[el_id]['remaining_frames'] > 0) {
                    $._spritely.instances[el_id]['remaining_frames']--;
                    if ($._spritely.instances[el_id]['remaining_frames'] == 0) {
                        $._spritely.instances[el_id]['remaining_frames'] = -1;
                        delete $._spritely.instances[el_id]['remaining_frames'];
                        return;
                    } else {
                        animate(el);
                    }
                } else if ($._spritely.instances[el_id]['remaining_frames'] != -1) {
                    animate(el);
                }
            } else if (options.type == 'pan') {
                if (!$._spritely.instances[el_id]['_stopped']) {
                    if (options.dir == 'up') {
                        $._spritely.instances[el_id]['l'] = $._spritely.getBgX(el).replace('px', '');
                        $._spritely.instances[el_id]['t'] = ($._spritely.instances[el_id]['t'] - (options.speed || 1)) || 0;
                    } else if (options.dir == 'down') {
                        $._spritely.instances[el_id]['l'] = $._spritely.getBgX(el).replace('px', '');
                        $._spritely.instances[el_id]['t'] = ($._spritely.instances[el_id]['t'] + (options.speed || 1)) || 0;
                    } else if (options.dir == 'left') {
                        $._spritely.instances[el_id]['l'] = ($._spritely.instances[el_id]['l'] - (options.speed || 1)) || 0;
                        $._spritely.instances[el_id]['t'] = $._spritely.getBgY(el).replace('px', '');
                    } else {
                        $._spritely.instances[el_id]['l'] = ($._spritely.instances[el_id]['l'] + (options.speed || 1)) || 0;
                        $._spritely.instances[el_id]['t'] = $._spritely.getBgY(el).replace('px', '');
                    }

                    // When assembling the background-position string, care must be taken
                    // to ensure correct formatting.. <ricky.hewitt@artlogic.net>
                    var bg_left = $._spritely.instances[el_id]['l'].toString();
                    if (bg_left.indexOf('%') == -1) {
                        bg_left += 'px ';
                    } else {
                        bg_left += ' ';
                    }

                    var bg_top = $._spritely.instances[el_id]['t'].toString();
                    if (bg_top.indexOf('%') == -1) {
                        bg_top += 'px ';
                    } else {
                        bg_top += ' ';
                    }

                    $(el).css('background-position', bg_left + bg_top);
                }
            }
            $._spritely.instances[el_id]['options'] = options;
            window.setTimeout(function() {
                $._spritely.animate(options);
            }, parseInt(1000 / options.fps));
        },
        randomIntBetween: function(lower, higher) {
            return parseInt(rand_no = Math.floor((higher - (lower - 1)) * Math.random()) + lower);
        },
        getBgY: function(el) {
            if ($.browser.msie) {
                // fixme - the background-position property does not work
                // correctly in IE so we have to hack it here... Not ideal
                // especially as $.browser is depricated
                var bgY = $(el).css('background-position-y') || '0';
            } else {
                var bgY = ($(el).css('background-position') || ' ').split(' ')[1];
            }
            return bgY;
        },
        getBgX: function(el) {
            if ($.browser.msie) {
                // see note, above
                var bgX = $(el).css('background-position-x') || '0';
            } else {
                var bgX = ($(el).css('background-position') || ' ').split(' ')[0];
            }
            return bgX;
        },
        get_rel_pos: function(pos, w) {
            // return the position of an item relative to a background
            // image of width given by w
            var r = pos;
            if (pos < 0) {
                while (r < 0) {
                    r += w;
                }
            } else {
                while (r > w) {
                    r -= w;
                }
            }
            return r;
        }
    };
    $.fn.extend({
        spritely: function(options) {
            var options = $.extend({
                type: 'sprite',
                do_once: false,
                width: null,
                height: null,
                fps: 12,
                no_of_frames: 2,
                stop_after: null
            }, options || {});
            var el_id = $(this).attr('id');
            if (!$._spritely.instances) {
                $._spritely.instances = {};
            }
            if (!$._spritely.instances[el_id]) {
                $._spritely.instances[el_id] = {
                    current_frame: -1
                };
            }
            $._spritely.instances[el_id]['type'] = options.type;
            $._spritely.instances[el_id]['depth'] = options.depth;
            options.el = this;
            options.width = options.width || $(this).width() || 100;
            options.height = options.height || $(this).height() || 100;
            var get_rate = function() {
                return parseInt(1000 / options.fps);
            }
            if (!options.do_once) {
                window.setTimeout(function() {
                    $._spritely.animate(options);
                }, get_rate(options.fps));
            } else {
                $._spritely.animate(options);
            }
            return this; // so we can chain events
        },
        sprite: function(options) {
            var options = $.extend({
                type: 'sprite',
                bounce: [0, 0, 1000] // up-down, left-right, milliseconds
            }, options || {});
            return $(this).spritely(options);
        },
        pan: function(options) {
            var options = $.extend({
                type: 'pan',
                dir: 'left',
                continuous: true,
                speed: 1 // 1 pixel per frame
            }, options || {});
            return $(this).spritely(options);
        },
        flyToTap: function(options) {
            var options = $.extend({
                el_to_move: null,
                type: 'moveToTap',
                ms: 1000, // milliseconds
                do_once: true
            }, options || {});
            if (options.el_to_move) {
                $(options.el_to_move).active();
            }
            if ($._spritely.activeSprite) {
                if (window.Touch) { // iphone method see http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone/9 or http://www.nimblekit.com/tutorials.html for clues...
                    $(this)[0].ontouchstart = function(e) {
                        var el_to_move = $._spritely.activeSprite;
                        var touch = e.touches[0];
                        var t = touch.pageY - (el_to_move.height() / 2);
                        var l = touch.pageX - (el_to_move.width() / 2);
                        el_to_move.animate({
                            top: t + 'px',
                            left: l + 'px'
                        }, 1000);
                    };
                } else {
                    $(this).click(function(e) {
                        var el_to_move = $._spritely.activeSprite;
                        $(el_to_move).stop(true);
                        var w = el_to_move.width();
                        var h = el_to_move.height();
                        var l = e.pageX - (w / 2);
                        var t = e.pageY - (h / 2);
                        el_to_move.animate({
                            top: t + 'px',
                            left: l + 'px'
                        }, 1000);
                    });
                }
            }
            return this;
        },
        // isDraggable requires jQuery ui
        isDraggable: function(options) {
            if ((!$(this).draggable)) {
                //console.log('To use the isDraggable method you need to load jquery-ui.js');
                return this;
            }
            var options = $.extend({
                type: 'isDraggable',
                start: null,
                stop: null,
                drag: null
            }, options || {});
            var el_id = $(this).attr('id');
            $._spritely.instances[el_id].isDraggableOptions = options;
            $(this).draggable({
                start: function() {
                    var el_id = $(this).attr('id');
                    $._spritely.instances[el_id].stop_random = true;
                    $(this).stop(true);
                    if ($._spritely.instances[el_id].isDraggableOptions.start) {
                        $._spritely.instances[el_id].isDraggableOptions.start(this);
                    }
                },
                drag: options.drag,
                stop: function() {
                    var el_id = $(this).attr('id');
                    $._spritely.instances[el_id].stop_random = false;
                    if ($._spritely.instances[el_id].isDraggableOptions.stop) {
                        $._spritely.instances[el_id].isDraggableOptions.stop(this);
                    }
                }
            });
            return this;
        },
        active: function() {
            // the active sprite
            $._spritely.activeSprite = this;
            return this;
        },
        activeOnClick: function() {
            // make this the active script if clicked...
            var el = $(this);
            if (window.Touch) { // iphone method see http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone/9 or http://www.nimblekit.com/tutorials.html for clues...
                el[0].ontouchstart = function(e) {
                    $._spritely.activeSprite = el;
                };
            } else {
                el.click(function(e) {
                    $._spritely.activeSprite = el;
                });
            }
            return this;
        },
        spRandom: function(options) {
            var options = $.extend({
                top: 50,
                left: 50,
                right: 290,
                bottom: 320,
                speed: 4000,
                pause: 0
            }, options || {});
            var el_id = $(this).attr('id');
            if (!$._spritely.instances[el_id].stop_random) {
                var r = $._spritely.randomIntBetween;
                var t = r(options.top, options.bottom);
                var l = r(options.left, options.right);
                $('#' + el_id).animate({
                    top: t + 'px',
                    left: l + 'px'
                }, options.speed)
            }
            window.setTimeout(function() {
                $('#' + el_id).spRandom(options);
            }, options.speed + options.pause)
            return this;
        },
        makeAbsolute: function() {
            // remove an element from its current position in the DOM and
            // position it absolutely, appended to the body tag.
            return this.each(function() {
                var el = $(this);
                var pos = el.position();
                el.css({
                        position: "absolute",
                        marginLeft: 0,
                        marginTop: 0,
                        top: pos.top,
                        left: pos.left
                    })
                    .remove()
                    .appendTo("body");
            });

        },
        spSet: function(prop_name, prop_value) {
            var el_id = $(this).attr('id');
            $._spritely.instances[el_id][prop_name] = prop_value;
            return this;
        },
        spGet: function(prop_name, prop_value) {
            var el_id = $(this).attr('id');
            return $._spritely.instances[el_id][prop_name];
        },
        spStop: function(bool) {
            $(this).each(function() {
                var el_id = $(this).attr('id');
                $._spritely.instances[el_id]['_last_fps'] = $(this).spGet('fps');
                $._spritely.instances[el_id]['_stopped'] = true;
                $._spritely.instances[el_id]['_stopped_f1'] = bool;
                if ($._spritely.instances[el_id]['type'] == 'sprite') {
                    $(this).spSet('fps', 0);
                }
                if (bool) {
                    // set background image position to 0
                    var bp_top = $._spritely.getBgY($(this));
                    $(this).css('background-position', '0 ' + bp_top);
                }
            });
            return this;
        },
        spStart: function() {
            $(this).each(function() {
                var el_id = $(this).attr('id');
                var fps = $._spritely.instances[el_id]['_last_fps'] || 12;
                $._spritely.instances[el_id]['_stopped'] = false;
                if ($._spritely.instances[el_id]['type'] == 'sprite') {
                    $(this).spSet('fps', fps);
                }
            });
            return this;
        },
        spToggle: function() {
            var el_id = $(this).attr('id');
            var stopped = $._spritely.instances[el_id]['_stopped'] || false;
            var stopped_f1 = $._spritely.instances[el_id]['_stopped_f1'] || false;
            if (stopped) {
                $(this).spStart();
            } else {
                $(this).spStop(stopped_f1);
            }
            return this;
        },
        fps: function(fps) {
            $(this).each(function() {
                $(this).spSet('fps', fps);
            });
            return this;
        },
        spSpeed: function(speed) {
            $(this).each(function() {
                $(this).spSet('speed', speed);
            });
            return this;
        },
        spRelSpeed: function(speed) {
            $(this).each(function() {
                var rel_depth = $(this).spGet('depth') / 100;
                $(this).spSet('speed', speed * rel_depth);
            });
            return this;
        },
        spChangeDir: function(dir) {
            $(this).each(function() {
                $(this).spSet('dir', dir);
            });
            return this;
        },
        spState: function(n) {
            $(this).each(function() {
                // change state of a sprite, where state is the vertical
                // position of the background image (e.g. frames row)
                var yPos = ((n - 1) * $(this).height()) + 'px';
                var xPos = $._spritely.getBgX($(this));
                var bp = xPos + ' -' + yPos;
                $(this).css('background-position', bp);
            });
            return this;
        },
        lockTo: function(el, options) {
            $(this).each(function() {
                var el_id = $(this).attr('id');
                $._spritely.instances[el_id]['locked_el'] = $(this);
                $._spritely.instances[el_id]['lock_to'] = $(el);
                $._spritely.instances[el_id]['lock_to_options'] = options;
                window.setInterval(function() {
                    if ($._spritely.instances[el_id]['lock_to']) {
                        var locked_el = $._spritely.instances[el_id]['locked_el'];
                        var locked_to_el = $._spritely.instances[el_id]['lock_to'];
                        var locked_to_options = $._spritely.instances[el_id]['lock_to_options'];
                        var locked_to_el_w = locked_to_options.bg_img_width;
                        var locked_to_el_h = locked_to_el.height();
                        var locked_to_el_y = $._spritely.getBgY(locked_to_el);
                        var locked_to_el_x = $._spritely.getBgX(locked_to_el);
                        var el_l = (parseInt(locked_to_el_x) + parseInt(locked_to_options['left']));
                        var el_t = (parseInt(locked_to_el_y) + parseInt(locked_to_options['top']));
                        el_l = $._spritely.get_rel_pos(el_l, locked_to_el_w);
                        $(locked_el).css({
                            'top': el_t + 'px',
                            'left': el_l + 'px'
                        });
                    }
                }, options.interval || 20);
            });
            return this;
        }
    })
})(jQuery);
// Stop IE6 re-loading background images continuously
try {
    document.execCommand("BackgroundImageCache", false, true);
} catch (err) {}
(function($) {
    if (!document.defaultView || !document.defaultView.getComputedStyle) { // IE6-IE8
        var oldCurCSS = $.curCSS;
        $.curCSS = function(elem, name, force) {
            if (name === 'background-position') {
                name = 'backgroundPosition';
            }
            if (name !== 'backgroundPosition' || !elem.currentStyle || elem.currentStyle[name]) {
                return oldCurCSS.apply(this, arguments);
            }
            var style = elem.style;
            if (!force && style && style[name]) {
                return style[name];
            }
            return oldCurCSS(elem, 'backgroundPositionX', force) + ' ' + oldCurCSS(elem, 'backgroundPositionY', force);
        };
    }

    var oldAnim = $.fn.animate;
    $.fn.animate = function(prop) {
        if ('background-position' in prop) {
            prop.backgroundPosition = prop['background-position'];
            delete prop['background-position'];
        }
        if ('backgroundPosition' in prop) {
            prop.backgroundPosition = '(' + prop.backgroundPosition;
        }
        return oldAnim.apply(this, arguments);
    };

    function toArray(strg) {
        // console.log("toArray: " + strg);

        strg = strg.replace(/left|top/g, '0px');
        strg = strg.replace(/right|bottom/g, '100%');
        strg = strg.replace(/([0-9\.]+)(\s|\)|$)/g, "$1px$2");
        var res = strg.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/);
        return [parseFloat(res[1], 10), res[2], parseFloat(res[3], 10), res[4]];
    }

    $.fx.step.backgroundPosition = function(fx) {
        if (!fx.bgPosReady) {
            var start = $.curCSS(fx.elem, 'backgroundPosition');
            if (!start) { //FF2 no inline-style fallback
                start = '0px 0px';
            }

            start = toArray(start);
            // console.log(start);

            fx.start = [start[0], start[2]];
            var end = toArray(fx.end);
            fx.end = [end[0], end[2]];

            fx.unit = [end[1], end[3]];
            fx.bgPosReady = true;
            start = '0px -3px';
        }
        //return;
        var nowPosX = [];
        nowPosX[0] = ((fx.end[0] - fx.start[0]) * fx.pos) + fx.start[0] + fx.unit[0];
        nowPosX[1] = ((fx.end[1] - fx.start[1]) * fx.pos) + fx.start[1] + fx.unit[1];
        fx.elem.style.backgroundPosition = nowPosX[0] + ' ' + nowPosX[1];

    };
})(jQuery);

let completed = 0;
let rollcompleted = 0;

// let drawNum = [0, 4, 5, 6, 7];

let imgPos = {
    0: -3,
    1: -48,
    2: -92,
    3: -136,
    4: -182,
    5: -226,
    6: 178,
    7: 132,
    8: 88,
    9: 43,
};
// let imgPos = {
//     0: -3,
//     1: 1302,
//     2: 1258,
//     3: 5713,
//     4: 3418,
//     5: 3372,
//     6: 5578,
//     7: 584,
//     8: 539,
//     9: 43,
// };

/**
 * @class Slot
 * @constructor
 */
let slotjs;
(function($) {
    class Slot {
        constructor(el, max, step) {
            this.speed = 0; //speed of the slot at any point of time
            this.step = step; //speed will increase at this rate
            this.el = el; //dom element of the slot
            this.maxSpeed = max; //max speed this slot can have

            // console.log($(el))
            $(el).pan({
                fps: 30,
                dir: "down",
            });
            $(el).spStop();
        }
        /**
         * @method start
         * Starts a slot
         */
        start() {
            let _this = this;
            $(_this.el).addClass("motion");
            $(_this.el).spStart();
            _this.si = setInterval(function() {
                if (_this.speed < _this.maxSpeed) {
                    _this.speed += _this.step;
                    $(_this.el).spSpeed(_this.speed);
                }
            }, 50);
        }
        /**
         * @method stop
         * Stops a slot
         */
        stop(val) {
            let _this = this,
                limit = 30;
            clearInterval(_this.si);
            _this.si = setInterval(function() {
                if (_this.speed > limit) {
                    _this.speed -= _this.step;
                    $(_this.el).spSpeed(_this.speed);
                }
                if (_this.speed <= limit) {
                    _this.finalPos(val);
                    $(_this.el).spSpeed(0);
                    $(_this.el).spStop();
                    clearInterval(_this.si);
                    $(_this.el).removeClass("motion");
                    _this.speed = 0;
                }
            }, 100);
            // completed++;
            rollcompleted++

        }

        /**
        * @method reset
        * Reset a slot to initial state
        */
        reset = function() {
            // console.log("eleme", $(this.el))
            let el_id = $(this.el).attr('id');
            $._spritely.instances[el_id].t = 0;
            $(this.el).css('background-position', '0px -3px');
            this.speed = 0;
            completed = 0;
            rollcompleted = 0;
            console.log("done")
            // $('#result').html('');
        };

        /**
         * @method finalPos
         * Finds the final position of the slot
         */
        finalPos(imagePosition) {
            let el = this.el;
            let bgPos = "";

            bgPos = "0 " + imagePosition + "px";

            $(el).animate({
                backgroundPosition: "(" + bgPos + ")",
            }, {
                duration: 200,
                complete: function() {
                    completed++;
                },
            });
        }
        static startStop = (drawNum, timeinterval = 3000) => {
            //create slot objects
            let x
            let a = new Slot("#slot1", 30, 1);
            let b = new Slot("#slot2", 45, 5);
            let c = new Slot("#slot3", 70, 3);
            let d = new Slot("#slot4", 90, 4);
            let e = new Slot("#slot5", 90, 5);
            a.start();
            b.start();
            c.start();
            d.start();
            e.start();
            
            // this.innerHTML = "Stop";
            setTimeout(function() {
                a.stop(imgPos[drawNum[0]]);
                b.stop(imgPos[drawNum[1]]);
                c.stop(imgPos[drawNum[2]]);
                d.stop(imgPos[drawNum[3]]);
                e.stop(imgPos[drawNum[4]]);
                
                    
                
                

            }, timeinterval);
            // if (rollcompleted === 5) {
                
                    // a.reset();
                    // b.reset();
                    // c.reset();
                    // d.reset();
                    // e.reset();
                
            // }
//             x = window.setInterval(function() {
//                 if( a.speed === 0 && b.speed === 0 && c.speed === 0 && d.speed === 0 && e.speed === 0 && rollcompleted === 5) {
//                     // enableControl();
//                     // window.clearInterval(x);
//                     // printResult();
//                     console.log("rollcompleted", a.speed);
//                     console.log("rollcompleted", b.speed);
//                     console.log("rollcompleted", c.speed);
//                     console.log("rollcompleted", d.speed);
//                     console.log("rollcompleted", e.speed);
//                     console.log("interval completed", completed);
// // setTimeout(function() {
//                     a.reset();
//                     b.reset();
//                     c.reset();
//                     d.reset();
//                     e.reset();
//                     clearInterval(x)
//                     // }, timeinterval)
//                 }
//             }, 100);
        };
    }


    slotjs = (draw) => {
        Slot.startStop(draw);
    }
})(jQuery)





