///доделать: не отправляется Create OrderPersonal

var trackers = {
    1: "Сушимейкер",
    2: "Раскатка",
    3: "Начинение",
    4: "Упаковка"
};
var tracker = $.cookie( 'tracker' ) || 1;
$( '.dropdown-toggle.user_role' ).prop( 'selectedIndex', tracker - 1 );

var timeout_get_data = 500; //время ожидания завершения передачи данных (ждём кгда придут ордеры, статусы, таймеры)
var SYSTIME = "00:00:00";
var SESSION_INFO = {};
var OrderL = {}, activeOrder = {};

var user_stat = {
    WorkHours: 0,             //Часы с нач.мес.: 148
    MakeToday: 0,               //Сегодня изделий: 63
    MakeMounth: 0,           //Изделия с нач.мес.: 2101
    TimeGetMedium: "0",       //Среднее время принятие заказа: 1:15
    Rating: 0,                  //Рейтинг: 95
    BalansMinus: 0,          //Списания: 3 552
    Balans: 0               //Баланс: 15 451
};

var Status = {
    1: { "ID": 1, "Name": "Предзаказ" },
    2: { "ID": 2, "Name": "Принят" },
    3: { "ID": 3, "Name": "Передан" },
    4: { "ID": 4, "Name": "В работе" },
    5: { "ID": 5, "Name": "Раскатка" },
    6: { "ID": 6, "Name": "Начинение" },
    7: { "ID": 7, "Name": "Запекание" },
    8: { "ID": 8, "Name": "Приготовлен" },
    9: { "ID": 9, "Name": "Собран" }, //8 -9
    10: { "ID": 10, "Name": "Доставлятся" },//6 -9
    11: { "ID": 11, "Name": "Доставлен" },//7 -10
    12: { "ID": 12, "Name": "На месте в ожидании" },//8 -11
    13: { "ID": 13, "Name": "Заказ не забрали" },//9 -12
    14: { "ID": 14, "Name": "На переделке" },//10 -13
    15: { "ID": 15, "Name": "Отменен со списанием" },//11 -14
    16: { "ID": 16, "Name": "Отменен без списания" }//12 -15
};//2 3 4 5 6 7 8 9 10 12 13 14 - активные
//11 15 16 - завершенные



var OrderStatusArray = [];
var timer_int;




webSocket();




