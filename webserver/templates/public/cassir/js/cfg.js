var WS_TIMEOUT = 500 // таймаут переподключения.
    , WS_ERROR_TIMEOUT = 7000 // время за которое должен прийти ответ на сообщение, иначе выдаётся предупреждение
    , WS_WAIT_RE = 300 // повторная отправка запросов.
    , ALERT_TIME = 10000 // время показа предупреждения
    , FREEZE_IMPORTANT_ALERT = 2000 // время блокировки предупреждения.
    , TIMEOUT_UPDATE = 500 // таймаут перед обновлением страницы


    , WS_URL = 'ws://37.46.134.23:8080/ws'
    // , WS_URL = 'ws://192.168.0.63:80/ws'

    , AUTH_URL = 'http://yapoki.net:7070'

    // local login: 888, pass: 888
    // net login: 5, pass: 5
    , SESSION_HASH = cookie.get( 'hash' )
    , SIDE_ORDER = 2 // сторона принятия заказа
    // "Пролетарская" "57"
    // , ORG_HASH = "1854b653819e6cdd44feb00321e54cf398cba9672e78ec9ba9ad1c6b92de8b47e8d97f5788450778d89d646a054e451e341946a8f87e57edc8681a27e0e065d0"
    // "5 микрорайон" "33"
    // , ORG_HASH = "d5f702eb3d250ffe09d8a16677015f450290242dfb86db14231806abaa315951a4d900ecc8ea42bb864f8b4bad51fdb480d192605da599ab2462eba9d414f6c0"
    // "Гоголя" "36"
    , LIMIT_IN_CART = 500


    , BEGIN_TIME_FOR_ORDER = Page.time( new Date( 1900, 1, 1, 0, 0, 0, 0 ) ) // время с которого запрашиваются заказы

    ;
////////--------| OTHER |----------------------------------------------------------
var NO_NAME = 'Без имени'
    , DELIVERY = 'Доставка'
    , TAKEAWAY = 'Навынос'

    // Типы оплаты
    , CARD = 'Картой'
    , CASH = 'Наличными'
    , BONUS = 'Бонусами'
    // Типы действий
    , WITHDRAWAL = 'Изятие' // изятие
    , DEPOSIT = 'Внесение' // внесение
    , PAYMENT = 'Оплата' // оплата
    , RETURN = 'Возврат'

    , DELYVERYMAN_HASH = '34876c15cf8bcdd3261aa10c29c84d9df529d5f784e1dc39ef84240fac8e54c3366dd6b9420023ded5fa4965f1392f16aa1687fde41fd7825d1e11a1686abe9c'
    ;
//--------------\ OTHER |----------------------------------------------------------

////////--------|  |----------------------------------------------------------
var ALERT_CLIENT_IN_BLACK_LIST = "Клиент в чёрном списке!"
    ;
//--------------\  |----------------------------------------------------------

////////--------| выставляем переменные |----------------------------------------------------------
// $('.delivery_met a[href="#delivery"]').html(DELIVERY);
$( '.delivery_met a[href="#take_away"]' ).html( TAKEAWAY );
//--------------\ выставляем переменные |----------------------------------------------------------

////////--------| PRODUCT |----------------------------------------------------------
var FREE_SOUSES_FOR_PIZZA = [87] // Price_id соусов для пицы
    , DISCOUNT_FREE_SOUSES = 'Бесплатный соус для пицы.' // бесплатный сосус для, например, пицы
    ;
//--------------\ PRODUCT |----------------------------------------------------------
