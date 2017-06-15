/**
 * Created by ALEX on 22.02.2017.
 */
//бывший myjs.js - start

function procCollapse() {
    document.navbar.style.maxHeight = "auto";
}
// Дата и время
function getTime() {
    var d = new Date();
    var month_num = d.getMonth();
    var day_num = d.getDay();
    var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();

    var month = new Array( "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря" );
    var weekday = new Array( "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" );

    if ( day <= 9 ) day = "0" + day;
    if ( hours <= 9 ) hours = "0" + hours;
    if ( minutes <= 9 ) minutes = "0" + minutes;

    var current_time = hours + ":" + minutes;
    var current_date = weekday[day_num] + ",  " + day + " " + month[month_num];
    if ( document.layers ) {
        document.layers.doc_time.document.write( current_time );
        document.layers.doc_date.document.write( current_date );
        document.layers.doc_time.document.close();
        document.layers.doc_date.document.close();
    } else {
        document.getElementById( "doc_time" ).innerHTML = current_time;
        document.getElementById( "doc_date" ).innerHTML = current_date;
    }
    setTimeout( "getTime()", 30000 );
}
getTime();
// Стилизованный селект и трекер для перехода между режимами

$( function () {
/////------------------------------------------------------------------------
    $( 'select.styler' ).styler( {
        selectSmartPositioning: false
    } );

    $( '#treker' ).on( 'change', function () {
        $( '.change-traker' ).attr( 'href', $( '#treker' ).val() );
    } );

} );

var timers_now = {}; //массив текущих таймеров

function startTimer() {
    var timers = $( '.font_main_time' );
    $.each( timers, function ( key, up_timer ) {
        timer( up_timer );
    } );

    //Попытка не дулбиовать таймеры
    //     $.each( timers, function ( key, up_timer ) {
    //         if(timers_now[key])
    //         {
    //             //ничего не делать
    //         }
    //         else
    //         {//
    //             timers_now[key] = up_timer;
    //             timer( up_timer );
    //         }
    //
    //     } );//создали недостающие, надо удалить лишние
    // $.each( timers_now, function ( key1, up_timer1 ) {
    //     var del_elem = true; //натсроимся на удаление
    //     $.each( timers, function ( key2, up_timer2 ) {
    //         if(key1==key2) del_elem = false;//не удалять, он есть!
    //     } );//
    //     if (del_elem)
    //         delete timers_now[key1];
    // } );//

}


var timer = (function () {
    var listTimer = {};
    return function timer( block ) {
        var id = block.id;
        if ( listTimer[id] ) {
            clearInterval( listTimer[id] );
        }
        listTimer[id] = setInterval( function () {
            if ( document.querySelector( '#' + id ) === null ) {
                clearInterval( listTimer[id] );
                delete listTimer[id]
            }

            var d = new Date(),
                ah = d.getHours(),
                am = d.getMinutes(),
                as = d.getSeconds();

            var startTimeOrder = block.parentNode.firstElementChild.getAttribute( 'value' );

            if ( startTimeOrder.length > 8 )
                startTimeOrder = startTimeOrder.slice( 11, 19 );

            var bt = startTimeOrder.split( ":" ),
                bh = bt[0], bm = bt[1], bs = bt[2],
                ch = ah - bh, cm = am - bm, cs = as - bs;

            if ( cs < 0 ) {
                cs = cs + 60;
                cm = cm - 1;
            }
            if ( cs < 10 & cs >= 0 ) cs = "0" + cs;

            if ( cm < 0 ) {
                cm = cm + 60;
                ch = ch - 1;
            }
            if ( cm < 10 & cm >= 0 ) cm = "0" + cm;

            if ( ch < 0 ) ch = ch + 24;
            if ( ch < 10 & ch >= 0 ) ch = "0" + ch;


            var time = ch + ":" + cm + ":" + cs;
            //time = timeMinus( time, SYSTIME );
            time = timeMinus2( time, SYSTIME );

            $( block ).text( time );

            // Ограничение времени передаем сюда
            // var limitTime = block.parentNode.lastElementChild.getAttribute('value');
            var limitTime = block.nextElementSibling.getAttribute( 'value' );
            if(time.split(':')[0].length == 1)
                time = "0"+time;
            if ( time >= limitTime ) {
                block.parentNode.setAttribute( 'class', 'col-xs-12 col-sm-4 styleDiv late' );
            }
            //else block.parentNode.setAttribute( 'class', 'col-xs-12 col-sm-4 styleDiv' );
            //   setTimeout("timer(block)", 1000);
        }, 1000 );
    }
})();