//Orders
MSG.update = function (data) {
    console.group('MSG.update');
    var ID = data.Values[0];
    //if (data.ID_msg !== Cashier.OrganizationHash && data.ID_msg !== '') { // фильтр по организации
       // console.groupEnd();
       // return;
    //}
    console.log('data.Table', data.Table);

    switch (data.Table) {
        case "Order":
            MSG.request.positionForTracer();
            break;
        case "OrderCustomer":
            break;
        case "OrderList":
            break;
        case "Cashbox":
            break;
        case "OrderPersonal":
            break;
        case "OrderStatus":
            MSG.request.positionForTracer();
            break;
    }
    console.groupEnd();
};
/// заполнение полей повара
function setupSessionInfo(data) {
    // $(document).ready(function () {
    SESSION_INFO = data;
    // if (role_test_debug) SESSION_INFO.RoleHash = test_role_hash;    //debug

    //что то тут не так
   // ws.send('{"Table":"Tabel","Values":["' + SESSION_INFO.UserHash + '"],"ID_msg":"SessionTabel"}');


    $("#name_role").html(SESSION_INFO.RoleName);
    $("#name_role1").html(SESSION_INFO.RoleName);
    $("#fio").html(SESSION_INFO.SurName + ' ' + SESSION_INFO.FirstName);
    $("#fio1").html(SESSION_INFO.SurName + ' ' + SESSION_INFO.FirstName);
    $("#horse_m").html(user_stat.WorkHours);
    $("#prod_count").html(user_stat.MakeToday);//MakeToday: 6,               //Сегодня изделий: 63
    $("#prod_m").html(user_stat.MakeMounth);//    MakeMounth: 1999,           //Изделия с нач.мес.: 2101
    //$("#time_acceptance_order").html(user_stat.TimeGetMedium);
    $("#rating").html(user_stat.Rating);
    $("#award").html(user_stat.BalansMinus);
    $("#balance").html(user_stat.Balans);

    if (SESSION_INFO.RoleHash == sushist) {
        if ($.cookie('tracker') != 1) {
            $.cookie('tracker', 1);
            tracker = 1;
        }
        $(".dropdown-toggle.user_role").hide();
    }
    if (SESSION_INFO.RoleHash == pizza) {
        if ($.cookie('tracker') == 1) {
            $.cookie('tracker', 2);
            tracker = 2;
        }
    }

    MSG.request.positionForTracer();
}
// запрос списка елементов для готовки
MSG.request.positionForTracer = function () {  //получить элементы заказа 6 штук
    OrderStatusArray = []; //отчистка спискадля временного хранения заказов, нужно для того, чтобы не запрашивать статус заказа много раз
    $(document).ready(function () {
        $(".order_table").empty();
    });

    if (tracker == 2) {
        MSG.request.positionForTracerWithStatus(5);
        return
    }
    if (tracker == 3) {
        MSG.request.positionForTracerWithStatus(6);
        return
    }
    if (tracker == 4) {
        MSG.request.positionForTracerWithStatus(7);
        return
    }
    var hashorg = SESSION_INFO.OrganizationHash,
        time = getTimeOnNow(), //TODO --------что это такое
        userhash = SESSION_INFO.UserHash,
        limit = 6;
    clearOrderL();
    MSG.send({
        structure: {
            "Table": "OrderList", "Query": "Read", "TypeParameter": "RangeForCook",
            "Values": [hashorg, time, tracker, userhash], "Limit": limit, "Offset": 0
        }, handler:MSG.get.elementOrder, mHandlers: true
    });
    if(ws.readyState == 1)
        setTimeout(startTimer, timeout_get_data);

};
//----Читать Все элементы заказа для пицце мейкера где статус
MSG.request.positionForTracerWithStatus = function (stat) {

    var hashorg = SESSION_INFO.OrganizationHash,
        time = getTimeOnNow(), //TODO --------что это такое
        userhash = SESSION_INFO.UserHash,
        limit = 6;
    clearOrderL();
    MSG.send({
        structure: {
            "Table": "OrderList", "Query": "Read", "TypeParameter": "RangeWithStatus",
            "Values": [hashorg, time, tracker, stat, userhash], "Limit": limit, "Offset": 0
        }, handler: MSG.get.elementOrder, mHandlers: true
    });
    if(ws.readyState == 1)
        setTimeout(startTimer, timeout_get_data);
    //{ structure: '', handler: '', mHandlers: '', EOFHandler: '', check: '' };
};
function addOrderL( data ) {      //добавить элементы заказа в массив
    OrderL.count++;
    OrderL[OrderL.count] = data;

    return [data.Order_id, data.ID_item];
}
function clearOrderL() {
    OrderL = {};
    OrderL.count = 0;
}

