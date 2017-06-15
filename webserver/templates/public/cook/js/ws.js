///доделать: не отправляется Create OrderPersonal

document.title = "Повар || Версия 0.14.12";
var old_zakaz_id = 0;
var old_zakaz_idi = 0;

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
var opened_item_form = false; //открыто окно готовки элемента заказа

//для групп пользователей
var idGroup = 0;// идентификатор текущей группы (которая активна на планшете)
var Users = []; //пользователи в группе, их мы получаем в function updateList(data)
var count_users = 0;
var timer_update_flag = false;





//подключаемся к сокетам
webSocket();



//Orders
MSG.update = function (data) {
   // console.group('MSG.update');
    var ID = data.Values[0];
   // console.log('data.Table', data.Table);
    //пришла обнова, надо проверить относится ли она к нам


    //если у нас полный трекер заказов, то игнорим все обновы, которые не касаются имеющихся в трекере
    var new_Order_id = data.Values[0];// id заказа

    switch (data.Table) {
        case "Order": //пришел новый заказ
            warning("Если вы закрыли заказ и он снова отобразился в трекере - ОБНОВИТЕ СТРАНИЦУ! Не берите его повторно в работу!" , 'i', 10000 );
            break;
        case "OrderCustomer":
            break;
        case "OrderList":
           // warning("Создан элемент заказа");
            if (OrderL.count >= 6)//если трекер полный
            {
                //игнорим, поскольку нам не нужны новые заказы
            }

            else if (OrderL.count < 6) //если трекер не полный или даже пустой, то
            {
                if (timer_update_flag != true) {
                    timer_update_flag = true;
                    setTimeout(function () {
                        timer_update_flag = false;
                        MSG.request.positionForTracer();
                    }, 1000);
                   // warning("Запрашиваю список продуктов для готовки");
                    break;
                }
            }
            break;
        case "Cashbox":
            break;
        case "OrderPersonal":
            break;
        case "OrderStatus":
            var new_element_id = data.Values[1];// id элемента
            var status = data.Values[2];
            console.log("Пришел апдейт: ",data.Values[0],data.Values[1],"Status:",data.Values[2]);
            for(var i in OrderL) {// просматриваем все элементы в трекере

                if (new_Order_id == OrderL[i].Order_id && new_element_id == OrderL[i].ID_item) {// обновление относится к нашему элементу заказа!
                    if (status == 15 || status == 16 || status == 4 || status == 8) //статусы, при которых не должно отображаться в трекере элемент
                    {//если заказ отменен,
                        //MSG.request.positionForTracer();то вызов обновления списка немедленно
                        //Варинт2: удалить руками элемент
                        del_elem_from_table(OrderL[i].Order_id , OrderL[i].ID_item);
                        for(var i in OrderL)
                            if(OrderL[i].Order_id == new_Order_id && OrderL[i].ID_item == new_element_id)
                            {
                                delete OrderL[i];
                                OrderL.count--;
                                break;
                            }
                        if (timer_update_flag != true) {
                            timer_update_flag = true;
                            setTimeout(function () {
                                timer_update_flag = false;
                                MSG.request.positionForTracer();
                                console.log("Запрашиваю список элементов...");
                            }, 1000);
                            break;
                        }
                        break;
                    }
                    else if (tracker > 1)//для пиццы
                    {
                        if (tracker == 2 && status == 4) {
                            del_elem_from_table(new_Order_id , new_element_id);
                            for(var i in OrderL)
                                if(OrderL[i].Order_id == new_Order_id && OrderL[i].ID_item == new_element_id)
                                {
                                    delete OrderL[i];
                                    OrderL.count--;
                                    break;
                                }
                        }
                        if (tracker == 3 && status == 7) {
                            del_elem_from_table(new_Order_id , new_element_id);
                            for(var i in OrderL)
                                if(OrderL[i].Order_id == new_Order_id && OrderL[i].ID_item == new_element_id)
                                {
                                    delete OrderL[i];
                                    OrderL.count--;
                                    break;
                                }
                        }
                        else if (tracker == 2 && status == 6) {
                            del_elem_from_table(new_Order_id , new_element_id);
                            for(var i in OrderL)
                                if(OrderL[i].Order_id == new_Order_id && OrderL[i].ID_item == new_element_id)
                                {
                                    delete OrderL[i];
                                    OrderL.count--;
                                    break;
                                }
                        }
                        else if (tracker == 4 && status == 8) {
                            del_elem_from_table(new_Order_id , new_element_id);
                            for(var i in OrderL)
                                if(OrderL[i].Order_id == new_Order_id && OrderL[i].ID_item == new_element_id)
                                {
                                    delete OrderL[i];
                                    OrderL.count--;
                                    break;
                                }
                        }
                    }
                }
            }

                    if (status == 7 || status == 6 || status == 5 || status == 2 || status == 1) // нужно для добавления
                    {
                        console.log("Какой то элемент поменял статус на " + status + ", запрашиваю список элементов...");
                        if (timer_update_flag != true) {
                            timer_update_flag = true;
                            setTimeout(function () {
                                timer_update_flag = false;
                                MSG.request.positionForTracer();
                                console.log("Запрашиваю список элементов...");
                            }, 1000);
                            break;
                        }
                    }

            break; // case "OrderStatus":
        }

    //console.groupEnd();
};
/// заполнение полей повара
function setupSessionInfo(data) {
    SESSION_INFO = data;

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
    idGroup = SESSION_INFO.SessionData;



    if (SESSION_INFO.RoleHash == sushist) {
        if ($.cookie('tracker') != 1) {
            $.cookie('tracker', 1);
            tracker = 1;

            //ttt
        }
        $(".conn_btn").hide();
        $(".idgroup").hide();
        $(".dropdown-toggle.user_role").hide();
    }
    if (SESSION_INFO.RoleHash == pizza) {
        if ($.cookie('tracker') < 2 || !$.cookie('tracker') ) {
            $.cookie('tracker', 2);
            tracker = 2;
        }
        $(".conn_btn").show();
        $(".idgroup").show();

        if(idGroup != "" || !isNaN(+idGroup))
        {
            MSG.request.GroupUser();
            //setInterval(MSG.request.GroupUser,30000); //запрос списка юзеров в группе
            $(".conn_btn").attr("disabled",false);
            MSG.request.GroupUser();
        }

    }
    $( '.dropdown-toggle.user_role' ).prop( 'selectedIndex', tracker - 1 );

    setInterval(SyncOrderL,10000);
    //запрашиваем заказы:
    MSG.request.positionForTracer();


    //при обновлении страницы открыть ранее открытое окно элемента заказа
    var disp_item_id_idi = $.cookie('display_item');
    if( disp_item_id_idi ){//открытий элемент. нужен дял того, чтобы в случае обновления страницы окно заново открывалось
        var id = disp_item_id_idi.split(',')[0];
        var idi = disp_item_id_idi.split(',')[1];
        var number = disp_item_id_idi.split(',')[2];
        var text = disp_item_id_idi.split(',')[3];
        var time = disp_item_id_idi.split(',')[4];
        var starttime = disp_item_id_idi.split(',')[5];
        var priceid = disp_item_id_idi.split(',')[6];
        //$.cookie('display_item',[id,idi,number,text,time,starttime,priceid]);
        $(".button_ok").attr("disabled", true);
        $(".button_orange").attr("disabled", true);

        opened_item_form = true;
        $( ".order_table" ).hide();

        $( "#check" ).html( number );
        $( "#name" ).html( text );
        $( "#time" ).html( time );
        $( "#check" ).parent().find( ".startTimeOrder" ).attr( 'value', starttime );


        //MSG.set.personal( id, idi );
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
        }, 1000 ); //скорость таймера
        // else {  }

        $( ".order_item" ).fadeIn("slow");
    }

    setInterval(MSG.request.positionForTracer,60000); //И будем каждую минуту обновлять список. Но это неправильно. Надо на апдейты реагировать
}
// запрос списка елементов для готовки
MSG.request.positionForTracer = function () {  //получить элементы заказа 6 штук
    OrderStatusArray = []; //отчистка спискадля временного хранения заказов, нужно для того, чтобы не запрашивать статус заказа много раз
    //$(document).ready(function () {
       // $(".order_table").empty();
    //});
    //console.time('metka');

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


};
//----Читать Все элементы заказа для пицце мейкера где статус
MSG.request.positionForTracerWithStatus = function (stat) {

    var hashorg = SESSION_INFO.OrganizationHash,
        time = getTimeOnNow(),
        userhash = SESSION_INFO.UserHash,
        limit = 6;
    clearOrderL();
    MSG.send({
        structure: {
            "Table": "OrderList", "Query": "Read", "TypeParameter": "RangeWithStatus",
            "Values": [hashorg, time, tracker, stat, userhash], "Limit": limit, "Offset": 0
        }, handler: MSG.get.elementOrder, mHandlers: true
    });

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
    console.log("добвлен элемент в OrderL: ",data.Order_id,".",data.ID_item )
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

    //надо что то порешать с таймером in_work, который постоянно ставится 01:10 при открытии заказа
     if(tracker == 1 || tracker == 2)//если это сушимейкер или пицца только что пришла в раскатку, то время inwork устанавливается из TimeCook
         if ( $( "#in_work" ).attr( "data-timer-stat" ) != "0001-01-01T00:00:00Z" )
         {
             // var t1 = time_second2( activeOrder.TimeCook );
             // var now = getTimeNow1( 0 );
             // var time = $( "#in_work" ).attr( "data-timer-stat" );
             //     var arr = t_2_1.split(':'),
             //         brr = t_2_2.split(':');
             //
             //     var t1 = moment().hours(arr[0]).minutes(arr[1]).seconds(arr[2]);
             //     var t2 = moment().hours(brr[0]).minutes(brr[1]).seconds(brr[2]);
             //
             //     if(moment(t2).isBefore(t1))
             //         var t2 = timeMinus2( now , time );
             //     else var t2 = "-"+ timeMinus2( time , now);
             //
             // var time_in = timeMinus2( t1,t2 );
             // $( "#in_work" ).html( time_in );
         }
         else $("#in_work").html (time_second2 (activeOrder.TimeCook));
     else{
         var ID = [data.Order_id, data.ID_item];
         //MSG.request.OrderStatusActive(ID, 4); //если пицца в работе
     }

    MSG.request.OrderStatusActive(ID, 4); //если пицца в работе

    //иначе пицца уже раскатана и поэтому надо запрашивать время, когда закончили раскатку

    startTimer();

};
function redoneActive( n1, n3 ) {
    //if (n==1)     //без списание
    //if (n2==1)    // в трекер
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;
    MSG.set.orderStatus( id, idi, 14, n3 );//переделка

    if ( tracker < 3 ) {
        if ( n1 == 0 ) {
            MSG.set.orderStatus( id, idi, 3 );
            MSG.set.orderStatus( id, idi, 4 );
            $( "#in_work" ).html( time_second2( activeOrder.TimeCook ) );
        }
        else {
            MSG.set.orderStatus( id, idi, 3 );
            $( '.button_cancel' ).click();
        }   //в трекер
    }
    else {
        MSG.set.orderStatus( id, idi, 3 );
        $( '.button_cancel' ).click();
    }   //в трекер
    MSG.request.positionForTracer();

}






