var TIMEOUT_UPDATE = 500 // таймаут перед обновлением страницы
    // local login: 888, pass: 888
    // net login: 5, pass: 5
    , SIDE_ORDER = 2 // сторона принятия заказа
    , BEGIN_TIME_FOR_ORDER = Page.timeBeginDay()// Page.time( new Date( 1900, 1, 1, 0, 0, 0, 0 ) ) // время с которого запрашиваются заказы

    ;
////////--------| OTHER |----------------------------------------------------------
var OPEN_CHANGE_EMPLOYEE = 'Открыть смену'
    , CLOSE_CHANGE_EMPLOYEE = 'Закрыть смену'
    ;
//--------------\ OTHER |----------------------------------------------------------

var SHOW_LOG_MSG = false;