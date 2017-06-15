/***
 *
 *
 * setupSessionInfo запускает загрузку заказов.

 * Загрузка orderList происходит при нажжатии на заказ

 *
 *
 ***/

var Organizations = []
    , orders = {}
    ;

function setupSessionInfo( data ) {
    SESSION_INFO = data;
    $( document ).ready( function () {
        document.getElementById( 'name_role' ).innerHTML = SESSION_INFO.RoleName;
        document.getElementById( 'fio' ).innerHTML = SESSION_INFO.SurName + ' ' + SESSION_INFO.FirstName;
        document.getElementById( 'fio1' ).innerHTML = SESSION_INFO.SurName + ' ' + SESSION_INFO.FirstName;
        $( ".client_name_oper" ).html( document.getElementById( 'client_name' ).value );
        $( "#client .h3" ).html( 'Япоки, оператор ' + SESSION_INFO.FirstName + ', здраствуйте!' );
        if ( $( '.delivery_met.active a' ).html() === 'Навынос' ) {
            $( ".delivery_name" ).html( "приготовлен" );
        } else {
            $( ".delivery_name" ).html( "доставлен" );
        }
    } );
    MSG.request.tabel( SESSION_INFO.UserHash );
    $( '#take_away_address, #take_away_address2' ).empty();
    MSG.request.organization( 'Курган', function () {
        MSG.request.orderByDate( getTimeToday(), getTimeOnNow(), 1000 )
    } )
}


MSG.update = function ( data ) {
    var ID = data.Values[0];
    console.log( 'data.Table', data.Table );

    switch ( data.Table ) {
        // case "Order":
        //     // setTimeout( MSG.request.order, 100, ID, MSG.get.order );
        //     break;
        // case "OrderCustomer":
        //     break;
        // case "OrderList":
        //     break;
        // case "Cashbox":
        //     break;
        // case "OrderPersonal":
        //     break;
        case "OrderStatus":
            if ( data.Values[1] == 0 && orders[data.Values[0]] ) {
                MSG.request.lastOrderStatus( ID, 0, MSG.get.lastOrderStatus );
            } else {
                MSG.request.order( ID, MSG.get.order );
            }
            break;
    }
};


webSocket();

MSG.get.tabel = function ( data ) {
    $( "#horse_m" ).html( data.WorkHours );
    $( "#time_acceptance_order" ).html( data.TimeGetMedium );
    $( "#rating" ).html( data.Rating );
    $( "#award" ).html( data.BalansMinus );
    $( "#balance" ).html( data.Balans );
};

MSG.request.firstOrderStatus = function ( ID, fn ) {
    var s = {
        "Table": "OrderStatus", "Query": "Read", "TypeParameter": "Value"
        , "Values": [ID, 1], "Limit": 0, "Offset": 0
    };
    MSG.send( {
        structure: s, handler: fn, mHandlers: false, EOFHandler: false, check: false
    } );
};
MSG.request.lastOrderStatus = function ( ID, ID_item, fn ) {
    var s = {
        "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructEnd"
        , "Values": [ID, ID_item], "Limit": 0, "Offset": 0, "ID_msg": "statglhis"
    };
    MSG.send( {
        structure: s, handler: fn, mHandlers: false, EOFHandler: false, check: false
    } )
};

