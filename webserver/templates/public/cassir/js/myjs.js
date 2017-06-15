// TODO: поправка времени.
////////--------| AUDIO_ALERT |----------------------------------------------------------
function warningAudio( alert ) {
    alert = alert || 's';
    if ( !warningAudio.timeOut[alert] ) {
        warningAudio.timeOut[alert] = setTimeout( function () {
            warningAudio.timeOut[alert] = false;
            new Audio( "../../public/cassir/audio/ring.mp3" ).play();
        }, 300 );
    }
}
warningAudio.timeOut = { s: false };
//--------------\ AUDIO_ALERT |----------------------------------------------------------

// 'asdfkja;lskj213421lk3j4;k}}}}}}}{{{l/\j;lkj;21"""""""""""""""\'\'\'\'\'\'\'\{}[][][][][][][][][][][][]kj3,,,,4lkj;l...kj;'.replace( /[}{'"]/g, '' )


////////--------| time |----------------------------------------------------------
// Дата и время
var getTime = function () {
    var d = new Date(), month_num = d.getMonth()
        , day_num = d.getDay(), day = d.getDate()
        , hours = d.getHours(), minutes = d.getMinutes()
        , month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
        , weekday = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

    if ( day <= 9 ) {
        day = "0" + day;
    }
    if ( hours <= 9 ) {
        hours = "0" + hours;
    }
    if ( minutes <= 9 ) {
        minutes = "0" + minutes;
    }

    var current_time = hours + ":" + minutes, current_date = weekday[day_num] + ",  " + day + " " + month[month_num];

    $( 'span.doc_time' ).html( current_time ); //TEST
    $( 'span.doc_date' ).html( current_date ); //TEST

    setTimeout( getTime, 30000 );
};
getTime();

Page = {};

Page.time = function ( _time, simple ) {
    // "2016-11-10T14:58:04.09503701Z"
    var now, time;
    if ( _time ) {
        now = _time
    } else {
        now = new Date()
    }
    var year = now.getFullYear(), month = now.getMonth() +
        1, day = now.getDate(), hours = now.getHours(), minutes = now.getMinutes();

    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    if ( simple ) {
        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
    } else {
        var seconds = now.getSeconds(), milliseconds = now.getMilliseconds();

        seconds = seconds < 10 ? '0' + seconds : seconds;
        return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds + 'Z';
    }
};
Page.timeToArray = function ( time ) {
    return time.split( /[TZ\-\:]/g ).slice( 0, -1 );
};
Page.timeBeginDay = function ( date ) {
    date = date || new Date();
    return Page.time( new Date( new Date( date.setDate( date.getDate() ) ).setHours( 0, 0, 0, 0 ) ) );
};
Page.timeReplace = function ( time ) {
    return time.replace( /[T]|[.].+|[Z]/g, ' ' );
};


function waitProp( fn, cond, time, limit, fin ) {
    // fn - функция которая будет исполнена если функция cond вернёт ~true
    var i = 0, t = time || 100, lim = limit || 50;
    (function () {
        if ( cond() ) {
            fn();
        } else if ( i < lim ) {
            console.log( 'no no no' );
            i++;
            setTimeout( arguments.callee, t );
        } else {
            if ( fin ) {
                fin();
            }
        }
    })();
}
function wait( text, func, time ) {
    if ( !wait.list[text] ) {
        wait.list[text] = true;
        setTimeout( function () {
            delete wait.list[text];
            func();
        }, time || 100 )
    }
}
wait.list = {};
function timeOutRe( txt, func, time ) {
    if ( ~timeOutRe.list.indexOf( txt ) ) {
    } else {
        var x = timeOutRe.list.push( txt );
        func();
        setTimeout( function () {
            timeOutRe.list.splice( (x - 1), 1 )
        }, time )
    }
}
timeOutRe.list = [];


function division( val, by ) { // для деления, возвращает целое число.
    return (val - val % by) / by;
}

function Observer() {
    this.subscriberList = {};
}

Observer.prototype.subscribe = function ( events, functions ) {
    if ( !this.subscriberList[events.id] ) {
        this.subscriberList[events.id] = [];
    }
    if ( ~this.subscriberList[events.id].indexOf( functions ) ) {
        return false;
    } else {
        this.subscriberList[events.id].push( functions );
        return true;
    }
};
Observer.prototype.unSubscribe = function ( events, functions ) {
    var index = this.subscriberList[events.id].indexOf( functions );
    if ( this.subscriberList[events.id] && ~index ) {
        this.subscriberList[events.id].splice( index, 1 );
        return true;
    }
    return false;
};

Observer.prototype.newEvent = function ( events, data ) {
    var i;
    for ( i in this.subscriberList[events.id] ) {
        this.subscriberList[events.id][i]( data );
    }
};
var observer = new Observer();


function Events( options ) {
    this.id = Events.getIDEvents();
    if ( options ) {
        this.options = true;
        for ( var i in options ) {
            this[i] = options[i]
        }
    }
}
Events.getIDEvents = counter();
Events.prototype.rise = function ( data ) {
    if ( this.options ) {
        if ( this.timeOut && !this.wait ) {
            var self = this;
            this.wait = true;
            setTimeout( function () {
                self.wait = false;
                observer.newEvent( self, data )
            }, this.timeOut )
        }
    } else {
        observer.newEvent( this, data )
    }
};