//Status
MSG.request.FirstStatus =  function (ID) {
    MSG.send( {structure: {"Table":"OrderStatus","Query":"Read","TypeParameter":"Value","Values":[ID,1],"Limit":0,"Offset":0}, handler:MSG.get.FirstStatus, } );
};
MSG.get.FirstStatus = function ( data ) {
    if ( data.Order_id == 0 ) return;
    for(var i in OrderL)
        if ( data.Order_id == OrderL[i].Order_id ) {

            OrderL[i].Status_id_First = data.Status_id;
            OrderL[i].TimeStatus_First = data.Time;

            addOrderToTable( OrderL[i] );  ///переписать на изъятие времени заказа из Order_time
            console.log("Добавлен элемент на форму",OrderL[i].Order_id,OrderL[i].ID_item);
        }
};
MSG.request.OrderStatusActive = function ( id, status_id ) {
    MSG.send({
        structure: {
            "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructIDOrdIDitIDStat",
            "Values": [ id[0], id[1],+status_id], "Limit": 0, "Offset": 0
        }, handler:MSG.get.ActiveStatus, errorHandler:NoActivStatus
    });
};
function NoActivStatus() {
    $(".button_ok").attr("disabled", false);
    $(".button_orange").attr("disabled", false);
}
MSG.get.ActiveStatus = function( data ) {
    //in_work for pizza and susi

    //рассчет оставшегося времени на приготовление

    //Обработчик статусов элементов заказа
    activeOrder.Cause_Last = data.Cause;
    activeOrder.Status_id_Last = data.Status_id;
    activeOrder.UserHashStatus_Last = data.UserHash;
    activeOrder.TimeStatus_Last = data.Time;

    var y = getHMS( activeOrder.TimeStatus_Last );// время когда взяли в работу
    var x = timeMinus2( getTimeNow1( 0 ), SYSTIME ); // текущее время с поправкой
    var c = time_second2(activeOrder.TimeCook); // время готовки
    var z = timeMinus2( x, y);

    var time_in_work = timeMinus2( c, z); // сколько осталось до конца
    var now = "00:00:00";
    var minus = false;
    if ( time_in_work[0] == '-' )
    {
        time_in_work = time_in_work.slice( 1 );
        minus =  true;
    }
    var arr = now.split(':'),
        brr = time_in_work.split(':');

    var t1 = moment().hours(arr[0]).minutes(arr[1]).seconds(arr[2]);
    var t2 = moment().hours(brr[0]).minutes(brr[1]).seconds(brr[2]);
    if(minus) t2 = t2.subtract(1,'days');

    if(moment(t2).isBefore(t1))
        time_in_work = timeMinus2( now , time_in_work );
    else time_in_work = timeMinus2( time_in_work , now);

    //если время готовки значительно большое(больше 3 часов, то значит это вчерашний заказ)
    //Этот костыль тут потому, что не предусмотрена работа с сутками
    if(!minus && brr[0] >= 3)
        time_in_work = "-"+ time_in_work;

   // if ( $("#in_work").attr( "data-timer-stat" ) != "0001-01-01T00:00:00Z" )
    $("#in_work").html( time_in_work );
   // else $("#in_work").html (timeMinus2( getHMS (activeOrder.TimeStatus_Last ), SYSTIME));

    $(".button_ok").attr("disabled", false);
    $(".button_orange").attr("disabled", false);
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
                MSG.set.orderStatus(ID[0], ID[1], 4);// в работе
                if ($(".font_main_time").attr("data-timer-stat") == "0001-01-01T00:00:00Z")
                {
                    MSG.set.createTimer(ID[0], ID[1]);
                    console.log("Создан таймер для заказа" + ID[0] + "" + ID[1]);
                }

            }
        }
        else
        {
            console.log("статус для заказа" + ID[0] + "" + ID[1] + " больше чем 4");
            return;
        }
    }
    else
    {
        MSG.set.orderStatus(ID[0], ID[1], 4);// в работе
        if ($(".font_main_time").attr("data-timer-stat") == "0001-01-01T00:00:00Z")
        {
            MSG.set.createTimer(ID[0], ID[1]);
            console.log("Создан таймер для заказа" + ID[0] + "" + ID[1]);
        }
    }

};