MSG.get.firstOrderStatus = function ( data ) {
    orders[data.Order_id].Cause_First = data.Cause;
    orders[data.Order_id].Status_id_First = data.Status_id;
    orders[data.Order_id].UserHashStatus_First = data.UserHash;
    orders[data.Order_id].TimeStatus_First = data.Time;
    $( "#tr" + data.Order_id ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_first_stat" ).innerHTML = (STATUS[data.Status_id].Name || " ");
        document.getElementById( "tr" + data.Order_id + "_first_stat_time" ).innerHTML = getTimeHM( data.Time ) || " ";
        document.getElementById( "tr" + data.Order_id + "_first_stat_minus" ).innerHTML = getTimeHMminus( data.Time ) || " ";
    } );
};
MSG.get.lastOrderStatus = function ( data ) {
    $( "#tr" + data.Order_id ).ready( function () {
        $( "#tr" + data.Order_id + "_last_stat_name" ).text( (STATUS[data.Status_id].Name || " ") );
        $( "#tr" + data.Order_id + "_last_stat_time" ).text( getTimeHM( data.Time ) || " " );

        var parent = $( "#tr" + data.Order_id ).parent()[0],
            main = $( "#tbody1" )[0],
            preorder = $( "#preOrder" )[0],
            finish = $( "#finishOrder" )[0];

        if ( data.Status_id == 1 && parent != preorder ) {//если вкладка не предзаказ и статус предзаказ - перенести в предзаказы
            $( "#ttr" + data.Order_id ).detach().prependTo( $( "#orderListPre" ) );
            $( "#tr" + data.Order_id ).detach().prependTo( $( "#orderListPre" ) );
        }
        if ( parent != main && (data.Status_id == 14) ) {//если вкладка не активные и статус переделка - перенести в активные
            $( "#ttr" + data.Order_id ).detach().prependTo( $( "#tbody1" ) );
            $( "#tr" + data.Order_id ).detach().prependTo( $( "#tbody1" ) );
        }

        if ( parent != finish && (data.Status_id == 11 || data.Status_id == 15 || data.Status_id == 16) ) {//если вкладка не завершенные и статус доставлен или отменен - перенести в завершенные и посчитать время выполнения заказа
            $( "#ttr" + data.Order_id ).detach().prependTo( $( "#orderListFinish" ) );
            $( "#tr" + data.Order_id ).detach().prependTo( $( "#orderListFinish" ) );
            $( "#tr" + data.Order_id + "_first_stat_minus" ).text( timeMinus( getTimeHM( data.Time ), $( "#tr" + data.Order_id + "_first_stat_time" ).text(), 0 ) );

        }
        //обновить количество заказов на вкладках
        $( "#active_tab a span" ).html( $( "#tbody1 tr" ).length / 2 );
        $( "#done_tab a span" ).html( $( "#orderListFinish tr" ).length / 2 );
        $( "#preorder_tab a span" ).html( $( "#orderListPre tr" ).length / 2 );

    } );
};

MSG.get.customer = function ( data ) {
    $( "#tr" + data.Order_id ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_city" ).innerHTML = (data.City || " ");
        document.getElementById( "tr" + data.Order_id + "_cust_name" ).innerHTML = (data.NameCustomer || " ");
        document.getElementById( "tr" + data.Order_id + "_cust_phone" ).innerHTML = (data.Phone || " ");
        document.getElementById( "tr" + data.Order_id + "_cust_address" ).innerHTML = (
            (data.Street || " ") +
            ((data.House && data.House != 0) ? (' д.' + (data.House || 0) ) : " " ) +
            ((data.Building && data.Building != " ") ? (' стр.' + (data.Building || " ") ) : " " ) +
            ((data.Apartment && data.Apartment != 0) ? (' кв.' + (data.Apartment || 0) ) : " " ) +
            ((data.Entrance && data.Entrance != 0) ? (' под.' + (data.Entrance || 0)  ) : " " ) +
            ((data.Floor && data.Floor != 0) ? (' эт.' + (data.Floor || 0)  ) : " " ) +
            ((data.DoorphoneCode && data.DoorphoneCode != 0) ? (' код' + (data.DoorphoneCode || 0) ) : " " )
        );
    } );

    $( "ttr" + data.Order_id ).ready( function () {
        document.getElementById( "ttr" + data.Order_id + "_cust_note" ).innerHTML = (data.Note || " ");
    } );
};


