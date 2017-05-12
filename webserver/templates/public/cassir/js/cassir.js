// : V время заказа отображется от последнего статусаю

function Cassir() {
}
Cassir.elem = {
    nextBtn: '<li class="orders_li btn next_page" style="height: calc( 25% - 1px); display: none ;background-color: #006dcc"><a class="orders">Следующая</a></li>',
    prevBtn: '<li class="orders_li btn prev_page" style="height: calc( 25% - 1px); display: none ;background-color: #006dcc"><a class="orders">Предыдущая</a></li>',
    empty: '<li class="orders_li empty" style="display: none"><a class="orders"></a></li>'
};


Cassir.flippIndex = 0; // переменная листалка
Cassir.FlippingFunc = {
    next: function () {
        Cassir.flippIndex += 20;
        $( '.orders_li:hidden:lt(' + Cassir.flippIndex + ')' ).css( 'display', '' );
        $( '.orders_li:visible:lt(' + Cassir.flippIndex + ')' ).css( 'display', 'none' );
    }, prev: function () {
        var index1 = Cassir.flippIndex - 21;
        $( '.orders_li' ).css( 'display', 'none' );
        // если должны отобразится первые 20, то gt() не используется. - (index1 > 0 ? ':gt(' + index1 + ')' : '')
        $( '.orders_li:lt(' + Cassir.flippIndex + ')' + (index1 > 0 ? ':gt(' + index1 + ')' : '') )
            .css( 'display', '' );
        Cassir.flippIndex -= 20;
    }
};
$( 'body' ).on( 'click', '.next_page', Cassir.FlippingFunc.next ).on( 'click', '.prev_page', Cassir.FlippingFunc.prev );

Cassir.updateDisplay = function () {
    $( '.orders_li' ).css( 'display', 'none' ); // при удалении на предыдущей странице.
    // если должны отобразится первые 20, то gt() не используется. - (index1 > 0 ? ':gt(' + index1 + ')' : '')
    $( '.orders_li' + ( (Cassir.flippIndex > 0) ? (':gt(' + (+Cassir.flippIndex - 1) + ')') : '' ) + ':lt(20)' )
        .css( 'display', '' );
};
Cassir.showBtnFlipping = function ( po, recursion ) {
    // кнопки делаются автоматом, но style="display: none"
    po = po || 19;
    if ( !recursion ) {
        $( '.orders_li.btn' ).remove();
    }
    if ( $( '.orders_li:gt(' + (+po ) + ')' ).length !== 0 ) {
        $( '.orders_li:eq(' + po + ')' ).before( Cassir.elem.nextBtn ).before( Cassir.elem.prevBtn );
        if ( $( '.orders_li:gt(' + (+po + 20) + ')' ).length !== 0 ) {
            Cassir.showBtnFlipping( +po + 20, true ); // рекурсия тут!!!
        }
    }
};
// делаем все елементы видимыми -> скрываем не нужные
// -> делаем листалки игнорируя скрытые -> оставляем только первые 20 елементов
Cassir.sortedOrders = [];
Cassir.sortOrders = function () {
    // console.group( 'sortOrders' );
    function com( el, el1 ) {
        var time = Order.list[el].time, time1 = Order.list[el1].time;
        time = new Date( time[0], time[1], time[2], time[3], time[4], time[5] );
        time1 = new Date( time1[0], time1[1], time1[2], time1[3], time1[4], time1[5] );
        // console.log( time, time1 );
        return time - time1;
    }

    Cassir.sortedOrders = [];
    for ( var i in Order.list ) {
        Cassir.sortedOrders.push( +i );
    }
    Cassir.sortedOrders.sort( com );
    // console.groupEnd();
};

