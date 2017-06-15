var WS_URL = 'ws://37.46.134.23:8080/ws'
    , AUTH_URL = 'http://yapoki.net:7070'
    , WS_TIMEOUT = 500 // таймаут переподключения.
    , WS_ERROR_TIMEOUT = 7000 // время за которое должен прийти ответ на сообщение, иначе выдаётся предупреждение
    , WS_WAIT_RE = 300 // повторная отправка запросов.


    , ALERT_TIME = 10000 // время показа предупреждения
    , FREEZE_IMPORTANT_ALERT = 2000 // время блокировки предупреждения.

    , SESSION_HASH = $.cookie( 'hash' )
    , TEST = $.cookie('TEST') === 'true'

    , HASH_COOK = "8746fffb4f2e033aabefa8103e7e4f4d183f0098f1e6513a718c0dcff60be6c2048faaefc6477973c321c8f7c52c96d078c99b188ac2a11a221fb97fa957ccd3"
    , HASH_DELIVERYMAN = "34876c15cf8bcdd3261aa10c29c84d9df529d5f784e1dc39ef84240fac8e54c3366dd6b9420023ded5fa4965f1392f16aa1687fde41fd7825d1e11a1686abe9c"
    , HASH_CASHIER = "dcfb7d4d43418b73fba6be0d51ce988e1a84dacda379e3ba3e1f3bef932d4c92c074009d331af45875dabc4fcf6e161925b93d1e67336f13540dfe4af063b556"
    , HASH_OPERATOR = "30a88dcd705dda89507babfb30c44c2d0fd42e5ed7b4c453290a6b6e919937f7344bca0bbb8de040573254f728658869e1e069b50a70766a03a8a2be463ec5e6"

    , ALERT_CLIENT_IN_BLACK_LIST = "Клиент в чёрном списке!"

    , NO_NAME = 'Без имени'
    , DELIVERY = 'Доставка'
    , TAKEAWAY = 'Навынос'

    , EMPTY_TIME = "0001-01-01T00:00:00Z"


    , TYPE_PAYMENTS = {
        1: "Наличные"
        , 2: "Банковская карта"
        , 3: "Яндекс деньги"
        , 4: "WebMoney"
        , 5: "Bitcoin"
    }
    , STATUS = {
        1: { "ID": 1, "Name": "Предзаказ" },
        2: { "ID": 2, "Name": "Принят" },
        3: { "ID": 3, "Name": "Передан" },
        4: { "ID": 4, "Name": "В работе" },
        5: { "ID": 5, "Name": "Раскатка" },
        6: { "ID": 6, "Name": "Начинение" },
        7: { "ID": 7, "Name": "Запекание" },
        8: { "ID": 8, "Name": "Приготовлен" },
        9: { "ID": 9, "Name": "Собран" },
        10: { "ID": 10, "Name": "Доставлятся" },
        11: { "ID": 11, "Name": "Доставлен" },
        12: { "ID": 12, "Name": "На месте в ожидании" },
        13: { "ID": 13, "Name": "Заказ не забрали" },
        14: { "ID": 14, "Name": "На переделке" },
        15: { "ID": 15, "Name": "Отменен со списанием" },
        16: { "ID": 16, "Name": "Отменен без списания" }
    }
    , SIDE_ORDER_LIST = {
        1: "оператор", 2: "кассир"
        , 3: "почта", 4: "приложение"
    }
;