MSG.get.order = function ( data ) {
    if ( data.ID == 0 ) return;
    orders[data.ID] = data;
    var ID = data.ID;

    // MSG.request.orderList( ID, MSG.get.orderList );
    // запрос курьера
    MSG.request.orderPersonal( ID, HASH_DELIVERYMAN, MSG.get.orderPersonal_Deliveryman ); // getOrderPersonalCourierHistory( ID );
    // запрос того кто создал заказ
    if ( data.SideOrder == 2 ) MSG.request.orderPersonal( ID, HASH_CASHIER, MSG.get.orderPersonal_side );
    else if ( data.SideOrder == 1 ) MSG.request.orderPersonal( ID, HASH_OPERATOR, MSG.get.orderPersonal_side );
    MSG.request.firstOrderStatus( ID, MSG.get.firstOrderStatus );//смотрим первый статус
    MSG.request.lastOrderStatus( ID, 0, MSG.get.lastOrderStatus );//смотрим последний
    MSG.request.customer( ID, MSG.get.customer );

    var orderStr = "", tempStr = "";
    for ( var i = 0; i < Organizations.length; i++ )  if ( data.OrgHash == Organizations[i].Hash )   break; //находим организацию
    orderStr += '<tr data-toggle="collapse" class="table-operator__row" id="tr' + data.ID + '" href="#ttr' + data.ID + '" aria-expanded="false">' +
        '<td id="tr' + data.ID + '_city"></td> <td class="order_number">' + data.ID + '</td>' +
        '<td><div  id="tr' + data.ID + '_first_stat"></div> <div  id="tr' + data.ID + '_first_stat_time"></div></td>' +
        '<td>' + data.Type + '<br> <span  id="tr' + data.ID + '_first_stat_minus"></span></td>  <td>' +
        '<div id="tr' + data.ID + '_last_stat_name"></div><div id="tr' + data.ID + '_last_stat_time"></div>' +
        //((i<Organizations.length)?(
        '</td>  <td>' + Organizations[i].Street + ', ' + Organizations[i].House + '</td>' +
//):('</td>  <td>Неверная организация</td>'))+
        '<td><div id="tr' + data.ID + '_cust_name"></div>   <div id="tr' + data.ID + '_cust_phone"></div></td>' +
        '<td id="tr' + data.ID + '_cust_address">' +
        '</td> <td><div  class="_manager" id="tr' + data.ID + '_manager"></div>' +
        '<div>' + textVal( SIDE_ORDER_LIST[data.SideOrder] ) + '</div></td>   <td  id="tr' + data.ID + '_courier"></td></tr>';

    tempStr += '<tr class="collapse table-operator__spoiler-content" id="ttr' + data.ID + '" aria-expanded="false">' +
        '<td colspan="4">   <p class="text-upper">Состав заказа:</p> <ul>';

    if ( data.DiscountPercent != 0 ) tempStr +=
        '<li id="ttr' + data.ID + '_discount">     <div class="pull-right">' + Math.round( data.Price * data.DiscountPercent / 100 ) +
        '</div>Скидка: ' + data.DiscountName + ' ' + data.DiscountPercent + '% </li>';
    tempStr += '<li id="ttr' + data.ID + '_itogo"> <div class="pull-right font_blue">' + data.PriceWithDiscount + '</div>  К оплате  </li></ul></td>' +
        '<td colspan="3" class="text-center">' +
        '<p>Количество персон: <span class="font_blue">' + data.CountPerson + '</span></p>' +
        '<p>Форма оплаты: <span class="font_blue" id="ttr' + data.ID + '_payment">' + TYPE_PAYMENTS[data.TypePayments] + '</span></p>' +
        '<p class="text-upper">Комментарий клиента</p> <div class="font_blue" id="ttr' + data.ID + '_cust_note"></div></td>' +
        '<td colspan="2"><p class="text-upper">Уведомления системы</p>' +
        '<div class="font_blue">' + ((data.TimeDelivery != "0001-01-01T00:00:00Z") ? ("Предзаказ на время - " + data.TimeDelivery + "<br>") : "") +

        ((data.Division != " ") ? ("Обед сотрудника - " + data.Division + "<br>") : "") + data.Note + '</div></td>' +
        // '<td><a href="#" class="editOrder" title="" >Изменить</a>'+ //если статус доставляется
        '<td><a href="#" class="disabled" title="Действие невозможно, заказ доставляется" >Изменить</a>' + //если статус доставляется
        //'<a href="#" class="cancelCauseButton" >Отменить</a>'+
        '<a href="#" class="cancelCauseButton" data-toggle="modal" data-target="#confirm">Отменить</a></td></tr>';
    $( document ).ready( function () {
        if ( $( '#tr' + data.ID ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым
            $( '#tbody1' ).prepend( tempStr ).prepend( orderStr );
        } else {
            $( '#tr' + data.ID ).replaceWith( orderStr );
            $( '#ttr' + data.ID ).replaceWith( tempStr );
        }
    } );
    // $( "#active_tab a span" ).html( active_count );
};
MSG.get.orderPersonal_Deliveryman = function ( data ) {
    $( "#tr" + data.Order_id + '_his' ).ready( function () {
        $( "#tr" + data.Order_id + "_courier_his" ).text( (data.SurName || " ") + " " + (data.FirstName || " ") );
    } );
};
MSG.get.orderPersonal_side = function ( data ) {
    $( "#tr" + data.Order_id ).ready( function () {
        $( "#tr" + data.Order_id + "_manager" ).text( (data.SurName || " ") + " " + (data.FirstName || " ") );
    } );
};

$( document ).on( 'click', '.table-operator__row', function () {
    // если он свёрнут то запрос не происзодит
    if ( this.classList.contains( 'collapsed' ) ) {
        return
    }

    var fn, ID = +(this.id.replace( /\D/g, '' ));
    // провеяем находится ли елемент в основной таблице или истории и выбираем обработчик
    if ( ~this.id.indexOf( '_his' ) ) {
        fn = MSG.get.h_orderList;
    } else {
        fn = MSG.get.orderList;
    }
    MSG.request.orderList( ID, fn );
    // вычищаем список
    $( 'li[id^="ttr' + ID + '_list"' ).remove();
} );

MSG.get.orderList = function ( data ) {
    if ( !orders[data.Order_id].orderlist )
        orders[data.Order_id].orderlist = {};
    orders[data.Order_id].orderlist[data.ID_item] = data;

    $( "#trr" + data.Order_id ).ready( function () {
        var count_id = 'ttr' + data.Order_id + '_list_' + data.Price_id + '_' + data.DiscountPercent;
        var count = $( "#" + count_id + "_count" ).text();
        if ( data.ID_parent_item == 0 ) {
            if ( $( '#' + count_id ).length > 0 ) {
                $( "#" + count_id + "_count" ).text( +count + 1 );
            } else {
                var tempStr =
                    '<li id="' + count_id + '">   <div class="pull-right">' +
                    (( data.DiscountPercent === 100) ? 0 : data.Price) + '</div> ' +
                    data.PriceName + ' x<span  id="' + count_id + '_count">1 </span></li>';
                if ( $( "#ttr" + data.Order_id + "_discount" ).length > 0 ) $( "#ttr" + data.Order_id + "_discount" ).before( tempStr );
                else $( "#ttr" + data.Order_id + "_itogo" ).before( tempStr );
            }
        }
    } );
};

// блокировка всех организация, запрос зон доставки и обработка ответа
MSG.request.deliveryZone = function ( city, street, house ) {
    var s, i, elem;
    city = city || $( "#city_client" ).val();
    street = street || $( ".operator_client_adress .collapse.in #street_client" ).val();
    house = house || $( ".operator_client_adress .collapse.in #home_number" ).val();
    if ( Cart.getType() == DELIVERY && !$( "#ignore_delivery" ).is( ":checked" ) ) {
        for ( i in Organizations ) {
            elem = document.querySelector( '#take_away_address' );
            $( '#take_away_address option[value=' + Organizations[i].Hash + ']' ).attr( 'disabled', 'disabled' );
            if ( elem.value == Organizations[i].Hash ) {
                elem.value = '';
            }
        }
    }
    $( '#take_away_address' ).prop( 'selectedIndex', -1 );

    if ( (street == "" && house == "") || (!street && !house) ) {
        $( "#warning_dellivery" ).html( "Выберите адрес" ).css( "color", "red" );
        return;
    } else if ( city == "" || city == undefined ) {
        $( "#warning_dellivery" ).html( "Введите город" ).css( "color", "red" );
        return;
    } else if ( street == "" || street == undefined ) {
        $( "#warning_dellivery" ).html( "Введите улицу" ).css( "color", "red" );
        return;
    } else if ( house == "" || house == undefined ) {
        $( "#warning_dellivery" ).html( "Введите номер дома" ).css( "color", "red" );
        return;
    } else {
        $( "#warning_dellivery" ).html( "" );
    }

    s = {
        "Table": "GetAreas", "TypeParameter": "WithHouse", "Values": [city, street, house]
    };
    MSG.send( {
        structure: s, handler: function ( data ) {
            var i, ii;
            if ( data.Exist ) {
                for ( i in data.HashList ) {
                    ii = data.HashList[i];
                    console.log( 'ENABLE' );
                    $( '#take_away_address option[value=' + ii + ']' ).attr( 'disabled', false );
                }
                document.getElementById( 'take_away_address' ).value = data.HashList[0];
            }
        }, mHandlers: true //, EOFHandler:
        , check: false
    } );
};

MSG.request.organization = function ( city, fn ) {
    city = city || document.getElementById( 'city_client' ).value;
    var s = { "Table": "GetPoint", "Values": [city] };
    MSG.send( {
        structure: s, handler: function ( data ) {
            Organizations.push( data );
            $( '#take_away_address, #take_away_address2' ).append( '<option value="' + data.Hash + '">' + data.Street + ', ' + data.House + '</option>' );
        }, mHandlers: true, EOFHandler: (fn || false), check: false
    } );
};


MSG.request.orderStatus = function ( ID, ID_item ) {
    var s = {
        "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructIDOrdIDit"
        , "Values": [ID, ID_item || 0], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: MSG.get.Status } );
};