function downTimer() {
    var my_timer = $( "#in_work" );
    var time = my_timer.text(); //

    if ( time[0] == "-" ) {
        downTimerMinus1( my_timer );
        return;
    }
    var arr = time.split( ":" ), hd = arr[0], md = arr[1], sd = arr[2];
    if ( sd == 0 ) {
        if ( md == 0 ) {
            if ( hd == 0 ) {
                console.log( "Превышена норма времени" );
                my_timer.prepend( '-' );
                downTimerMinus1( my_timer );
                return;
            }
            hd--;
            md = 60;
            if ( hd < 10 ) hd = "0" + hd;
        }
        md--;
        if ( md < 10 ) md = "0" + md;
        sd = 59;
    }
    else sd--;
    if ( sd < 10 ) sd = "0" + sd;
    my_timer.text( hd + ":" + md + ":" + sd );//тут записывается таймер in_work
    $( "#in_work" ).attr( "data-timer-stat" ,hd + ":" + md + ":" + sd);
}
function downTimer3() {

    var my_timer = $( "#in_work" );
    var time = my_timer.text(); //
    var nul = "00:00:00";

    var arr = time.split(':');

    var t1 = moment().hours(arr[0]).minutes(arr[1]).seconds(arr[2]);
    var t2 = moment().hours(0).minutes(0).seconds(0);

    if(moment(t2).isBefore(t1))
        var t2 = timeMinus2( nul , time );
    else var t2 = "-"+ timeMinus2( time , nul);

    var time_in = timeMinus2( t1,t2 );


    my_timer.text( hd + ":" + md + ":" + sd );//тут записывается таймер in_work
    $( "#in_work" ).attr( "data-timer-stat" ,hd + ":" + md + ":" + sd);
    if ( time<=nul ) {
        console.log("Превышена норма времени");
    }
}


function downTimerMinus1( my_timer ) {
    //  setInterval(function () {

    var time = my_timer.text();
    if ( time[0] == '-' ) time = time.slice( 1 );
    var arr = time.split( ":" ), hd = arr[0], md = arr[1], sd = arr[2];
    if ( sd == 59 ) {
        if ( md == 59 ) {
            hd++;
            md = 0;
            if ( hd < 10 ) hd = "0" + hd;
        }
        md++;
        sd = 0;
        if ( md < 10 ) md = "0" + md;
    }
    else sd++;
    if ( sd < 10 ) sd = "0" + sd;


    my_timer.text( "-" + hd + ":" + md + ":" + sd );
    $( "#in_work" ).attr( "data-timer-stat" ,hd + ":" + md + ":" + sd);
    // setTimeout(downTimerMinus1, 1000);
    //  }, 1000)
}
function downTimer2( my_timer ) {
    setInterval( function () {
        downTimer( my_timer );

        var time = my_timer.innerHTML;
        var id = my_timer.getAttribute( "label2" );
        //  console.log(id);
        var idi = my_timer.getAttribute( "label3" );
        var name = my_timer.getAttribute( "label" );

        var progress = my_timer.parentNode;
        var valuenow = progress.getAttribute( "aria-valuenow" );
        var valuemax = progress.getAttribute( "aria-valuemax" );
        if ( +valuenow <= +valuemax ) {
            valuenow = +valuenow + 1;
        }
        progress.setAttribute( "aria-valuenow", valuenow );
        progress.setAttribute( "style", "width: " + valuenow / valuemax * 100 + "%;" );
        var data = valuenow / valuemax * 100;
        if ( time[0] == "-" ) {
            addTimerFinishDiv( id, idi, name );
            delTimerProgressbar( my_timer );
            //downTimerMinus2(my_timer);
            return;
        }

    }, 1000 )


    //$(".lBlock").siblings(".cont")
    // найдет элементы класса cont,    role="progressbar"
    // которые имеют общих родителей, с элементами класса lBlock '[role="progressbar"]'

    // var progressval= progress.val();
    // progressval = progressval +1;

    //  $(progress).attr({"aria-valuenow": valuenow.html()});

    // $("div").attr({"class":"divEl", "title":"Див"})	класс div-элементов станет равен divEl, а title — "Див"
    //  $(".rool").attr("title")

}
//бывший myjs.js - end



