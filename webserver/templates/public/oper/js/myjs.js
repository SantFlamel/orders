function procCollapse() {
    document.navbar.style.maxHeight = "auto";
}

// Дата и время

function getTime() {
    var d = new Date(), month_num = d.getMonth()
        , day_num = d.getDay(), day = d.getDate()
        , hours = d.getHours(), minutes = d.getMinutes()
        ,
        month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
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
}

getTime();

// Таймер на увеличение 

function startTimer() {
    var timers = $( "[data-role=timer]" );
    $.each( timers, function ( key, up_timer ) {
        timer( up_timer );
    } );
}


// Доставка ко времени
$( '#select_date, #select_time' ).prop( 'disabled', false );
$( '#select_date' ).attr( 'style', 'display:none;' );
$( '#select_time' ).attr( 'style', 'display:none;' );
$( '#on_time' ).prop( "checked", false );

$( '#on_time' ).on( 'click', function () {
    $( this ).toggleClass( 'checked' );
    if ( $( '#on_time' ).hasClass( 'checked' ) ) {
        console.log( 'dct jr' );
        $( '#select_date' ).attr( 'style', 'display:inline-block;' );
        $( '#select_time' ).attr( 'style', 'display:inline-block;' );
        var x = true,
            _date = new Date(),
            _hours = parseInt( _date.getHours() ),
            _minutes = parseInt( _date.getMinutes() ),
            _time = ((_hours + 2) % 24 < 10 ? '0' + (_hours + 2) % 24 : (_hours + 2) % 24) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
        //var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
        var _months = parseInt( _date.getMonth() ) + 1;
        _months = _months < 10 ? '0' + _months : _months;
        var _day = parseInt( _date.getDate() );
        _day = _day < 10 ? '0' + _day : _day;
        _date = _date.getFullYear() + '-' + _months + '-' + _day;
        $( '#select_time' ).val( _time );
        $( '#select_date' ).attr( 'min', _date ).val( _date );
        /* return function () {
         x = !x;
         $('#select_date, #select_time').prop('disabled', x);
         }*/

    }
    else {
        $( '#select_date' ).attr( 'style', 'display:none;' );
        $( '#select_time' ).attr( 'style', 'display:none;' );
    }

    if ( $( "#on_time" ).is( ":checked" ) ) {//?$("#select_time").val():getTimeOnNow();
        $( "#timeFinish1" ).html( timeMinus1( $( "#select_time" ).val(), 30 ) );
        $( "#timeFinish2" ).html( timeMinus1( $( "#select_time" ).val(), 1 ) );
    } else {
        $( "#timeFinish1" ).html( timePlus1( getTimeHM( getTimeOnNow() ), 30 ) );
        $( "#timeFinish2" ).html( timePlus1( getTimeHM( getTimeOnNow() ), 59 ) );
    }
} );


// Строка поиска в операторке

$( '.operator_panel .fa.fa-search' ).on( 'click', function () {
    $( '.operator_panel .tab-pane thead tr:last-child' ).toggleClass( 'visible-tr' );

} );

// Переключатель онлайн-оффлайн

function onOff() {
    if ( $( 'i:hover' ).hasClass( 'fa-toggle-on' ) ) {
        $( 'i:hover' ).removeClass( 'fa-toggle-on' ).addClass( 'fa-toggle-off' );
    } else if ( $( 'i:hover' ).hasClass( 'fa-toggle-off' ) ) {
        $( 'i:hover' ).removeClass( 'fa-toggle-off' ).addClass( 'fa-toggle-on' );
    }
}


// Переключение между активным звонком и набором номера

$( '.call-button' ).on( 'click', function () {
    $( this ).removeClass( 'active' );
    $( '.sidebar' ).attr( 'style', 'background: #303031;' );
} );
$( '.finishcall-button' ).on( 'click', function () {
    $( this ).removeClass( 'active' );
    $( '.sidebar' ).attr( 'style', 'background: transparent;' );
} );

// Набор номера
jQuery( function ( $ ) { // маска номера телефона
    $.mask.definitions['~'] = '[+-]';
    $( '.tel_num' ).mask( '7(999)999-99-99', {
        completed: function () {
        }
    } );
} );

$( "#product_search" ).on( "click", function () {
    $( "#product_search" ).val( "" );
    $( "#product_search" ).keyup();
    //$('.filters input').keyup();
} );

var Page = {
    time: function ( _time, simple ) {
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
    }
};
