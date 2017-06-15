// TODO: подсчёт заказов на кнопках делать через поиск '.orders_li.ord'.length
// TODO: поиск по тлелефону заказов
// TODO: сделать постраничную навигацию без привязки к колличеству елементов на странице

// TODO: при обновлении страницы открывать туже страницу
function Cassir() {
}
Cassir.elem = {
    nextBtn: '<li class="orders_li btn next_page" style="height: calc( 25% - 1px); display: none ;background-color: #006dcc"><a class="orders">Следующая</a></li>',
    prevBtn: '<li class="orders_li btn prev_page" style="height: calc( 25% - 1px); display: none ;background-color: #006dcc"><a class="orders">Предыдущая</a></li>',
    empty: '<li class="orders_li empty" style="display: none"><a class="orders"></a></li>'
};


var ELEM_ON_PAGE = 20
    , e_changeOrdersPage = new Events( { timeOut: 100 } )
    , $btn = $( '.orders_li.btn' )
;
observer.subscribe( e_changeOrdersPage, function () {
    $( '.orders_li.empty' ).remove();
    $( '.orders_li.btn' ).remove();
    Cassir.showBtnFlipping();
    Cassir.showEmptyElem();
    Cassir.showPage();
} );

Cassir.flippPage = 0;
Cassir.showBtnFlipping = function ( po, recursion ) {
    po = po || (ELEM_ON_PAGE - 1);
    if ( !recursion ) {
        $btn.remove();
    }
    if ( $( '.orders_li:gt(' + (po) + ')' ).length !== 0 ) {
        $( '.orders_li:eq(' + po + ')' ).before( Cassir.elem.nextBtn ).before( Cassir.elem.prevBtn );
        if ( $( '.orders_li:gt(' + (po + ELEM_ON_PAGE) + ')' ).length !== 0 ) {
            Cassir.showBtnFlipping( po + ELEM_ON_PAGE, true ); // рекурсия тут!!!
        }
    }
};
Cassir.showPage = function () {
    var pageCount = Math.ceil( document.querySelectorAll( '.orders_li' ).length / ELEM_ON_PAGE );
    if ( Cassir.flippPage >= pageCount ) {
        Cassir.flippPage = pageCount - 1;
    }
    if ( Cassir.flippPage < 0 ) {
        Cassir.flippPage = 0;
    }
    $( '.orders_li' ).css( 'display', 'none' );
    var eq = Cassir.flippPage * ELEM_ON_PAGE
        , gt = eq === 0 ? eq : eq - 1
        , lt = eq === 0 ? ELEM_ON_PAGE - 1 : ELEM_ON_PAGE
        , sel = '.orders_li:eq(' + eq + '), .orders_li:gt(' + gt + '):lt(' + (lt) + ')';
    $( sel ).css( 'display', '' );
};
$( 'body' ).on( 'click', '.next_page', function () {
    Cassir.flippPage++;
    Cassir.showPage();
} ).on( 'click', '.prev_page', function () {
    Cassir.flippPage--;
    Cassir.showPage();
} );
// делаем все елементы видимыми -> скрываем не нужные
// -> делаем листалки игнорируя скрытые -> оставляем только первые 20 елементов

// : V сделать отображение даты начала готовки.
// : V время заказа
function Order( data ) {
    var d, t;
    if ( typeof data === 'object' ) {
        for ( var i in data ) {
            this[i] = data[i];
        }
    }
    d = this.DatePreOrderCook.split( 'Z' )[0].split( 'T' );
    t = d[1];
    d = d[0];
    this.DatePreOrderCook = d.concat( t );
    this.time = Page.timeToArray( this.Order_time );
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

    setTimeout( MSG.request.customer, 1000, this.ID, function ( data ) {
        if ( Order.list[data["Order_id"]] ) {
            Order.list[data.Order_id].addNameCustomer( data );
        }
    } );
}
Order.$orderFeeld = $( '#order_block' );
Order.list = {};
Order.prototype.addStatus = function ( data ) {
    if ( data.Order_id_item === 0 ) { // для всего заказа
        this.status = data.Status_id || 2;
        this.statusT = STATUS[this.status].Name;
        if ( this.status == 4 ) {
            this.state.push( 'in_work' )
        }
        if ( this.status == 10 ) {
            this.state.push( 'remake' )
        }
        this.showOrder();
    } else { // для елемента заказа
        var d = data;
        if ( this.OrderList && this.OrderList[d.Order_id_item] ) {
            if ( this.OrderList[d.Order_id_item].CookingTracker === 0 && d.Status_id < 9 ) {
                d.Status_id = 8;
                d.Finished = true;
            }
            this.OrderList[d.Order_id_item].status = d.Status_id;
            this.OrderList[d.Order_id_item].statusT = STATUS[d.Status_id].Name;
            try {
                this.updateStatusForDescription();
            } catch ( e ) {
            }
        }
    }
};