//бывший time.js

//вычитание таймеров

if(TEST)
function timeMinus2 (a,b,c){
    //c==0 для минусового таймера возвращает минус значение
    //с==1 плюсует 24 часа при переходе через 0
    //c==2 возвращает разницу в секундах

if (!a||!b) return;
if(a.indexOf('T')>0) a=a.slice(a.indexOf('T')+1,a.indexOf('T')+9);
    if(b.indexOf('T')>0) b=b.slice(b.indexOf('T')+1,b.indexOf('T')+9);
    // if(b.indexOf('T')>0) b=b.slice(b.indexOf('T')+1,8);
    var arr = a.split(':'),
        brr = b.split(':');
    // if (c==2) return arr[2]+arr[1]*60 +arr[0]*60*24;
    // if (a.day < b.day) arr[0]= brr[0]+1
    // if (a.day > b.day) arr[1]+=24; переход через 24 часа


    if (arr[0][0]=="-"&&brr[0][0]=="-")return  timeMinus (b.slice(1),a.slice(1));
    if (arr[0][0]!="-"&&brr[0][0]=="-")return timePlus (a,b.slice(1));
    if (arr[0][0]=="-"&&brr[0][0]!="-")return "-"+ timePlus (a.slice(1),b);

    if (arr[0]<brr[0]&&c==0) return '-'+(timeMinus(b,a,c));
    else if (arr[1]<brr[1]&&arr[0]==brr[0]&&c==0)return '-'+(timeMinus(b,a,c));
    else if (arr[0]==brr[0]&&arr[1]==brr[1]&& arr[2]<=brr[2]&&c==0) return '-'+(timeMinus(b,a,c));




    if (arr[0]<brr[0]) arr[0]= +arr[0]+24; //переход через 24 часа
    for (var i=arr.length-1;i>=0;i--) {
        if (arr[i]>=brr[i]) arr[i]-=brr[i];
        else { if (i>0){arr[i]=arr[i]-brr[i]+60; --arr[i-1];}else arr[i]=arr[i]-brr[i]+24}
        if(+arr[i]<=9) arr[i]= "0" + +arr[i];
    }
    if (c==2) {
        return +arr[2]+ +arr[1]*60 + +arr[0]*60*24;
    }
    return arr[0] + ":"+ arr[1]+":"+ arr[2];
}
else
function timeMinus2(a,b) {
    if (!a||!b) return;
    var result_string = "";
    //console.log("a = " + a);
    //console.log("b = " + b);
    var a_minus = false;
    var b_minus = false;
    var minus = false;
    if(a[0]=="-")
    {
        a=a.replace(/-/g,'');
        a_minus = true;
    }
    if(b[0]=="-")
    {
        b=b.replace(/-/g,'');
        b_minus = true;
    }
    try {
        var arr = a.split(':'),
            brr = b.split(':');
    }
    catch(err){
            console.log("ошибка в function timeMinus2(a,b): "+err);
        }

    var t1 = moment().hours(arr[0]).minutes(arr[1]).seconds(arr[2]);
    var t2 = moment().hours(brr[0]).minutes(brr[1]).seconds(brr[2]);

    var result;



    if(!a_minus && b_minus ) //то складываем
    {
        minus = false;
        result  = t1.add(t2.hours(),'hours').add(t2.minutes(),'minutes').add(t2.seconds(),'seconds');
    }

    else if(a_minus && !b_minus)
    {
        if(moment(t1).isBefore(t2))
            minus = true;
        result  = t1.subtract(t2.hours(),'hours').subtract(t2.minutes(),'minutes').subtract(t2.seconds(),'seconds');
    }
    else  if(!a_minus && !b_minus  || a_minus && b_minus)
    {
        if(moment(t1).isBefore(t2))
            minus = true;
        result  = t1.subtract(t2.hours(),'hours').subtract(t2.minutes(),'minutes').subtract(t2.seconds(),'seconds');
    }


    if(minus)
        result_string+="-";

    result_string+=result.format('H:mm:ss');
    //console.log("result_T = " + result_string);
    return result_string;
}