//Timers
MSG.request.Timer = function ( id ) {
    MSG.send( {structure: {"Table":"TimersCook","Query":"Read","TypeParameter":"Value","Values":[ id[0] , id[1] ],"Limit":0,"Offset":0}, handler:MSG.get.Timer } );
};
MSG.get.Timer = function ( data ) {
    for(var i in OrderL)
        if ( data.Order_id == OrderL[i].Order_id && data.Order_id_item == OrderL[i].ID_item ) {
            OrderL[i].Time_begin = data.Time_begin;
            OrderL[i].Time_end = data.Time_end;
            OrderL[i].Time_Finished = data.Finished;
            var id_div_atimer = '#a_timer' + data.Order_id + '-' + data.Order_id_item;
            $( id_div_atimer ).attr( "data-timer-stat", data.Time_begin );
            break;
        }



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

    var now = getTimeNow1( 0 );
    var arr = now.split(':'),
        brr = time.split(':');

    var t1 = moment().hours(arr[0]).minutes(arr[1]).seconds(arr[2]);
    var t2 = moment().hours(brr[0]).minutes(brr[1]).seconds(brr[2]);

    if(moment(t2).isBefore(t1))
        SYSTIME = timeMinus2( now , time );
    else SYSTIME = "-"+ timeMinus2( time , now);

    warning("Поправка вермени: " + SYSTIME, 'i', 5000 );
};
var tryUpdateTimers = 0; //счетчик попыток запустить таймер
var KeyDefect = -1;
setInterval(checkTimersonHTML,2000); //каждые 2 секунды проверка таймеров на нули