MSG.get.elementOrder = function (data) {
    var idd = addOrderL(data);
    var newOrder = true;
    for(var i =0; i< OrderStatusArray.length; i++)
        if(OrderStatusArray[i] == idd[0]) {
            newOrder = false;
            break;
        }

    if(newOrder)//если мы не запрашивали статус для этого ордера, то запросим
    {
        MSG.request.FirstStatus(idd[0]);  //смотрим первый статус
        OrderStatusArray.push(idd[0]); //помещаем во временный массив
    }

    MSG.request.Timer(idd);
};
MSG.request.OrderActive = function ( id, idi ) {
//----Считать один элемент заказа
    MSG.send(
        {structure:
            {"Table":"OrderList","Query":"Read","TypeParameter":"Value","Values":[id,idi],"Limit":0,"Offset":0}, handler: MSG.get.addOrderActive } );
};
MSG.get.addOrderActive =  function( data ) {
    activeOrder.Order_id = data.Order_id;
    activeOrder.ID_item = data.ID_item;
    activeOrder.ID_parent_item = data.ID_parent_item;
    activeOrder.Price_id = data.Price_id;
    activeOrder.PriceName = data.PriceName;
    activeOrder.TypeName = data.TypeName;
    activeOrder.Parent_id = data.Parent_id;
    activeOrder.ParentName = data.ParentName;
    activeOrder.Image = data.Image;
    activeOrder.Units = data.Units;
    activeOrder.Value = data.Value;
    activeOrder.Set = data.Set;
    activeOrder.Finished = data.Finished;
    activeOrder.DiscountName = data.DiscountName;
    activeOrder.DiscountPercent = data.DiscountPercent;
    activeOrder.Price = data.Price;
    activeOrder.TimeCook = data.TimeCook;
    activeOrder.TimeFry = data.TimeFry;
    activeOrder.CookingTracker = data.CookingTracker;
    //
    // $("#in_work").attr("data-timer-stat");
    $( "#imgOrder" ).attr( 'src', data.Image );

    //пицц а норм работает, суши не норм
     var ID = [data.Order_id, data.ID_item];
     MSG.request.OrderStatusActive(ID, 4); //если пицца в работе

    //надо что то порешать с таймером in_work, который постоянно ставится 01:10 при открытии заказа
     if(tracker == 1 || tracker == 2)//если это сушимейкер или пицца только что пришла в раскатку, то время inwork устанавливается из TimeCook
         if ( $( "#in_work" ).attr( "data-timer-stat" ) != "0001-01-01T00:00:00Z" )
             $( "#in_work" ).html( timeMinus( time_second2( activeOrder.TimeCook ),  timeMinus( getTimeNow1( 0 ), $( "#in_work" ).attr( "data-timer-stat" ), 0 ), 0 ) );
         else $("#in_work").html (time_second2 (activeOrder.TimeCook));
     else{
         var ID = [data.Order_id, data.ID_item];
         MSG.request.OrderStatusActive(ID, 4); //если пицца в работе
     }
    //иначе пицца уже раскатана и поэтому надо запрашивать время, когда закончили раскатку


};
function redoneActive( n1, n3 ) {
    //if (n==1)     //без списание
    //if (n2==1)    // в трекер
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;
    MSG.set.Status( id, idi, 14, n3 );//переделка

    if ( tracker < 3 ) {
        if ( n1 == 0 ) {
            MSG.set.Status( id, idi, 3 );
            MSG.set.Status( id, idi, 4 );
            $( "#in_work" ).html( time_second2( activeOrder.TimeCook ) );
        }
        else {
            MSG.set.Status( id, idi, 3 );
            $( '.button_cancel' ).click();
        }   //в трекер
    }
    else {
        MSG.set.Status( id, idi, 3 );
        $( '.button_cancel' ).click();
    }   //в трекер


}