function timePlus (a,b){
//console.log("PLUSSSS"+a+" "+b);

    var arr = a.split(':');
    var brr = b.split(':');
    // if (a.day < b.day) arr[0]= brr[0]+1
    // if (a.day > b.day) arr[1]+=24; переход через 24 часа
    //if (arr[0]<brr[0]) arr[0]= +arr[0]+24; //переход через 24 часа
    for (var i=arr.length-1;i>=0;i--) {
        if ((+arr[i]+ +brr[i])<60) arr[i]= +arr[i]+ +brr[i];
        else { arr[i]=+arr[i]+ +brr[i]-60; ++arr[i-1];}
        if(+arr[i]<=9) arr[i]= "0" + +arr[i];
    }
    // if(minus == "-")
    //     return "-"+arr[0] + ":"+ arr[1]+ ":"+ arr[2];

     return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
}
function time_second2 (a){
    //Эта функция преобразует время в формат 00:00:00
    var  time= new Date(0); //нуль тут нужен, без него минуты станут часами, а секунды минутами
    time.setSeconds(a);
    var time2= time.toUTCString();//toTimeString();
    time2=time2.slice(17,25); //если время не в формате 00:00:00
    var arr = time2.split(":");
    return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
}
function getHMS (a){
    var  time = new Date(a);
    var time2= time.toUTCString();//toTimeString();
    time2=time2.slice(17,25); //если время не в формате 00:00:00
    var arr = time2.split(":");
    return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
}
function getTimeNow1(digit) {
    var d = new Date();
    //  var day = d.getDate();
    var hours = d.getHours(),
     minutes = d.getMinutes(),
     seconds = d.getSeconds(); //timeorder время в секундах с начала

    // if (day <= 9) day = "0" + day;
    if (hours <= 9) hours = "0" + hours;
    if (minutes <= 9) minutes = "0" + minutes;
    if (seconds <= 9) seconds = "0" + seconds;
    if (digit == 0) return hours + ":" + minutes + ":" + seconds;
    if (digit == 1) return hours + ":" + minutes;
}
function getTimeOnNow(){
    var _date = new Date();
    var _hours = parseInt(_date.getHours());
    var _minutes = parseInt(_date.getMinutes());
    var _secondes = parseInt(_date.getSeconds());
    var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
    var _months = parseInt(_date.getMonth()) + 1;
    _months = _months < 10 ? '0' + _months : _months;
    var _day =  parseInt(_date.getDate());
    _day = _day < 10 ? '0' + _day : _day;
    _date = _date.getFullYear() + '-' + _months + '-' + _day;
    //2016-11-10T14:58:04.095037Z
    return _date+"T"+_time+":"+(_secondes < 10 ? '0' + _secondes : _secondes)+"Z";
}
function sliceTime(a,digit) {

    if (digit==1) {
        if (a[2]==':') return a.slice(0, 5); //toTimeString();
        if (a.length > 20) return a.slice(17, 22);//toUTCString()
        return a.slice(11, 16); //golang
    }
    if (a.length > 20) return a.slice(17, 25);
    return a.slice(11, 19);
}