Order.prototype.showOrder = function () {
    var state = +document.querySelector( '#cassir_tab li.active' ).dataset.status;
    if ( ((state === 0) &&
        (  this.status === 11 || this.status === 15 || this.status === 16 /* доставлен, отменён, отменён */
        || this.status === 1    /* предзаказ*/
        || this.status === 10     /*доставляется*/
        || this.status === 13))   /*Заказ не забрали*/
        || ((state === 999) && !( this.status === 11 || this.status === 15 || this.status === 16 /* доставлен, отменён, отменён */)) ) {
        this.deleteOrder( true );
        e_changeOrdersPage.rise();
        return;
    }
    if ( this.status !== state && !(state === 0 || state === 999) ) {
        this.deleteOrder( true );
        e_changeOrdersPage.rise();
        return;
    }
    this.addOrder();
};
Order.prototype.addOrder = function () {
    var elem = document.querySelectorAll( '.orders_li.ord' )
        , len = elem.length, i, y, x;
    if ( document.querySelector( '#ord_' + this.ID ) ) {
        this.updateElementStatus();
        clearInterval( this.timerWorck );
        this.setupTimer();
    } else {
        this.makeOrderElement();
        if ( len < 2 ) {
            Order.$orderFeeld.append( this.orderElement );
        } else {
            for ( i = 0; i < len; i++ ) {
                y = +elem[i].dataset.id;
                if ( y > this.ID ) {
                    $( '#ord_' + y ).before( this.orderElement );
                    y = false;
                    break;
                }
                x = y;
            }
            if ( y ) {
                $( '#ord_' + y ).after( this.orderElement );
            }
        }
        this.setupTimer();
        e_changeOrdersPage.rise();
    }
};

Order.showOrders = function () {
    var i, ii;
    Cassir.flippIndex = 0;
    Order.$orderFeeld.empty();
    for ( i in Order.list ) {
        ii = Order.list[i];
        ii.showOrder();
    }
};

Order.prototype.addNameCustomer = function ( data ) {
    this.NameCustomer = data.NameCustomer;
    var ID = this.ID, NameCustomer = this.NameCustomer;
    waitProp( function () {
        document.querySelector( '#state_' + ID + ' .name' ).innerHTML = NameCustomer
    }, function () {
        return document.querySelector( '#state_' + ID + ' .name' );
    }, 2000, 3 );

    this.Custumer = data;
};

Order.prototype.setupTimer = function () {
    if ( this.timerWorck ) {
        clearInterval( this.timerWorck )
    }
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

    this.timer = function () {
        s = (new Date()) - now;
        s = division( s, 1000 );

        h = division( s, 3600 );
        s -= h * 3600;

        m = division( s, 60 );
        s -= m * 60;

        // d = division( s, 24);
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
    };
    this.timer();
    this.timerWorck = setInterval( self.timer, /*(self.sel.is( ':visible' ) ?*/ 1000 /*: 5000)*/ );
};
if ( TEST ) {

}
Order.prototype.makeOrderElement = function () {
    this.orderElement =
        '<li data-id="' + this.ID + '" id="ord_' + this.ID + '" class="orders_li ord"><a id="state_' + this.ID +
        '" class="' + this.state.join( ' ' ) + '" ><p class="name">'
        + (this.NameCustomer || '') + '</p><p class="number">#' + this.ID + '</p><p class="status">' + (this.statusT || '') + '</p><p id="time_' + this.ID +
        '"></p><i class="fa fa-rotate-right"></i><i class="download"></i><i class="upload"></i><i class="alarm"></i></a></li>';
};
Order.prototype.deleteOrder = function ( full ) {
    // без full удаляется только елемент на странице.
    $( '#ord_' + this.ID ).remove();
    clearInterval( this.timerWorck );
    if ( !full ) { // если удалять много то данные действия можно пропустить. но выполнить их для всех.
        delete Order.list[this.id];
        Cassir.showBtnFlipping();
        Cassir.showEmptyElem();
    }
};
Order.prototype.appendInPage = function () {
    this.makeOrderElement();
    Order.$orderFeeld.append( this.orderElement );
    this.setupTimer();
};