// : V сделать отображение даты начала готовки.
// : V время заказа
function Order( data ) {
    // TODO: инициализацию отображения пренести в конструктор. тутуже обновление.
    // TODO: научить распологаться автоматически.
    // при добавлении данных также используем конструктов
    // проверяем еить ли обект, при наличии дописываем новыми данными.
    // соответственно при появлении новых данных вызываем конструктор и
    // он либо дополняет/обновляет уже имеющиемя либо делает новый обект,
    // при этом при этом все обновление информации происходит
    // так же через конструктор
    // console.group( 'ORDER', data );
    var d, t;
    if ( typeof data === 'object' ) {
        for ( var i in data ) {
            if ( i === 'DatePreOrderCook' ) {
                d = data[i].split( 'Z' )[0].split( 'T' );
                t = d[1];
                d = d[0];
                data[i] = d.concat( t );
            } else if ( i == "Order_time" ) {
                this.time = Page.timeToArray( data["Order_time"] );
            }
            this[i] = data[i];
        }
    }

    this.state = [];

    if ( this.Type == TAKEAWAY ) {
        this.state.push( 'take_away' )
    } else if ( this.Type == DELIVERY ) {
        this.state.push( 'on_delivery' )
    }

    if ( this.Division !== ' ' ) {
        this.state.push( 'to_workers' )
    }
    Order.list[this.ID] = this;
    // console.groupEnd();
}
Order.$orderFeeld = $( '#order_block' );
Order.list = {};
Order.prototype.addStatus = function ( data ) {
    // console.group( 'addStatus' );
    // console.log( 'this, data', this, data );
    if ( data.Order_id_item === 0 ) { // для всего заказа
        // console.log( '1  data.Status_id , Order.status[(data.Status_id || 2)].Name', data.Status_id, Order.status[(data.Status_id || 2)].Name );
        this.status = data.Status_id || 2;
        this.statusT = Order.status[(data.Status_id || 2)].Name;
        if ( this.status == 4 ) {
            this.state.push( 'in_work' )
        }
        if ( this.status == 10 ) {
            this.state.push( 'remake' )
        }
        this.updateElementStatus()
    } else { // для елемента заказа
        var d = data, self = this;
        // console.log( '2  d.Status_id, Order.status[d.Status_id][\"Name\"]', d.Status_id, Order.status[d.Status_id]["Name"] );
        waitProp( function () {
            if ( self.OrderList[d['Order_id_item']].CookingTracker === 0 && d.Status_id < 9 ) {
                d.Status_id = 8;
                d.Finished = true;
            }
            self.OrderList[d.Order_id_item].status = d.Status_id;
            self.OrderList[d.Order_id_item].statusT = Order.status[d.Status_id]["Name"];
            // if ( $( '#description_order:visible' ).length !== 0 && document.title.split( '#' )[1] == data.Status_id ) {
                // wait( 'setStatus' + this.ID, function () {
                try {
                    self.updateStatusForDescription();
                } catch ( e ) {
                }
                // }, 100 )
            // }
        }, function () {
            return self.OrderList
        }, 300, 10 )
    }
    // console.groupEnd();
};
Order.prototype.addNameCustomer = function ( data ) {
    this.NameCustomer = data.NameCustomer;
    var ID = this.ID, NameCustomer = this.NameCustomer;
    waitProp( function () {
        document.querySelector( '#state_' + ID + ' .name' ).innerHTML = NameCustomer
    }, function () {
        return document.querySelector( '#state_' + ID + ' .name' );
    }, 500, 10 );
};

