function number_tel( num ) {
    var _input = $( '#tel_num' ), _input_val = _input.val() || "+7(___)___-__-__";
    _input.val( _input_val.replace( /[_]/, num ) )
}

getPhone = function ( id ) {
    id = id || 'client_phone';
    return document.getElementById( id ).value.replace( /\D/g, '' )
};

function counter( val ) {
    var count = val || -1;
    return function () {
        return ++count;
    };
}

length = function ( obj ) {
    var len = 0, i;
    for ( i in obj ) {
        len++;
    }
    return len;
};

////////--------| WARNINGS_MESSAGE |----------------------------------------------------------
/** txt - выводимый текст
 * , alert - тип(null, 'info', 'alert' - разные по цветам)
 * , time - время на которое показывается
 * , except - id сообщения которое нужно удалить при появлении создаваемого
 * , impot - флаг - зафиксировать сообщение

 * возвращает id сообщения.
 * **/
var countWarning = counter();
function warning( txt, alert, time, except, impot ) {
    var i, cl = '', id = 'warning-' + countWarning(), id_elem = 'id="' + id + '"'
        , dublicate = $( 'button:contains(' + txt + ')' )
        , disabled = '';
    if ( alert ) {
        cl = 'class="' + alert + '"';
    }
    if ( except ) {
        if ( Array.isArray( except ) ) {
            for ( i in except ) {
                $( '#' + except[i] ).remove();
            }
        } else {
            $( '#' + except ).remove();
        }
    }
    if ( time ) {
        setTimeout( function () {
            $( '#' + id ).remove();
        }, time );
    }
    if ( impot ) {
        setTimeout( function () {
            $( '#' + id ).removeAttr( 'disabled' )
        }, FREEZE_IMPORTANT_ALERT );
        disabled = 'disabled'
    }
    dublicate.remove();
    document.getElementById( 'warning' ).innerHTML += '<div><button ' + id_elem + ' ' + cl + ' ' + disabled + ' >' + txt + '</button></div>';
    return id;
}
var war = {};
$( document ).on( 'click', '#warning button', function () {
    $( this ).remove();
} );
//--------------\ WARNINGS_MESSAGE |----------------------------------------------------------

checkUndefined = function () {
    var i, ii, j, jj, len = arguments.length;
    for ( i = 0; i < len; i++ ) {
        ii = arguments[i];
        if ( typeof ii === "object" ) {
            for ( j in ii ) if ( ii.hasOwnProperty( j ) ) {
                jj = ii[j];
                if ( typeof jj === "object" ) {
                    (arguments.callee)( jj ); // рекурсия
                } else {
                    console.assert( (jj !== undefined && jj !== "undefined"), 'KEY', j, jj, ii );
                }
            }
        } else {
            console.assert( (ii !== undefined && ii !== "undefined"), 'INDEX', i, ii );
        }
    }
};