////////--------| РАботы с историей заказов |----------------------------------------------------------
MSG.request.h_orderByTelephone = function ( phone, start, end ) {
    var s = {
        Table: "Order", Query: "Read", TypeParameter: "RangeByPhoneCustomer"
        , Values: [phone, start, end]
        , Limit: 1000, Offset: 0, ID_msg: "ordphone"
    };
    MSG.send( {
        structure: s, handler: MSG.get.h_orderFromHistory
        , mHandlers: true, EOFHandler: ''
        , check: '', errorHandler: ''
    } );
};

MSG.get.h_orderFromHistory = function ( data ) {
    var orderStr = "", tempStr = '', ID = data.ID;

    // MSG.request.orderList( ID, MSG.get.h_orderList );
    MSG.request.orderPersonal( ID, HASH_DELIVERYMAN, MSG.get.h_orderPersonal_Deliveryman );
    if ( data.SideOrder === 2 ) MSG.request.orderPersonal( ID, HASH_CASHIER, MSG.get.orderPersonal_side );
    else if ( data.SideOrder === 1 ) MSG.request.orderPersonal( ID, HASH_OPERATOR, MSG.get.orderPersonal_side );
    MSG.request.firstOrderStatus( ID, MSG.get.h_firstOrderStatus );//смотрим первый статус
    MSG.request.lastOrderStatus( ID, 0, MSG.get.h_lastOrderStatus );//смотрим последний
    MSG.request.customer( ID, MSG.get.h_customer );

    for ( var i = 0; i < Organizations.length; i++ )  if ( data.OrgHash == Organizations[i].Hash )   break;
    orderStr += '<tr data-toggle="collapse" class="table-operator__row" id="tr' + data.ID + '_his" href="#ttr' + data.ID + '_his" aria-expanded="false">' +
        '<td id="tr' + data.ID + '_city_his"></td> <td class="order_number_his">' + data.ID + '</td>' +
        '<td><div  id="tr' + data.ID + '_first_stat_his"></div> <div  id="tr' + data.ID + '_first_stat_minus_his"></div></td>' +
        '<td>' + data.Type + '</td>  <td>' +
        '<div id="tr' + data.ID + '_last_stat_name_his"></div><div id="tr' + data.ID + '_last_stat_time_his"></div>' +
        //((i<Organizations.length)?
        //(
        '</td>  <td>' + Organizations[i].Street + ', ' + Organizations[i].House + '</td>' +
//):('</td>  <td>Неверная организация</td>'))+
        '<td><div id="tr' + data.ID + '_cust_name_his"></div>   <div id="tr' + data.ID + '_cust_phone_his"></div></td>' +
        '<td id="tr' + data.ID + '_cust_address_his">' +
        '</td> <td><div  class="_manager" id="tr' + data.ID + '_manager_his"></div>' +
        '<div>' + textVal( SIDE_ORDER_LIST[data.SideOrder] ) + '</div></td>   <td  id="tr' + data.ID + '_courier_his"></td></tr>';

    tempStr += '<tr class="collapse table-operator__spoiler-content" id="ttr' + data.ID + '_his" aria-expanded="false">' +
        '<td colspan="4">   <p class="text-upper">Состав заказа:</p>' +
        ' <ul>';

    if ( data.DiscountPercent != 0 ) tempStr +=
        '<li id="ttr' + data.ID + '_discount_his">     <div class="pull-right">' + Math.round( data.Price * data.DiscountPercent / 100 ) +
        '</div>Скидка: ' + data.DiscountName + ' ' + data.DiscountPercent + '% </li>';
    tempStr += '<li id="ttr' + data.ID + '_itogo_his"> <div class="pull-right font_blue">' + data.PriceWithDiscount + '</div>  К оплате  </li></ul></td>' +
        '<td colspan="3" class="text-center">' +
        '<p>Количество персон: <span class="font_blue">' + data.CountPerson + '</span></p>' +
        '<p>Форма оплаты: <span class="font_blue" id="ttr' + data.ID + '_payment_his">' + TYPE_PAYMENTS[data.TypePayments] + '</span></p>' +
        '<p class="text-upper">Комментарий клиента</p>' +
        '<div class="font_blue" id="ttr' + data.ID + '_cust_note_his"></div></td>' +
        '<td colspan="2"><p class="text-upper">Уведомления системы</p>' +
        '<div class="font_blue">' + ((data.TimeDelivery != "0001-01-01T00:00:00Z") ? ("Предзаказ на время - " + data.TimeDelivery + "<br>") : "") +

        ((data.Division != " ") ? ("Обед сотрудника - " + data.Division + "<br>") : "") + data.Note + '</div></td>' +
        '<td>' +  ////действия над заказом удалить....
        '</td></tr>';
    $( document ).ready( function () {
        if ( $( '#tr' + data.ID + '_his' ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым
            $( '#orderListHistory' ).prepend( tempStr ).prepend( orderStr );
        }
        else {
            $( '#tr' + data.ID + '_his' ).replaceWith( orderStr );
            $( '#ttr' + data.ID + '_his' ).replaceWith( tempStr );
        }
    } );
};

MSG.get.h_firstOrderStatus = function ( data ) {
    $( "#tr" + data.Order_id + '_his' ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_first_stat_his" ).innerHTML = (STATUS[data.Status_id].Name || " ");
        document.getElementById( "tr" + data.Order_id + "_first_stat_minus_his" ).innerHTML = getTimeHM( data.Time ) || " ";
    } );
};
MSG.get.h_lastOrderStatus = function ( data ) {
    $( "#tr" + data.Order_id + '_his' ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_last_stat_name_his" ).innerHTML = (STATUS[data.Status_id].Name || " ");
        document.getElementById( "tr" + data.Order_id + "_last_stat_time_his" ).innerHTML = getTimeHM( data.Time ) || " ";
    } );
};
MSG.get.h_orderPersonal_Deliveryman = function ( data ) {
    $( "#tr" + data.Order_id + '_his' ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_courier_his" ).innerHTML = (data.SurName || " ") + " " + (data.FirstName || " ");
    } );
};
MSG.get.h_orderPersonal_side = function ( data ) {
    $( "#tr" + data.Order_id + '_his' ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_manager_his" ).innerHTML = (data.SurName || " ") + " " + (data.FirstName || " ");
    } );
};