//Status
MSG.request.FirstStatus =  function (ID) {
    MSG.send( {structure: {"Table":"OrderStatus","Query":"Read","TypeParameter":"Value","Values":[ID,1],"Limit":0,"Offset":0}, handler:MSG.get.FirstStatus, } );
};
MSG.get.FirstStatus = function ( data ) {
    if ( data.Order_id == 0 ) return;
    for ( var i = 1; i <= OrderL.count; i++ )
        if ( data.Order_id == OrderL[i].Order_id ) {
            OrderL[i].Cause_First = data.Cause;
            OrderL[i].Status_id_First = data.Status_id;
            OrderL[i].UserHashStatus_First = data.UserHash;
            OrderL[i].TimeStatus_First = data.Time;
            addOrderToTable( OrderL[i] );
        }

};
MSG.request.OrderStatusActive = function ( id, status_id ) {
    MSG.send({
        structure: {
            "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructIDOrdIDitIDStat",
            "Values": [ id[0], id[1],+status_id], "Limit": 0, "Offset": 0
        }, handler:MSG.get.ActiveStatus
    });
};
MSG.get.ActiveStatus = function( data ) {
    //рассчет оставшегося времени на приготовление

    //Обработчик статусов элементов заказа
    activeOrder.Cause_Last = data.Cause;
    activeOrder.Status_id_Last = data.Status_id;
    activeOrder.UserHashStatus_Last = data.UserHash;
    activeOrder.TimeStatus_Last = data.Time;

    var y = getHMS( activeOrder.TimeStatus_Last );// время когда взяли в работу
    var x = timeMinus( getTimeNow1( 0 ), SYSTIME,0 ); // текущее время с поправкой
    var c = time_second2(activeOrder.TimeCook); // время готовки
    var time_in_work = timeMinus( c, timeMinus( x, y, 0 ), 0 ); // сколько осталось до конца


    //if ( $("#in_work").attr( "data-timer-stat" ) != "0001-01-01T00:00:00Z" )
    $("#in_work").html( time_in_work );
    //else $("#in_work").html (timeMinus( getHMS (activeOrder.TimeStatus_Last ), SYSTIME,0));

};
MSG.request.OrderStatusLast = function ( id ) {
    MSG.send({
        structure: {
            "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructIDOrdIDit",
            "Values": [ id[0], id[1]], "Limit": 0, "Offset": 0
        }, handler: function(data){MSG.get.StatusLast(data,[ id[0], id[1]],false)} , errorHandler: function(data){MSG.get.StatusLast(data,[ id[0], id[1]],true)} //вот тут надо подумать
    });
};
MSG.get.StatusLast = function( data, ID , norows) {
    //Получить последний статус элемента заказа
    //если он отсутствует(no rows) или не 4 статус и не выше, то делам тоже самое :

    if(!norows) { //если строки есть
        if (data.Status_id < 4) {//если статус не выше, чем "в работе", то
            {
                MSG.set.Status(ID[0], ID[1], 4);// в работе
                //if ($(".font_main_time").attr("data-timer-stat") == "0001-01-01T00:00:00Z")// то что поля в нулях не значит, что нет таймера
                // MSG.set.createTimer(ID[0], ID[1]);
                console.log("статус для заказа" + ID[0] + "" + ID[1] + "Установлен: " + 4);
            }
        }
        else
        {
            console.log("статус для заказа" + ID[0] + "" + ID[1] + " больше чем 4");
            return
        }
    }
    else
    {
        MSG.set.Status(ID[0], ID[1], 4);// в работе
        //if ($(".font_main_time").attr("data-timer-stat") == "0001-01-01T00:00:00Z")
           // MSG.set.createTimer(ID[0], ID[1]);
        console.log("Нет строК! статус для заказа" + ID[0] + "" + ID[1] + "Установлен" + 4);
    }

};







//Timers
MSG.request.Timer = function ( id ) {
    MSG.send( {structure: {"Table":"TimersCook","Query":"Read","TypeParameter":"Value","Values":[ id[0] , id[1] ],"Limit":0,"Offset":0}, handler:MSG.get.Timer } );
};
MSG.get.Timer = function ( data ) {
    for ( var i = 1; i <= OrderL.count; i++ )
        if ( data.Order_id == OrderL[i].Order_id && data.Order_id_item == OrderL[i].ID_item ) {
            OrderL[i].Time_begin = data.Time_begin;
            OrderL[i].Time_end = data.Time_end;
            OrderL[i].Time_Finished = data.Finished;
        }
    var id_div_atimer = '#a_timer' + data.Order_id + '-' + data.Order_id_item;
    alert(data.Time_begin );
    $( id_div_atimer).ready( function () {
        $( id_div_atimer ).attr( "data-timer-stat", data.Time_begin );
        alert(data.Time_begin );
        // setTimeout(function () {
        //     // timer( $(id_div_atimer+".font_main_time")[0]);
        //
        // }, 100)
    } );

};
MSG.set.finishTimer = function( id ) {
    var time_end = getTimeOnNow();
    MSG.send( {structure: {"Table":"TimersCook","Query":"Update","TypeParameter":"","Values":[ +id[0] , +id[1] ,time_end],"Limit":0,"Offset":0} } );
}
MSG.set.createTimer = function ( id ) {
    MSG.send( {structure: {"Table":"TimersCook","Query":"Create","TypeParameter":"Value","Values":[ id[0] , id[1] ],"Limit":0,"Offset":0} } );
};
//вычисление поправки времени относительно сервера 00:00:00
MSG.get.setsystime = function( time ) {
    //для чего эта поправка?
    SYSTIME = timeMinus( getTimeNow1( 0 ), time, 0 );
    warning("Поправка вермени: " + SYSTIME, 'i', 5000 );
};







