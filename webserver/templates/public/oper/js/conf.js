var SIDE_ORDER = 1 // сторона принятия заказа
    , SHOW_LOG_MSG = false
;

if ( ~window.location.href.indexOf( 'http://localhost:63342' ) ) {
    WS_URL = 'ws://192.168.0.73:80/ws';
    SESSION_HASH = "44";
    HASH_DELIVERYMAN = "1";
}