MSG.get.h_orderList = function ( data ) {
    $( "#trr" + data.Order_id + '_his' ).ready( function () {
        var count_id = 'ttr' + data.Order_id + '_list_' + data.Price_id + '_' + data.DiscountPercent;
        var count = $( "#" + count_id + "_count_his" ).text();
        if ( data.ID_parent_item == 0 ) {
            if ( $( '#' + count_id ).length > 0 ) {
                document.getElementById( "" + count_id + "_count_his" ).innerHTML = +count + 1;
            } else {
                var tempStr =
                    '<li id="' + count_id + '">   <div class="pull-right">' +
                    (( data.DiscountPercent === 100) ? 0 : data.Price) + '</div> ' +
                    data.PriceName + ' x<span  id="' + count_id + '_count"> 1 </span></li>';
                if ( $( "#ttr" + data.Order_id + "_discount_his" ).length > 0 ) $( "#ttr" + data.Order_id + "_discount_his" ).before( tempStr );
                else $( "#ttr" + data.Order_id + "_itogo_his" ).before( tempStr );
            }
        }
    } );
};

MSG.get.h_customer = function ( data ) {
    $( "#tr" + data.Order_id + '_his' ).ready( function () {
        document.getElementById( "tr" + data.Order_id + "_city_his" ).innerHTML = (data.City || " ");
        document.getElementById( "tr" + data.Order_id + "_cust_name_his" ).innerHTML = (data.NameCustomer || " " );
        document.getElementById( "tr" + data.Order_id + "_cust_phone_his" ).innerHTML = (data.Phone || " " );
        document.getElementById( "tr" + data.Order_id + "_cust_address_his" ).innerHTML =
            (data.Street || " ")
            + ((data.House && data.House != 0) ? (' д.' + data.House) : " " )
            + ((data.Building && data.Building != " ") ? (' стр.' + data.Building) : " " )
            + ((data.Apartment && data.Apartment != 0) ? (' кв.' + data.Apartment) : " " )
            + ((data.Entrance && data.Entrance != 0) ? (' под.' + data.Entrance) : " " )
            + ((data.Floor && data.Floor != 0) ? (' эт.' + data.Floor) : " ")
            + ((data.DoorphoneCode && data.DoorphoneCode != 0) ? (' код' + data.DoorphoneCode) : " ");
    } );

    $( "#ttr" + data.Order_id + '_his' ).ready( function () {
        document.getElementById( "ttr" + data.Order_id + "_cust_note_his" ).innerHTML = (data.Note || " ");
    } );
};
//--------------\ РАботы с историей заказов |----------------------------------------------------------