//Идея - создать функцию, которая будет перебирать все элементы на форме и смотреть, если там 00-00, то надо стартануть таймер
function checkTimersonHTML() {

    if(OrderL.count>0)
        if(ws.readyState == 1)
        {
            clearOldOrder();
            //StartTimer не даёт резултата
            if(tryUpdateTimers>3) //если больше 3-х попыток, то обновим список заказов
            {
                MSG.request.positionForTracer();
                tryUpdateTimers = 0;
            }

            var timers = $( '.font_main_time' );
            $.each( timers, function ( key, up_timer ) {
                if(up_timer.innerText == "00:00:00" ||up_timer.innerText == "0:00:00")
                {
                    timer( up_timer );
                    if(KeyDefect == -1)
                        KeyDefect = key;
                    if(KeyDefect == key)
                    {
                        tryUpdateTimers++;
                    }

                    return;
                }
            } );

            tryUpdateTimers = 0; //если все таймеры норм работают, не нули, то обнулим счетчик ошибок
        }
        else
        {console.log("Сокеты не доступны"); return;}

    else {
        var timers = $('.font_main_time');
        if (timers.length > 1)//если остались на форме незакрытые таймеры
        {
            //$(".order_table").empty();
        }
    }

}
function clearOldOrder() {
    var timers = $( '.font_main_time' );
    $.each( timers, function ( key, up_timer ) {
        var s = "a_timer" + old_zakaz_id + "-" + old_zakaz_idi;
        if (up_timer.id == s) {
            del_elem_from_table(old_zakaz_id , old_zakaz_idi);

        }
    } );
}









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

    else
    {
        pricename = textVal( arrOrder.PriceName );
        //предзаказ
        if(arrOrder.Status_id_First == 1) //если это предзаказ, то
            pricename +=" (предзаказ)";
    }

    sizeprice = (tracker == 2) ? ('<p class="font_main_name_small">' + textVal( pricename ) + '</p><p class="font_main_name_big">' + textVal( sizename ) + '</p>') :
        ('<p class="font_main_name">' + textVal( pricename )  + '</p>');

    var strOrderHTML = "";
    strOrderHTML += '' +
        '<a ' + linkOrder + 'style = "display: none" class="col-xs-12 col-sm-4 styleDiv ' + late + ' ' + redone + '" name="' + arrOrder.CookingTracker + '" ' +
        'id="a' + arrOrder.Order_id + '-' + arrOrder.ID_item + '">' +

        <!-- Сюда передаем время когда получили заказ -->
        '<input id="a_time_status' + arrOrder.Order_id + '-' + arrOrder.ID_item + '" class="startTimeOrder" hidden value="' + timeVal( arrOrder.TimeStatus_First ) + '">' +
        '<p class="font_main_check">#' + arrOrder.Order_id + '-' + arrOrder.ID_item + '' + ((arrOrder.ID_parent_item) ? '(Сет ' + arrOrder.ID_parent_item + ')' : '') + '</p>' +
        sizeprice +
        '<p id="a_timer' + arrOrder.Order_id + '-' + arrOrder.ID_item + '" class="font_main_time" data-timer-stat="' + timeVal(arrOrder.Time_begin)  + '" data-role="timer">' + '00:00:00' + //timeMinus2(getTimeNow1(0),sliceTime(timeVal(arrOrder.TimeStatus_First))) +
        '</p>' +
        '<!-- Сюда передаем норму времени -->' +
        '<input hidden value="00:30:00">' +
        '<input class="priceid" hidden value="' + arrOrder.Price_id + '">' +
        '</a>';

        if ( $( '#a' + arrOrder.Order_id + '-' + arrOrder.ID_item ).length == 0 ) { //если нет такого элемента добавляем, иначе заменяем новым

            $('.order_table').append( strOrderHTML );
            $('#a' + arrOrder.Order_id + '-' + arrOrder.ID_item).fadeIn(800);
            if(!opened_item_form) play();
        }
        else {//иначе ничего не трогаем
            //$( '#a' + arrOrder.Order_id + '-' + arrOrder.ID_item ).replaceWith( strOrderHTML );
        }

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
    console.log("--------Клик по элементу");

    if(count_users == 0 && SESSION_INFO.RoleHash == pizza)//если в группе никого нет
    {
        warning("В группе нет пользователей! Войдите в группу, нажав 'Присоедениться'","error",5000);
        console.log("--------В группе никого нет. Выход.");
        return;
    }

    $(".button_ok").attr("disabled", true);
    $(".button_orange").attr("disabled", true);

    opened_item_form = true;
    $( ".order_table" ).fadeOut(800);

    var number = ($( this ).find( ".font_main_check" ).html()),
        text = ($( this ).find( ".font_main_name" ).html());
    if ( !text ) text = ($( this ).find( ".font_main_name_small" ).html()) + ' ' + ($( this ).find( ".font_main_name_big" ).html());
    var time = ($( this ).find( ".font_main_time" ).html()),
        starttime = $( this ).find( ".startTimeOrder" ).attr( 'value' ),
        id = number.slice( 1, number.indexOf( '-' ) ),
        idi = number.slice( number.indexOf( '-' ) + 1 );
    if ( idi.indexOf( '(' ) > 0 ) idi = idi.slice( 0, idi.indexOf( '(' ) );
    $( "#in_work" ).attr( "data-timer-stat", $( this ).find( ".font_main_time" ).attr( "data-timer-stat" ) );


    $( "#check" ).html( number );
    $( "#name" ).html( text );
    $( "#time" ).html( time );
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

    $( ".order_item" ).fadeIn("slow");
    $.cookie('display_item',[id,idi,number,text,time,starttime,priceid]);
} );
//изменение трекера в зависимости от селекта
$( ".dropdown-toggle.user_role" ).change( function () {
    $(".order_table").empty();
    tracker = $( ".dropdown-toggle.user_role option:selected" ).index() + 1;
    $.cookie( 'tracker', tracker );
    MSG.request.positionForTracer();
} );
$( '.button_ok' ).click( function () {
    console.log("--------Клик по ОК");
    if ( timeMinus2( time_second2( activeOrder.TimeCook ), $( "#in_work" ).text() ) < minimal_cook_time ) { // minimal_cook_time
        warning( "Невозможно так быстро приготовить заказ!", 'a', 5000 );
        warning( "Берите продукт на готовку ЗАРАНЕЕ!", 'error', 5000 );

        return;
    }



    $( ".order_item" ).fadeOut(600);
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;

    if ( tracker == 1 ) {
        MSG.set.finished( id, idi );
        MSG.set.orderStatus( id, idi, 8);
        MSG.set.finishTimer([id,idi]);//закрываем таймер
    }
    if ( tracker == 2 ) MSG.set.orderStatus( id, idi, 6 );    //если была "Раскатка", то устанавливаем статус 6 - Начинение
    if ( tracker == 3 ) MSG.set.orderStatus( id, idi, 7 );    //если была  "Начинение" то ставим  7 - запекание
    if ( tracker == 4 ) {
        MSG.set.finished( id, idi );
        MSG.set.orderStatus( id, idi, 8);
        MSG.set.finishTimer([id,idi]);//закрываем таймер
    }  //если была  "Запекание", то заканчиваем заказ

    for(var i in OrderL)
        if(OrderL[i].Order_id == activeOrder.Order_id && OrderL[i].ID_item == activeOrder.ID_item)
        {
            delete OrderL[i];
            OrderL.count--;
            break;
        }

    del_elem_from_table(id,idi);

    $( ".order_table" ).fadeIn(600);

    clearInterval( timer_int );
    opened_item_form = false;
    $.removeCookie('display_item');
    activeOrder = {};
} );
$( ".order_item" ).hide();
$( ".button_cancel" ).hide();
$( '.button_cancel' ).click( function () {
    $( ".order_table" ).show();
    $( ".order_item" ).hide();
    var id = activeOrder.Order_id, idi = activeOrder.ID_item;
    // if ( tracker == activeOrder.CookingTracker )
    //     MSG.set.orderStatus( id, idi, 3 );
    activeOrder = {};
    // MSG.request.positionForTracer();
} );
function del_elem_from_table(id,idi) {
    var hhh = "#a" + id + '-' + idi;
    $( hhh ).fadeOut(600, function() { $(hhh).remove(); });
    console.log('удаление елемента', hhh);
}