//неиспользуемые функции
//
//
//

// function getTimeOnTime(){
//
//     var date =$("#select_date").val(),
//         time=$("#select_time").val();
//     //2016-11-10T14:58:04.095037Z
//     return date+"T"+time+":00Z";
// }
// function getTimeToday(){
//
//     var _date = new Date();
//     var _hours = parseInt(_date.getHours());
//     var _minutes = parseInt(_date.getMinutes());
//     var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
//     var _months = parseInt(_date.getMonth()) + 1;
//     _months = _months < 10 ? '0' + _months : _months;
//     var _day =  parseInt(_date.getDate());
//     _day = _day < 10 ? '0' + _day : _day;
//     _date = _date.getFullYear() + '-' + _months + '-' + _day;
//     //2016-11-10T14:58:04.095037Z
//     return _date+"T00:00:00Z";
// }
// function getTimeHM(time){
//     //2016-11-10T14:58:04.095037Z
//     return time.slice(11, 16);
// }
// function getTimeHMminus(time){
//     var _date = new Date();
//    // _date =_date.toUTCString();
//     if (time[2]==':') time=time.slice(0, 5);
//     if (time.length > 20)  time=time.slice(17, 22);//toUTCString()
//     if (time[2]!=':')time=time.slice(11, 16);
//     var arr = time.split(':');
//     var _hours = parseInt(_date.getHours());
//     var _minutes = parseInt(_date.getMinutes());
//     if (arr[1]>_minutes)
//     {_minutes=_minutes - arr[1]+60;
//         _hours=_hours -1;}
//     else _minutes=_minutes - arr[1];
//     if (arr[0]>_hours)
//     {_hours=_hours - arr[0]+24;}
//     else _hours=_hours - arr[0];
//
//     var _time = (_hours < 10 ? '0' + _hours : _hours) + ':' + (_minutes < 10 ? '0' + _minutes : _minutes);
//     return _time;
// }
// function timePlus1 (a,num) {
//     var arr = a.split(':');
//     arr[1]= +arr[1] + +num;
//     if (+arr[1]>59) {arr[1]= +arr[1] - 60; arr[0]= +arr[0] +1 ;}
//     if(+arr[1]<=9) arr[1]= "0" + +arr[1];
//     if (+arr[0] <=9) arr[0]= "0" + +arr[0];
//     return arr[0] + ":"+ arr[1];
// }
// function timeMinus1 (a,num) {
//     var arr = a.split(':');
//     arr[1]= +arr[1] - +num;
//     if (+arr[1]<0) {arr[1]= +arr[1] + 60; arr[0]= +arr[0] -1 ;}
//     if(+arr[1]<=9) arr[1]= "0" + +arr[1];
//     if (+arr[0] <=9) arr[0]= "0" + +arr[0];
//     return arr[0] + ":"+ arr[1];
// }
// /*function time_second2 (a){
//  var  time= new Date(0);
//  time.setSeconds(a);
//  var time2= time.toUTCString();//toTimeString();
//  time2=time2.slice(17,25); //если время не в формате 00:00:00
//  var arr = time2.split(":");
//  return arr[0] + ":"+ arr[1]+ ":"+ arr[2];
//  }
//  */
//



//время приготовления 00.08.30
//принят в работу:    12.12.12   время в работе = 00.08.30
//раскатка закончена: 12.14.12   время в работе = 00.06.30
//