Order.prototype.updateElementStatus = function () {
    var selector = '#state_' + this.ID;
    $( selector ).removeClass().addClass( this.state.join( ' ' ) );
    $( selector + ' .status' ).html( this.statusT );
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

Cassir.stopTimer = function () {
    for ( var i in Order.list ) {
        if ( Order.list[i].hasOwnProperty( 'timer' ) ) {
            delete Order.list[i].timer;
            clearInterval( Order.list[i].timerWorck );
        }
    }
};


////////--------| SEARCH |----------------------------------------------------------
Order.find = function ( val ) {
    val += '';
    var i, ii, _id, result = [];
    for ( i in Order.list ) {
        ii = Order.list[i];
        _id = ii.ID + '';
        if ( (~_id.indexOf( val ) || _id == val)
            || (ii.Custumer && (~ii.Custumer.Phone.indexOf( val ) || ii.Custumer.Phone == val)) ) {
            result.push( i );
        }
    }
    return (result.length === 0 ? null : result);
};

var $search = $( '#search' );
$( '#cassir .fa.fa-search' ).click( function ( event ) {
    if ( $search.is( ':visible' ) ) {
        $search.hide();
    } else {
        $search.show().css( 'left', event.clientX - 180 ).css( 'top', event.clientY - 15 );
        $( '#search-input' ).focus();
        var x = function () {
            $search.hide();
            $( document ).off( 'click', x )
        };
        $( document ).on( 'click', x );
    }
    return false
} );
$( document ).on( 'keyup', '#search-input', function () {
    var result = Order.find( this.value )
        , i, ii, ord, tel, ad, id, index, elem = '';
    if ( result ) {
        result = result.splice( 0, 20 );
        index = result.indexOf( this.value );
        if ( ~index ) {
            id = result.splice( index, 1 );
            result.unshift( id );
        }
    }
    for ( i in result ) {
        ii = result[i];
        ord = Order.list[ii];
        if ( ord.Custumer ) {
            tel = ord.Custumer.Phone === ' ' ? '' : ord.Custumer.Phone;
        } else {
            tel = '';
        }
        ad = ord.address();
        ad = ad === '' ? '' : '<div class="blue_txt address">' + ad + '</div>';
        elem += '<div data-id="' + ii + '" class="result-search">#<span>' + ii + '</span> тел:<span class="telephone">'
            + ord.Custumer.Phone + '</span>'
            + ad + '</div>';
    }
    document.getElementById( 'result-search' ).innerHTML = elem;
} );
$( '#search-input' ).click( '#search-input', function () {
    this.value = '';
    document.getElementById( 'result-search' ).innerHTML = '';
    return false;
} );
//--------------\ SEARCH |----------------------------------------------------------

$( document ).on( 'click', '#cassir_tab li[data-status]', function () {
    Order.showOrders();
} );

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

Order.logS = function ( ID ) {
    var l = {}, i;
    // запрашиваем статусы
    MSG.request.allStatusOrder( ID, function ( data ) {
        data.status = STATUS[data.Status_id].Name;
        data.Time = Page.timeReplace( data.Time ).slice( 5, 19 );
        if ( data.UserHash === "system" ) {
            data.SurName = 'system'
        }
        l[data.ID] = data;
    }, function () {
        // по окончании запрашиваем персонал
        MSG.request.personalByOrder( ID, function ( data ) {
            for ( i in l ) {
                if ( l[i].UserHash === data.UserHash ) {
                    l[i].RoleName = data.RoleName;
                    l[i].SurName = data.SurName;
                    l[i].FirstName = data.FirstName;
                }
            }
        }, function () {  // после запрашиваем состав заказа
            MSG.request.orderList( ID, function ( data ) {
                for ( i in l ) {
                    if ( l[i].Order_id_item === data.ID_item ) {
                        l[i].product = data.PriceName;
                    }
                }
            }, function () {
                console.group( '-----------Order #' + ID );
                console.table( l, ['Order_id_item', 'product', 'RoleName', 'SurName', 'FirstName', "status", "Time"] );
                console.groupEnd();
            } )
        } );
    } );
};
// Order.logS( 935 );

// Order.logO = function () {
//     var l = {}, i;
//     MSG.request.orderByDate( Page.timeBeginDay(), Page.time(),9999, function ( data ) {
//         data.Order_time = Page.timeReplace( data.Order_time ).slice( 5, 19 );
//         data.SideOrder = [data.SideOrder];
//         l[data.ID] = data;
//         MSG.request.orderStatus(data.ID, 0, function ( data ) {
//             l[data.ID].status = STATUS[data.Status_id]
//         })
//     }, function () {
//         console.table(l, ['NameStorage', 'SideOrder', 'PriceWithDiscount' , 'Type', 'status', 'Order_time'])
//     } )
// };
// Order.logO();