//Visual
var redone = '', apply = 1, timerr = '';
function addOrderToTable( arrOrder ) {
    var strOrderHTML = '', late = '';
    timerr = '';
    var linkOrder = '';//(late!=''||redone!='')?'href="/order/' + arrOrder.Order_id + '/'+arrOrder.ID_item + '"':'';
    var pricename = "", sizename = "";
    if ( tracker == 2 ) {
        var testo, teston, size, sizen, sizeprice = "";
        teston = arrOrder.PriceName.indexOf( '(' );
        sizen = arrOrder.PriceName.indexOf( ',' );
        pricename += arrOrder.PriceName.slice( 0, sizen );
        if ( sizen > 0 ) sizename += arrOrder.PriceName.slice( sizen + 1, sizen + 3 );
        if ( teston > 0 ) sizename += arrOrder.PriceName.slice( teston, teston + 3 );
    }
    else pricename = textVal( arrOrder.PriceName );
    sizeprice = (tracker == 2) ? ('<p class="font_main_name_small">' + textVal( pricename ) + '</p><p class="font_main_name_big">' + textVal( sizename ) + '</p>') :
        ('<p class="font_main_name">' + textVal( pricename )  + '</p>');

    var strOrderHTML = "";
    strOrderHTML += '' +
        '<a ' + linkOrder + ' class="col-xs-12 col-sm-4 styleDiv ' + late + ' ' + redone + '" name="' + arrOrder.CookingTracker + '" ' +
        'id="a' + arrOrder.Order_id + '-' + arrOrder.ID_item + '">' +
        <!-- Сюда передаем время когда получили заказ -->
        '<input id="a_time_status' + arrOrder.Order_id + '-' + arrOrder.ID_item + '" class="startTimeOrder" hidden value="' + timeVal( arrOrder.TimeStatus_First ) + '">' +
        '<p class="font_main_check">#' + arrOrder.Order_id + '-' + arrOrder.ID_item + '' + ((arrOrder.ID_parent_item) ? '(Сет ' + arrOrder.ID_parent_item + ')' : '') + '</p>' +
        sizeprice +//'<p class="font_main_name">' + textVal(arrOrder.PriceName) +  '</p>'+
        '<p id="a_timer' + arrOrder.Order_id + '-' + arrOrder.ID_item + '" class="font_main_time" data-timer-stat="' + timeVal(arrOrder.Time_begin)  + '" data-role="timer">' + '00:00:00' +//timeMinus(getTime1(),sliceTime(timeVal(arrOrder.TimeStatus_First)),1) +
        '</p>' +
        '<!-- Сюда передаем норму времени -->' +
        '<input hidden value="00:30:00">' +
        '<input class="priceid" hidden value="' + arrOrder.Price_id + '">' +
        '</a>';

    $( document ).ready( function () {
        if ( $( '#a' + arrOrder.Order_id + '-' + arrOrder.ID_item ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым
            $( '.order_table' ).append( strOrderHTML );

        }
        else {
            $( '#a' + arrOrder.Order_id + '-' + arrOrder.ID_item ).replaceWith( strOrderHTML );
        }

    } );
}
function textVal( text ) {
    if ( text == "Undefined" || text == "undefined" || !text ) return " ";
    return text;
};
function timeVal( text ) {
    if ( text == "Undefined" || text == "undefined" || !text ) return "0001-01-01T00:00:00Z";
    return text;
};
//копирование информации заказа в активный заказ при клике
$( '.order_table' ).on( 'click', '.col-sm-4.styleDiv', function () {
    //if ($( this ).find( ".font_main_time").attr("data-timer-stat") == "0001-01-01T00:00:00Z")
      //  return;
    $( ".order_table" ).hide();

    var number = ($( this ).find( ".font_main_check" ).html()),
        text = ($( this ).find( ".font_main_name" ).html());
    if ( !text ) text = ($( this ).find( ".font_main_name_small" ).html()) + ' ' + ($( this ).find( ".font_main_name_big" ).html());
    var time = ($( this ).find( ".font_main_time" ).html()),
        starttime = $( this ).find( ".startTimeOrder" ).attr( 'value' ),
        id = number.slice( 1, number.indexOf( '-' ) ),
        idi = number.slice( number.indexOf( '-' ) + 1 );
    if ( idi.indexOf( '(' ) > 0 ) idi = idi.slice( 0, idi.indexOf( '(' ) );
        $( "#in_work" ).attr( "data-timer-stat", $( this ).find( ".font_main_time" ).attr( "data-timer-stat" ) );


    //MSG.request.OrderActive( id, idi );//тут пиццца работает

    //OrderL[0].Price_id
    // TODO загрузить по activeOrder подробную информацию о продукте и рецепт, таймер запустить

    $( "#check" ).html( number );
    $( "#name" ).html( text );
    $( "#time" ).html( time );


    //var cooktr = $( this ).attr( "name" );
    $( "#check" ).parent().find( ".startTimeOrder" ).attr( 'value', starttime );
    var priceid = $( this ).find( ".priceid" ).attr( 'value' );//activeOrder.Price_id;

    MSG.set.personal( id, idi );
    MSG.request.OrderActive( id, idi );
    if ( 1 == tracker || 2 == tracker ) {// для суши, роллов
        MSG.request.OrderStatusLast([id,idi]); //запрос последнего статуса
    }
    else //иначе для пиццы
    {

    }
    clearInterval(timer_int);
    timer_int = setInterval( function () {
        downTimer();
    }, 1000 );
    // else {  }
    $( ".order_item" ).show();
} );
//изменение трекера в зависимости от селекта
$( ".dropdown-toggle.user_role" ).change( function () {
    tracker = $( ".dropdown-toggle.user_role option:selected" ).index() + 1;
    $.cookie( 'tracker', tracker );
    MSG.request.positionForTracer();
} );
$( '.button_ok' ).click( function () {

    //if (1){warning("Невозможно так быстро приготовить продукт",'a', 5000);return;} time_second2 (activeOrder.TimeCook)
    if ( timeMinus( time_second2( activeOrder.TimeCook ), $( "#in_work" ).text() ) < minimal_cook_time ) { // minimal_cook_time
        warning( "Невозможно так быстро приготовить продукт", 'a', 5000 );
        console.log( timeMinus( time_second2( activeOrder.TimeCook ), $( "#in_work" ).text() ) );
        return;
    }
    $( ".order_table" ).show();
    $( ".order_item" ).hide();
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;

    if ( tracker == 1 ) {
        MSG.set.finished( id, idi );
        MSG.set.Status( id, idi, 8);
        MSG.set.finishTimer([id,idi]);//закрываем таймер
    }
    if ( tracker == 2 ) MSG.set.Status( id, idi, 6 );    //если была "Раскатка", то устанавливаем статус 6 - Начинение
    if ( tracker == 3 ) MSG.set.Status( id, idi, 7 );    //если была  "Начинение" то ставим  7 - запекание
    if ( tracker == 4 ) {
        MSG.set.finished( id, idi );
        MSG.set.Status( id, idi, 8);
        MSG.set.finishTimer([id,idi]);//закрываем таймер
    }  //если была  "Запекание", то заканчиваем заказ
    activeOrder = {};
    clearInterval( timer_int );

} );
$( ".order_item" ).hide();
$( ".button_cancel" ).hide();
$( '.button_cancel' ).click( function () {
    $( ".order_table" ).show();
    $( ".order_item" ).hide();
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;
    // if ( tracker == activeOrder.CookingTracker )
    //     MSG.set.Status( id, idi, 3 );
    activeOrder = {};
    // MSG.request.positionForTracer();
} );