Order.prototype.setupTimer = function () {
    this.sel = $( '#time_' + this.ID );
    var z = this.status;
    if ( z === 1 ) {
        this.sel.html( Page.timeReplace( this.TimeDelivery ) );// TEST
        return;
    } else if ( z === 15 || z === 16 || z === 11 ) {
        var t2 = this.time;
        this.sel.html( t2[0] + '-' + t2[1] + '-' + t2[2] + ' ' + t2[3] + ':' + t2[4] );// TEST
        return;
    }
    var now = new Date() // гггг, м, дд // получаем текущую дату.
        , t = this.time, self = this, late = true, time_out = true, d, h, m, s;
    now.setFullYear( t[0], +t[1] - 1, t[2] ); // выставляем дату
    now.setHours( t[3], t[4], t[5] ); // выставляем время заказа
    function div( val, by ) { // для деления, возвращает целое число.
        return (val - val % by) / by;
    }

    this.timer = function () {
        s = (new Date()) - now;
        s = div( s, 1000 );

        h = div( s, 3600 );
        s -= h * 3600;

        m = div( s, 60 );
        s -= m * 60;

        // d = div( s, 24);
        // s -= d * 24;
        if ( m > 14 || h > 0 || d > 0 ) {
            if ( late && !~self.state.indexOf( 'late' ) ) {
                self.state.push( 'late' );
                self.updateElementStatus();
                late = false;
            }
            if ( time_out && (m > 29 || h > 0 || d > 0) ) {
                if ( time_out && !~self.state.indexOf( 'time_out' ) ) {
                    self.state.push( 'time_out' );
                    self.updateElementStatus();
                    time_out = false;
                }
            }
        }
        self.sel.html(
            ((h != 0) ? ((h < 10 ? '0' + h : h) + ':') : '' )
            + (m < 10 ? '0' + m : m) + ':'
            + (s < 10 ? '0' + s : s) );
        setTimeout( self.timer, /*(self.sel.is( ':visible' ) ?*/ 1000 /*: 5000)*/ );
    };
    this.timer();
};
Order.prototype.makeOrderElement = function () {
    this.orderElement =
        '<li data-id="' + this.ID + '" id="ord_' + this.ID + '" class="orders_li ord"><a id="state_' + this.ID +
        '" class="' + this.state.join( ' ' ) + '" ><p class="name">'
        + (this.NameCustomer || '') + '</p><p class="number">#' + this.ID + '</p><p class="status">' + this.statusT + '</p><p id="time_' + this.ID +
        '"></p><i class="fa fa-rotate-right"></i><i class="download"></i><i class="upload"></i><i class="alarm"></i></a></li>';
};
Order.prototype.deleteOrder = function ( full ) {
    // без full удаляется только елемент на странице.
    $( '#ord_' + this.ID ).remove();
    if ( !full ) { // если удалять много то данные действия можно пропустить. но выполнить их для всех.
        var index = Cassir.sortedOrders.indexOf( this.ID );
        Cassir.sortedOrders.splice( index, 1 ); // удаляем из сортированного списка
        delete Order.list[this.id];
        Cassir.showBtnFlipping();
        Cassir.showEmptyElem();
        Cassir.updateDisplay(); // отображаем нужную страницу.
    }
};
Order.prototype.appendInPage = function () {
    this.makeOrderElement();
    Order.$orderFeeld.append( this.orderElement );
    this.setupTimer();
};
Order.prototype.addElement = function () {
    // добавление в готовую страницу в соотвенрствии с очередью.
    this.makeOrderElement();
    var index = Cassir.sortedOrders.indexOf( this.ID );
    $( '#ord_' + Cassir.sortedOrders[index - 1] ).after( this.orderElement ).parents( 'div' );
};

Order.prototype.updateElementStatus = function () {
    var selector = 'state_' + this.ID;
    try {
        document.getElementById( selector ).className = this.state.join( ' ' );
    } catch ( e ) {
    }
    try {
        document.querySelector( selector + ' .status' ).innerHTML = this.statusT
    } catch ( e ) {
    }
};