function SyncOrderL() {
    var elements = $( '.startTimeOrder' );
    $.each( elements, function ( key, element ) {
        if(key<elements.length-1)
        if (consistOfOrderL(element))
        {

        }
        else
        {
            var id = element.id;
            id = id.split("a_time_status")[1];
            id = id.split('-');
            del_elem_from_table(id[0],id[1])
        }

    } );
}

function consistOfOrderL(element) {
    try{
        var id = element.id;
        id = id.split("a_time_status")[1];
        id = id.split('-');
        for(var order in OrderL)
        {
            if(id[0] == OrderL[order].Order_id && id[1] == OrderL[order].ID_item )
            {
                return true; //элемент Найден! в orderL
            }
        }
        return false;//элемент не найден в orderL
    }
    catch (err)
    {
        console.error("Ошибка проверки наличия элемента в OrderL",err);
    }
}







//Групппы
var exec_user = false; //чувак хочет выйти
function onclick_exit_button(fio,login,id) { //клик выхода у пользователя
    $( "#name_user" ).html(fio);
    $( "#usr" ).val(login);
    $( "#usr" ).attr('tag',id);
    exec_user = true;
}
$( '#ok_day_cashier' ).click( function (event) { //кнопка ok
    var login = $( "#usr" ).val();
    var id_user = $( "#usr" ).attr('tag');
    var password = $( "#pwd" ).val();
    var URL_SignIn = "";


        if (exec_user) URL_SignIn = "http://91.240.87.193:7070/out";
        else URL_SignIn = "http://91.240.87.193:7070/in";

    if ( WS_URL == 'ws://192.168.0.73:80/ws' ) {
         if(exec_user) URL_SignIn = "http://192.168.0.130:7070/out";
          else URL_SignIn = "http://192.168.0.130:7070/in";
    }
   //


    console.log( "EXEC?:"+exec_user+" login: "+ login+"password: "+ password+"group: "+ idGroup+"id: "+ id_user+"END");
    //отправляем авторизашку
    $.ajax({
        type: "POST",
        cache: false,
        async: false,
        data: ({
            login: login,
            password: password,
            group: idGroup,
            id: id_user,
        }),
        url: URL_SignIn,
        success: function(res) {
            if (String(res["Error"]) != "null") {
                var time_warning = 5000;
                if(~res["Error"].indexOf("Ошибка при попытке получения информации о точке") )
                {
                    warning("Ошибка при чтении плана. Обратитесь к администратору." , 'i', time_warning );
                }
                else if(~res["Error"].indexOf("Пользователь уже добавлен") )
                {
                    warning(res["Error"] , 'i', time_warning );
                }
                else if(~res["Error"].indexOf("INCORRECT_PASSWORD") )
                {
                    warning("Неверный пароль" , 'i', time_warning );
                }
                else if(~res["Error"].indexOf("Login User:sql: no rows") )
                {
                    warning("Неверный логин" , 'i', time_warning );
                }
                else if(~res["Error"].indexOf("Хеш пользователя") )
                {
                    warning("Вы пытаетесь выйти из чужого аккаунта!" , 'i', time_warning );
                }
                else
                {
                    warning("Неизвестная ошибка(подробности в консоли)" , 'i', time_warning );
                    console.error(res["Error"] );
                }
                return false;
            }
            else
            if(exec_user)
            {
                warning("Пользователь исключен из группы: " + res["Message"], 'info', 10000 );
                exec_user = false;
            }
            else
            {
                warning("Пользователь присоединён к группе: " + res["Message"], 'info', 10000 );

            }
            // $.removeCookie("hash_session_for_user", Cookie.cookieOptions);
            // $.cookie("hash_session_for_user",res["hash"], Cookie.cookieOptions);
            //window.location.href = res["link"];

        },
        complete: function() {},
        error: function(res)
        {
            alert(res['error']);
        }
    });


    $( "#name_user" ).html("");
    $( "#usr" ).val("");
    $( "#pwd" ).val("");
    $("#connection").modal('hide');
    MSG.request.GroupUser(); //запрос списка юзеров в группе
    return false;
} );    //AJAX
$( '#close_day_cashier' ).click( function (event) { //кнопка отмена
    $( "#name_user" ).html("");
    $( "#usr" ).val("");
    $( "#pwd" ).val("");
    exec_user = false;
} );

function addUserToList(user_hash,n1,n2,login){ //обновить список пользователей в выпадающем списке
        var strOrderHTML = "";//HTML код - список работников
    try {
        var person = Users[ user_hash]; //ищем работника для группы в массиве

        //тут надо запросить логин юзера
        person['id'] = Users[user_hash].ID;
        person['hash_session_for_user'] = user_hash;
        person['login'] = login;
        person['name1'] = n1;
        person['name2'] = n2;

        Users[ user_hash] = person;

        var fio = person['name2'] + " " +   person['name1'];

        strOrderHTML+=  "<li>" + fio + "&nbsp;"; //Добавляем ФИО
        strOrderHTML+=  "<button  type='button' id = "+person['id']+"    tag = "+person['login']+" class='btn btn-dropdown-user' data-toggle='modal' data-target='#connection' onclick='onclick_exit_button(\""+fio+"\" , \""+person['login']+"\", \""+person['id']+"\")'>Выход</button></li>"; //добавляем кнопку
        strOrderHTML+=  "<li role='separator' class='divider'></li>"; //Добавляем разделитель

        $( '.users_list' ).append( strOrderHTML );//отрисовываем в html
        count_users++;
        $( ".idgroup" ).html("Группа: " + idGroup + " ( " +count_users+ " чел. )");
    }
    catch (err)
    {
        console.error("Ошибка при добавлении юзера",err);
    }


}
var firstUserReceived = false;
//Запрос группы юзеров
MSG.request.GroupUser = function (  ) {
    if(idGroup == "" || isNaN(+idGroup))
        return;

    firstUserReceived = false;
    $( ".idgroup" ).html("Группа: " + idGroup + " ( " +count_users+ " чел. )");
    $( '.users_list' ).html( "" );//отрисовываем в html

    var date = new Date();
    var formated_date = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    MSG.send( {structure: {"Table":"GroupUser","Query":"Read","TypeParameter":"OnGroup_idDate","Values":[idGroup,formated_date],
        "Limit":9999999,"Offset":0},
        handler:MSG.get.updateListUsers,
        mHandlers: true,
        EOFHandler: RecivedNullUsers} );
};
MSG.get.updateListUsers = function (data) {
    if(!firstUserReceived)
    {
        firstUserReceived = true;
        Users = []; //чистим список юзеров
        count_users = 0;
    }
    if(!Users[data.UserHash])
    {
        MSG.request.SessionInfoForUser(data.UserHash);
        var person = {}; //Создаём работника для группы

        //тут надо запросить логин юзера
        person['ID'] = data.ID;
        person['hash_session_for_user'] = data.UserHash;
        person['login'] = "";
        person['name1'] = "";
        person['name2'] = "";
        person['name3'] = "";

        Users[ data.UserHash ] = person;
    }

};
function RecivedNullUsers(data) {
    console.log("RecivedNullUsers: EOF");
    if(!firstUserReceived)
    {
        firstUserReceived = true;
        Users = []; //чистим список юзеров
        count_users = 0;
        var strOrderHTML = "Нет пользователей в группе";
        $( '.users_list' ).append( strOrderHTML );//отрисовываем в html
        $( ".idgroup" ).html("Группа: " + idGroup + " ( " +count_users+ " чел. )");
    }
}
//запрос информации по одному челу
MSG.request.SessionInfoForUser = function ( UserHash ) {
    MSG.send( {
        structure: { "Table": "SessionInfo", "Query": "Read", "TypeParameter": "OnUserHash", "Values": [UserHash] },
        handler: MSG.get.SessionInfo
    } );
};
MSG.get.SessionInfo = function (data) {
    addUserToList(data.UserHash,data.FirstName,data.SurName,"" );
};



function play(){
    $('#sound').html('<embed src="../../public/cook/ring.mp3" type="audio/mp3"><noembed><bgsound="../../public/cook/ring.mp3"></noembed>')
};