Cassir.showEmptyElem = function () {
    // добавляет пустые ячейки на страницу. или удаляет их.
    if ( document.getElementsByClassName( 'orders_li empty' ).length > 19 ) {
        var em = 20 - document.querySelectorAll( '.orders_li:not(.empty)' ).length % 20;
        $( '.orders_li.empty:gt(' + (+em - 1) + ')' ).remove();
    } else {
        var emptyPos = (20 - document.getElementsByClassName( 'orders_li' ).length % 20), count = 0;
        if ( emptyPos < 20 ) {
            while ( count < emptyPos ) {
                Order.$orderFeeld.append( Cassir.elem.empty );
                count++;
            }
            if ( document.getElementsByClassName( 'orders_li' ).length < 21 ) {
                // скрываем пустые елементы
                $( '.orders_li.empty' ).css( 'display', '' );
            }
        }
    }
};
Cassir.timeOut = {};
Cassir.showOrders = function ( state ) {
    // console.group( 'showOrders ( ', state, ' )' );
    state = state || 0;
    waitProp( function () {
            var i;
            Cassir.sortOrders();
            document.getElementById( 'order_block' ).innerHTML = '';
            Cassir.flippIndex = 0;
            // var len = Cassir.sortedOrders.length;
            for ( i in Cassir.sortedOrders ) {
                i = Order.list[Cassir.sortedOrders[i]]; // !!!!!!!!!!!!
                if ( i.status !== state && !(state === 0 || state === 999) ) {
                    // console.log( 'continue', i.status, state );
                    continue;
                }
                if ( ((state === 0) &&
                    ( i.status === 15 || i.status === 16 || i.status === 11 /*отменён, отменён, доставлен */
                    || i.status === 1    /* предзаказ*/
                    || i.status === 10     /*доставляется*/
                    || i.status === 13))   /*Заказ не забрали*/
                    || ((state === 999) && !( i.status === 15 || i.status === 16 || i.status === 11 /*отменён, отменён, доставлен */)) ) {

                    // console.log( 'continue2', i.status, state );
                    continue;
                }
                i.appendInPage();
            }
            // console.log( 'after' );
            var $orderInPage = $( '.orders_li:gt(18)' );
            Cassir.showBtnFlipping();
            if ( $orderInPage.length !== 0 ) {
                $orderInPage.css( 'display', 'none' );
                $( '.orders_li:lt(20)' ).css( 'display', '' );
            }
            Cassir.showEmptyElem();
            document.title = 'Заказы';
        }, function () {
            var i, ii;
            for ( i in Order.list ) {
                ii = Order.list[i];
                if ( !ii.status ) {
                    return false;
                }
            }
            return true;
        }, 300, 5  //////////////////////////
        , function () {
            var i, ii;
            for ( i in Order.list ) {
                ii = Order.list[i];
                if ( !ii.status ) {
                    ii.status = 2;
                    ii.statusT = 'Неопределенно';
                    Cassir.showOrders( state );
                }
            }
        }
    );

    // console.groupEnd();
};
Cassir.stopTimer = function () {
    for ( var i in Order.list ) {
        if ( Order.list[i].hasOwnProperty( 'timer' ) ) {
            delete Order.list[i].timer
        }
    }
};


$( document ).on( 'dblclick', '#logout', function () {
    MSG.close.session();
    document.location.href = AUTH_URL;
} );

$( document ).on( 'click', '#new_order', function () {
    Page.show.Carts();
    Page.show.makeOrder();
} );
// $( document ).on( 'click', '#btn_take_away', function () {
//     Page.show.Carts();
//     $( '#new_order_route' ).modal( 'hide' );
// } );
// $( document ).on( 'click', '#btn_preorder', function () {
//     Page.show.Operator();
//     $( '#new_order_route' ).modal( 'hide' );
// } );

// переключалка онлайн оффлайн
$( document ).on( 'click', '#mode_tel', function () {
    var elem = $( this );
    if ( elem.hasClass( 'fa-toggle-on' ) ) {
        elem.removeClass( 'fa-toggle-on' ).addClass( 'fa-toggle-off' )
    } else {
        elem.removeClass( 'fa-toggle-off' ).addClass( 'fa-toggle-on' )
    }
} );

