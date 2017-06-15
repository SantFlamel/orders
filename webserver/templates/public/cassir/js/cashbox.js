// : V изятия внесения нужен коментарий.
// : V сумма без скидки
// : V сдача
// : V сумма в кассе после оплаты без учёта сдачи
// : V сумма внесений не верна. учитывается по карте
// : V сумма в кассе не корректна
// : V сумма за смену сумма оплат по заказам
// : V сумма за смену сумма оплат по заказам
////////--------| Cashbox |----------------------------------------------------------
// : V не считается количество заказов.
// : V поправить ширину
var WITHDRAWAL = 'Изъятие' // изятие
    , DEPOSIT = 'Внесение' // внесение
    , PAYMENT = 'Оплата' // оплата
    , RETURN = 'Возврат'
    ;

CashBox = { ChangeEmployee: [] };
CashBox.count = {
    canceled: function () {
        var count = 0, i, ii;
        for ( i in Order.list ) {
            ii = Order.list[i];
            if ( ii.status === 15 || ii.status === 16 ) {
                count++;
            }
        }
        return count;
    }, return: function () {
        var sum = 0, i, ii;
        for ( i in Operation.list ) {
            ii = Operation.list[i];
            if ( ii.Deposit < 0 && ii.Order_id ) {
                sum += ii.Deposit;
            }
        }
        return sum;
    }, adding: function () {
        var sum = 0, i, ii;
        for ( i in Operation.list ) {
            ii = Operation.list[i];
            if ( ii.TypePayments == 1 && ii.Deposit > 0 ) {
                sum += ii.Deposit;
            }
        }
        return sum;
    }, ejecting: function () {
        var sum = 0, i, ii;
        for ( i in Operation.list ) {
            ii = Operation.list[i];
            if ( !ii.Order_id && ii.Deposit < 0 ) {
                sum += ii.Deposit;
            }
        }
        return sum;
    }, card: function () {
        var sum = 0, i, ii;
        for ( i in Operation.list ) {
            ii = Operation.list[i];
            if ( ii.TypePayments === 2 ) {
                sum += ii.Deposit
            }
        }
        return sum;
    }/*, ShortChange: function () {
     var sum = 0, i, ii;
     for ( i in Operation.list ) {
     ii = Operation.list[i];
     if ( ii.ShortChange != null && ii.ShortChange > 0 ) {
     sum += +ii.ShortChange
     }
     }
     return sum;
     }*/
    , cashInCashBox: function () {
        return this.adding() + this.ejecting() + this.return() + CashBox.InCachBox;
    }, cashOnDay: function () {
        var sum = 0, i, ii;
        for ( i in Operation.list ) {
            ii = Operation.list[i];
            if ( ii.Order_id ) {
                sum += ii.Deposit
            }
        }
        return sum;
    }
};

CashBox.update = function () {
    var i, shift = {
        countOrders: length( Order.list ), countCanceled: CashBox.count.canceled()
        , countDeposit: CashBox.count.adding(), countEjecting: CashBox.count.ejecting()
        , cashFromCards: CashBox.count.card(), cashOnDay: CashBox.count.cashOnDay()
        , cashInCashBox: CashBox.count.cashInCashBox()
    };
    for ( i in shift ) {
        document.getElementById( i ).innerHTML = shift[i] || 0;
    }
};
//-----------------------------------------------------------------------

////////--------| СМЕНЫ КАССИРА |----------------------------------------------------------
CashBox.getSumInCashbox = function () {
    MSG.request.ChangeEmployeeByOrgHashUserHash( true, 1, function ( data ) {
        CashBox.InCachBox = data.Sum_in_cashbox;
        CashBox.update();
    } ); // запрашиваем последнюю закрытую сессию
    MSG.request.ChangeEmployeeByOrgHashUserHash( false, 1, function ( data ) {
        CashBox.ChangeEmployee.push( data )
    }, CashBox.checkChangeEmployee )
};

CashBox.closeChangeEmployee = function () {
    CashBox.update();
    var sum_in_cashbox = document.getElementById( 'cashInCashBox' ).innerHTML
        , non_cash_end_day = document.getElementById( 'cashFromCards' ).innerHTML
        , cash_end_day = document.getElementById( 'countDeposit' ).innerHTML
    ;
    MSG.close.ChangeEmployee( +sum_in_cashbox, +non_cash_end_day, +cash_end_day );
    MSG.request.dayOverPrintCheck();
    delete SESSION_INFO.ChangeEmployee;
    CashBox.reset();
    wait( 'CashBox.closeChangeEmployee', function () {
        CashBox.getSumInCashbox();
    }, 300 );
};
CashBox.checkChangeEmployee = function () {
    if ( CashBox.ChangeEmployee.length === 0 ) {
        document.getElementById( 'change_employee' ).innerHTML = OPEN_CHANGE_EMPLOYEE;
        document.getElementById( 'close_day_cashier' ).onclick = function () {
            MSG.set.ChangeEmployee();
        };
        document.getElementById( 'shiftNumber' ).innerHTML = '-';
        document.querySelector( '#close-shift p' ).innerHTML = 'Вы действительно хотите открыть смену?';
    } else {
        SESSION_INFO.ChangeEmployee = CashBox.ChangeEmployee.pop();
        document.getElementById( 'change_employee' ).innerHTML = CLOSE_CHANGE_EMPLOYEE;
        document.getElementById( 'shiftNumber' ).innerHTML = SESSION_INFO.ChangeEmployee.ID;
        document.getElementById( 'openedTime' ).innerHTML = Page.timeReplace( SESSION_INFO.ChangeEmployee.Date_begin ).slice( 0, 16 );
        document.getElementById( 'close_day_cashier' ).onclick = function () {
            CashBox.closeChangeEmployee();
        };
        document.querySelector( '#close-shift p' ).innerHTML = 'Вы действительно хотите закрыть смену?';
    }
    CashBox.update();
};
CashBox.reset = function () {
    Operation.list = {};
    document.getElementById( 'operations' ).innerHTML = '';
};
//--------------\ СМЕНЫ КАССИРА |----------------------------------------------------------


// TODO: повторная печать чека
// убранно множественная загрузка из куков
function Operation( TypePayments, Deposit, Cause, /*name,*/ Order_id, ShortChange ) {
    if ( typeof TypePayments == "object" ) {
        if ( !(this instanceof Operation) ) {
            return new Operation( TypePayments );
        }
        var i;
        for ( i in TypePayments ) {
            this[i] = TypePayments[i];
        }
        Operation.list[TypePayments.ID] = this;
        if ( TypePayments.Deposit === 0 ) {
            return;
        }
        this.showOperation();
        wait( 'CashBox.update', CashBox.update );
    } else {
        CashBox.checkChange();
        this.Change_employee_id = SESSION_INFO.ChangeEmployee.ID;
        this.RoleName = SESSION_INFO.RoleName;
        this.Deposit = Deposit; //
        this.First_sure_name = SESSION_INFO.FirstName + ' ' + SESSION_INFO.SurName;
        this.TypeOperation = +this.Deposit > 0; // оплата payment, внесение deposit, изятие withdrawal.
        this.TypePayments = +TypePayments; // картой, наличными.
        this.Cause = Cause || ''; //
        this.Order_id = +Order_id || null;
        if ( ShortChange > 0 ) {
            this.ShortChange = +ShortChange || null;
        } else {
            this.ShortChange = null;
        }
        i = Operation.tempList.push( this );
        MSG.set.cashBoxOperation( this, i );
    }
}
Operation.list = {};
Operation.tempList = [];


Operation.prototype.makeElement = function () {
    // console.log( 'MAKE OPERATION this', this );
    var cl, type
        , time = Page.timeReplace( this.TimeOperation )
    ;
    if ( this.Deposit > 0 ) {
        if ( this.Order_id ) {
            cl = list.payment;
            type = PAYMENT;
        } else {
            cl = list.deposit;
            type = DEPOSIT;
        }
    } else {
        if ( this.Order_id ) {
            cl = list.return;
            type = RETURN;
        } else {
            cl = list.withdrawal;
            type = WITHDRAWAL;
        }
    }
    this.element = '<tr data-id="' + this.ID + '" class="operation ' + cl + ' ' + this.TypePayments + '">\
            <td class="table-cashbox__id">#' + this.ID + '</td>\
            <td class="table-cashbox__data">' + time + '</td>\
            <td class="table-cashbox__Type-operation">' + type + '</td>\
            <td class="table-cashbox__Type-money">' + TYPE_PAYMENTS[this.TypePayments] + '</td>\
            <td class="table-cashbox__amount-money">' + this.Deposit + ' р.</td>\
            <td class="table-cashbox__name-client">' + (this.name || '') + '</td>\
            <td class="cashbox_note">' + this.Cause + '</td>\
        </tr>';
};
Operation.prototype.showOperation = function () {
    this.makeElement();
    document.getElementById( 'operations' ).innerHTML += this.element;
    delete this.element;
    wait( 'showOperation', function () {
        document.querySelector( '.nav-filter__list > .nav-filter__item.nav-filter__item--active' ).dispatchEvent( new Event( "click" ) );
    } );
};


////////--------| Check |----------------------------------------------------------
Operation.prototype.rePrintCheck = function () {
    MSG.request.rePrintCheck( this.ID );
};
//--------------\ Check |----------------------------------------------------------


////////--------| Actions |----------------------------------------------------------
CashBox.action = function ( self, action ) {
    // self - нажатая кнопка ОПЛАТИТЬ
    // dataset.call - это данные установленные на кнопку при вызове модалки
    var TypePayments, TypeOperation, Deposit, Cause, call, ord, input, ShortChange, price;
    action = action || 'оплата';
    if ( action === 'оплата' ) {
        TypePayments = document.querySelector( '.active.Type_pay' ).dataset.pay_met;
        call = self.dataset.call;
        // определяем оплата заказа или нет!!!
        if ( (call !== 'cashbox') ) {
            ord = Order.list[call];
            Cause = "Оплата заказа #" + call;
            price = ord.PriceWithDiscount;
        } else {
            price = document.getElementById( 'price_p_c_input' ).value || 0;
        }

        switch ( TypePayments.toLowerCase() ) {
            case ('cash'):
                input = document.getElementById( 'cash_input_modal' );
                if ( price > +input.value ) {
                    ShortChange = 0;
                    Deposit = +input.value;
                } else {
                    Deposit = +price;
                    ShortChange = +input.value - price;
                }
                TypeOperation = PAYMENT;
                TypePayments = 1;
                break;
            case ('card'):
                input = document.getElementById( 'card_input_modal' );
                Deposit = +input.value;
                TypeOperation = PAYMENT;
                TypePayments = 2;
                break;
        }
    } else if ( action === DEPOSIT ) {
        input = document.getElementById( 'cash_deposit' );
        Deposit = +input.value;
        TypePayments = 1;
        Cause = document.getElementById( 'note_deposit' ).value
    } else if ( action === WITHDRAWAL ) {
        input = document.getElementById( 'cash_withdrawal' );
        Deposit = +input.value * -1;
        TypePayments = 1;
        Cause = document.getElementById( 'note_withdrawal' ).value
    }
    if ( isNaN( Deposit ) ) {
        input.value = '';
        input.placeholder = 'Введите сумму';
        return;
    }
    new Operation( TypePayments, Deposit, Cause, call, ShortChange );
    $( '.modal' ).modal( 'hide' );
};
//--------------\ Actions |----------------------------------------------------------


BTN = {};
BTN.disable = {
    all: function () {
        for ( var i in this ) if ( i !== 'all' ) {
            this[i]();
        }
    }, print: function () {
        $( "#check_print" ).addClass( "btn-disabled" ).attr( 'disabled', 1 );
    }, returnPrint: function () {
        $( "#check_print_return" ).addClass( "btn-disabled" ).removeClass( "btn-red" ).attr( 'disabled', 1 );
    }
};
BTN.enable = {
    all: function () {
        for ( var i in this ) if ( i !== 'all' ) {
            this[i]();
        }
    }, print: function () {
        $( "#check_print" ).removeClass( "btn-disabled" ).removeAttr( 'disabled' );
    }, returnPrint: function () {
        $( "#check_print_return" ).removeClass( "btn-disabled" ).addClass( "btn-red" ).removeAttr( 'disabled' );
    }
};


////////--------|  |----------------------------------------------------------
////////--------|  |----------------------------------------------------------
$( ".table-cashbox" ).on( "click", ".table-cashbox__payment:not(.printed_check.printed_return_check)", function () {
    var x = $( '.table-cashbox__payment--active' ), $this = $( this ), classSelect = "table-cashbox__payment--active";
    if ( x.length !== 1 || !$this.hasClass( classSelect ) ) {
        x.removeClass( classSelect );
    }
    $this.toggleClass( classSelect );

    if ( document.getElementsByClassName( 'table-cashbox__payment--active' ).length === 1 ) {

        if ( !$this.hasClass( 'printed_check' ) ) {
            BTN.enable.print();
        } else {
            BTN.disable.print();
        }

        if ( $this.hasClass( '1' ) ) {
            BTN.enable.returnPrint();
        } else {
            BTN.disable.returnPrint();
        }
    } else {
        if ( !$this.hasClass( 'printed_check' ) ) {
            BTN.disable.print();
        }
        if ( $this.hasClass( '1' ) ) {
            BTN.disable.returnPrint();
        }
    }
} );


////////--------| Обработка_модалек |----------------------------------------------------------
//  ////////--------| Вызов_модалек |----------------------------------------------------------
$( document ).on( 'click', '#btn_deposit', function () { // "Внесение" кнопка в кассе
    CashBox.checkChange();
    $( '#nal-block input' ).val( 0 );
    document.getElementById( 'btn_pay' ).dataset.call = 'cashbox';
    document.getElementById( 'pay_check' ).innerHTML =
        'К оплате: <input autocomplete="off" class="number" id="price_p_c_input" type="text"> руб.';
    CashBox.updateModalPaymentCash( this );
    CashBox.updateModalPaymentCard( this );
    // CashBox.updateModalPaymentBonus(this);
    CashBox.updateModalDeposit( this );
    // открываем вкладку оплата
    setTimeout( function () {
        $( '#modal_tabs li' ).css( 'display', 'none' );
        $( '#paymenttab' ).removeClass( 'in active' );
        $( '#introduct' ).addClass( 'in active' );
    }, 50 )
} );
$( document ).on( 'click', '#btn_withdrawal', function () { // "Изъятие" кнопка изятие
    CashBox.checkChange();
    CashBox.updateModalWithdrawal( this );
    document.getElementById( 'cash_withdrawal' ).value = ''
} );
$( document ).on( 'click', '#pay_order', function () { // "Оплата" в описании заказа
    CashBox.checkChange();
    document.getElementById( 'btn_pay' ).dataset.call = this.dataset.id_order;
    document.getElementById( 'pay_check' ).innerHTML = 'К оплате: <span id="price_p_c">-</span> руб.';
    CashBox.updateModalPaymentCash( this );
    CashBox.updateModalPaymentCard( this );
    // CashBox.updateModalPaymentBonus(this);
    CashBox.updateModalDeposit( this );
    $( '#modal_tabs li' ).css( 'display', 'none' );
} );
//  //--------------\ Вызов_модалек |----------------------------------------------------------


//  ////////--------| кнопки в модалке |----------------------------------------------------------
$( document ).on( 'click', '#withdraw', function () { // "изъять"
    CashBox.checkChange();
    CashBox.action( this, WITHDRAWAL );
} );
$( document ).on( 'click', '#modal_btn_deposit', function () { // "внести"
    CashBox.checkChange();
    CashBox.action( this, DEPOSIT );
} );
//  //--------------\ кнопки в модалке |----------------------------------------------------------


//  ////////--------| отображение_информации |----------------------------------------------------------
CashBox.updateModalWithdrawal = function ( self ) { // изъятие
    var now = CashBox.count.cashInCashBox(), ShortChange, el = document.getElementById( 'withdraw' );
    document.getElementById( 'in_cashbox_w' ).innerHTML = now;
    ShortChange = (now - +self.value) || now;
    if ( ShortChange < 0 ) {
        el.disabled = true;
        document.getElementById( 'in_cashbox_after_w' ).classList.add( 'red_txt' );
        el.classList.add( 'gray_txt' )
    } else {
        el.disabled = false;
        document.getElementById( 'in_cashbox_after_w' ).classList.remove( 'red_txt' );
        el.classList.remove( 'gray_txt' )
    }
    document.getElementById( 'in_cashbox_after_w' ).innerHTML = ShortChange;
};
CashBox.updateModalDeposit = function ( self ) { // внесение
    var now = CashBox.count.cashInCashBox();
    document.getElementById( 'in_cashbox_d' ).innerHTML = now;
    document.getElementById( 'in_cashbox_after_d' ).innerHTML = (now + +self.value) || now;
};
CashBox.updateModalPaymentCash = function () { // оплата наличными
    var self = document.getElementById( 'cash_input_modal' );
    var now = CashBox.count.cashInCashBox(), price, ShortChange,
        call = document.getElementById( 'btn_pay' ).dataset.call;
    if ( call !== 'cashbox' ) {
        price = Order.list[document.title.split( '#' )[1]].notPayment;
        document.getElementById( 'price_p_c' ).innerHTML = price;
        if ( price < 0 ) {
            document.getElementById( 'price_p_c' ).classList.add( 'red_txt' )
        } else {
            document.getElementById( 'price_p_c' ).classList.remove( 'red_txt' )
        }
    } else {
        price = document.getElementById( 'price_p_c_input' ).value || 0;
    }
    document.getElementById( 'in_cashbox_p_c' ).innerHTML = now; // в кассе до
    if ( price !== 0 ) {
        ShortChange = ((+self.value || 0) - (price)); // сдача
    }
    if ( ShortChange < 0 ) {
        ShortChange = 0;
        document.getElementById( 'change_p_c' ).classList.add( 'red_txt' )
    } else {
        document.getElementById( 'change_p_c' ).classList.remove( 'red_txt' )
    }
    document.getElementById( 'change_p_c' ).innerHTML = ShortChange || 0;
    document.getElementById( 'in_cashbox_after_p_c' ).innerHTML = (now + +self.value) - ShortChange || now; // в кассе после
};
CashBox.updateModalPaymentCard = function ( self ) { // оплата картой
    var price, ShortChange, call = document.getElementById( 'btn_pay' ).dataset.call;
    if ( call !== 'cashbox' ) {
        price = +document.getElementById( 'price_with_discount' ).innerHTML;
        document.getElementById( 'price_p_card' ).innerHTML = price;
    } else {
        document.getElementById( 'price_p_card' ).innerHTML = 0
    }
    ShortChange = ((price || 0) - (+self.value || 0));
    if ( ShortChange < 0 ) {
        document.getElementById( 'not_p_card' ).classList.add( 'red_txt' )
    } else {
        document.getElementById( 'not_p_card' ).classList.remove( 'red_txt' )
    }
    document.getElementById( 'not_p_card' ).innerHTML = ShortChange; // неоплаченно
};

// CashBox.updateModalPaymentBonus = function ( self ) { // оплата бонусами
//     var price, ShortChange
//         , call = document.getElementById( 'btn_pay' ).dataset.call;
//     if ( call !== 'cashbox' ) {
//         price = +document.getElementById( 'price_with_discount' ).innerHTML;
//         document.getElementById( 'price_p_b' ).innerHTML = price;
//     } else {
//         document.getElementById( 'price_p_b' ).innerHTML = 0
//     }
//     ShortChange = ((price || 0) - (+self.value || 0));
//     if ( ShortChange < 0 ) {
//         document.getElementById( 'not_p_card' ).classList.add( 'red_txt' )
//     } else {
//         document.getElementById( 'not_p_card' ).classList.remove( 'red_txt' )
//     }
//     document.getElementById( 'not_p_card' ).innerHTML = ShortChange; // неоплаченно
// };
//  //--------------\ отображение_информации |----------------------------------------------------------

CashBox.checkChange = function () {
    if ( !SESSION_INFO.ChangeEmployee ) {
        warning( 'Кассовая смена закрыта' );
        $( '.modal' ).modal( 'hide' );
        throw new Error( 'Кассовая смена закрыта.' );
    }
};

//  ////////--------| для_инпутов |----------------------------------------------------------
$( document ).on( 'keyup', '#cash_withdrawal', function () { // изъятие
    CashBox.updateModalWithdrawal( this );
} );
$( document ).on( 'keyup', '#cash_deposit', function () { // внесение
    CashBox.updateModalDeposit( this )
} );
$( document ).on( 'keyup', '#cash_input_modal, #price_p_c_input', function () { // оплата наличными
    CashBox.updateModalPaymentCash()
} );
$( document ).on( 'keyup', '#card_input_modal', function () { // оплата картой
    CashBox.updateModalPaymentCard( this )
} );
// $( document ).on( 'keyup', '#bonus_input_modal', function () { // оплата бонусами
//     CashBox.updateModalPaymentBonus( this )
// } );
//  //--------------\ для_инпутов |----------------------------------------------------------


//  ////////--------| print check |----------------------------------------------------------
//    ////////--------| Other |----------------------------------------------------------
CashBox.getIDActiveOperation = function () {
    return document.getElementsByClassName( 'table-cashbox__payment--active' )[0].dataset.id
};
CashBox.getCheckedButton = function ( name ) {
    var TypeOperation = document.getElementsByName( name );
    for ( var i in TypeOperation ) if ( TypeOperation[i].checked ) {
        return TypeOperation[i];
    }
};
//    //--------------\ Other |----------------------------------------------------------
$( document ).on( 'click', '#check_print', function () {
    var operation = Operation.list[CashBox.getIDActiveOperation()];
} );
$( document ).on( 'click', '#check_print_yes', function () { // повторная печать чека.
    var operation = Operation.list[CashBox.getIDActiveOperation()];
    operation.rePrintCheck();
} );

$( document ).on( 'click', '#check_print_return', function () {
    var operation = Operation.list[CashBox.getIDActiveOperation()];
} );
$( document ).on( 'click', '#print_return_check_no', function () {
    var operation = Operation.list[CashBox.getIDActiveOperation()];
} );
$( document ).on( 'click', '#print_return_check_yes', function () { // возврат /////////////////////
    var operation = Operation.list[CashBox.getIDActiveOperation()];
    if ( operation.TypePayments === 1 ) {
        new Operation( 1, (operation.Deposit * -1), 'Возврат', operation.Order_id )
    }
} );
//  //--------------\ print check |----------------------------------------------------------


////////--------| Избавление_от_касяков |----------------------------------------------------------
$( '#paymenttab a' ).on( 'click', function () {
    $( '#paymenttab input[type=radio]' ).removeAttr( 'checked' );
    $( this ).find( 'input[type=radio]' ).attr( 'checked', true );
} );
// для активации нужного
$( document ).on( 'click', '.btn-deposit', function () {
    $( '#introduction input' ).val( '' ); // очистка полей
    $( '#introduction .type_pay ,#introduction .type_act, #introduct' ).removeClass( 'active' );
    $( '#karta' ).attr( 'checked', false );
    $( '#radio_cash' ).attr( 'checked', true ).parent().parent().addClass( 'active' );
    $( '#karta-block' ).removeClass( 'active in' );
    $( '#nal-block' ).addClass( 'active in' );
    document.getElementById( 'paymenttab' ).classList.add( 'active' );
    document.getElementById( 'paymenttab' ).classList.add( 'in' );
    document.querySelector( '[data-pay_met="cash"]' ).classList.add( 'active' );
    document.getElementById( 'act_payment' ).classList.add( 'active' )
} );
//--------------\ Избавление_от_касяков |----------------------------------------------------------

//--------------\ Обработка_модалек |----------------------------------------------------------
// Переключатель для меню
$( ".nav-filter__list" ).on( "click", ".nav-filter__item", function () {
    $( ".nav-filter__list .nav-filter__item" ).removeClass( "nav-filter__item--active" ); //удаляем класс во всех вкладках
    $( this ).addClass( "nav-filter__item--active" ); //добавляем класс текущей (нажатой)
} );
//Вращение галочки в кнопке
$( document ).on( 'click', '.table-order__spoiler', function () {
    $( this ).find( "span.arr-up" ).toggleClass( "arr-down" );
} );
// Прячет/показывает вложеную таблицу
$( document ).on( 'click', '.table-order__spoiler', function () {
    $( this ).next().slideToggle( 1 );
} );
//--------------\ Cashbox |----------------------------------------------------------

////////--------| фильтр по типу операции |----------------------------------------------------------
var list = {
    payment: "table-cashbox__payment", return: "table-cashbox__return", withdrawal: "table-cashbox__withdrawal",
    deposit: "table-cashbox__deposit", delivery: "table-cashbox__delivery"
};
function sortItems( notIn ) {
    for ( var className in list ) {
        var arr = document.getElementsByClassName( list[className] );
        if ( list[className] == notIn ) {
            showItems( arr );
        } else {
            hiddenItems( arr );
        }
    }
}
function hiddenItems( arr ) {
    for ( var j = 0; j < arr.length; j++ ) {
        var el = arr[j];
        el.classList.add( "hidden" );
    }
}
function showItems( arr ) {
    for ( var j = 0; j < arr.length; j++ ) {
        var el = arr[j];
        el.classList.remove( "hidden" );
    }
}
document.getElementById( "all_operation" ).addEventListener( "click", function () {
    var arr;
    for ( var className in list ) if ( className !== 'delivery' ) {
        arr = document.getElementsByClassName( list[className] );
        showItems( arr );
    } else {
        arr = document.getElementsByClassName( list[className] );
        hiddenItems( arr );
    }
} );
document.getElementById( "payment" ).addEventListener( "click", function () {
    sortItems( "table-cashbox__payment" );
} );
document.getElementById( "return" ).addEventListener( "click", function () {
    sortItems( "table-cashbox__return" );
} );
document.getElementById( "withdrawal" ).addEventListener( "click", function () {
    sortItems( "table-cashbox__withdrawal" );
} );
document.getElementById( "deposit" ).addEventListener( "click", function () {
    sortItems( "table-cashbox__deposit" );
} );
document.getElementById( "delivery_tab" ).addEventListener( "click", function () {
    sortItems( "table-cashbox__delivery" );
} );
//--------------\ фильтр по типу операции |----------------------------------------------------------


/*////////--------| DESCRIPTION |----------------------------------------------------------
 После нажатия на кнопку "Касса", открывается окно кассовых операций, где в шапке панель
 переключения и строка поиска. Справа расположен свод информации о смене, где:
 Количество заказов - все заказы за смену, включая те заказы от которых отказались;
 Количество отказов - все отказы в ресторане за смену;
 Сумма внесений - все поступления в кассу, включая наличные и безналичные оплаты, размен и т.д.
 Сумма изъятий - сумма всех изъятий, включая отказы;
 Сумма по карте - все безналичные оплаты;
 Сумма в кассе - наличные деньги в кассе;
 Сумма за смену - все поступления от продаж, за вычетом отказов. Другие операции не учитываются.
 При нажатии на кнопку "Закрыть смену" осуществляется закрытие смены, дальнейшее изменение
 заказов в закрытой смене невозможно. Закрыть смену нельзя, если хотя бы один из
 заказов не выполнен или не оплачен.
 "Внесение" - внесение в кассу наличных, например размен.
 "Изъятие" - изъятие из кассы наличных, например на хоз расходы, размен и т.д.
 //--------------\ DESCRIPTION |----------------------------------------------------------*/

Operation.log = function () {
    console.table( Operation.list, ['RoleName', 'First_sure_name', 'TypePayments', 'Deposit', 'Cause', 'TimeOperation'] );
};
Operation.log();

Operation.logAll = function () {
    var listChange = {}, listOperation = {}, i, countChangeNoName = 0;
    var getChange = function ( data ) {
        countChangeNoName++;
        data.Date_begin = Page.timeReplace( data.Date_begin ).slice( 5, 19 );
        data.Date_end = Page.timeReplace( data.Date_end ).slice( 5, 19 );
        data.over = 0;
        listChange[data.ID] = data
    };
    var getOperation = function ( data ) {
        if ( countChangeNoName !== 0 ) {
            for ( i in listChange ) {
                if ( listChange[i].UserHash === data.UserHash ) {
                    countChangeNoName--;
                    listChange[i].name = data.First_sure_name;
                }
            }
        }
        if ( data.Deposit !== 0 ) {
            data.TimeOperation = Page.timeReplace( data.TimeOperation ).slice( 5, 19 );
            data.TypePayments = TYPE_PAYMENTS[data.TypePayments];
            if ( data.TypePayments === 1 )
                listChange[data.Change_employee_id].over += data.Deposit;
            listOperation[data.ID] = data;
        }
    };
    MSG.request.ChangeEmployeeByOrgHash( true, getChange, function () { // зпрашиваем все смены
        MSG.request.ChangeEmployeeByOrgHash( false, getChange, function () { // зпрашиваем все смены
            for ( i in listChange ) {
                MSG.request.cashBoxOperationByChangeEmployee( i, getOperation )
            }
            setTimeout( MSG.request.cashBoxOperationByChangeEmployee, 500
                , i, getOperation, function () {
                    console.group( '-----------СМЕНЫ' );
                    console.table( listChange, ['name', 'over', 'Sum_in_cashbox', "NonCash_end_day", "Cash_end_day", 'Close', 'Date_begin', 'Date_end'] );
                    console.groupEnd();
                    var sum = 0;
                    for ( i in listOperation ) if ( listOperation[i].TypePayments === 1 ) {
                        sum += listOperation[i].Deposit
                    }
                    console.group( '-----------ОПЕРАЦИИ', sum );
                    console.table( listOperation, ['Change_employee_id', 'Order_id', 'First_sure_name', 'Deposit', 'TypePayments', 'Cause', 'TimeOperation'] );
                    console.groupEnd();
                } )
        } );
    } );
};
// Operation.logAll();

Operation.logAll = function () {
    var listChange = {}, listOperation = {}, i, countChangeNoName = 0;
    var getChange = function ( data ) {
        countChangeNoName++;
        data.Date_begin = Page.timeReplace( data.Date_begin ).slice( 5, 19 );
        data.Date_end = Page.timeReplace( data.Date_end ).slice( 5, 19 );
        data.over = 0;
        listChange[data.ID] = data
    };
    var getOperation = function ( data ) {
        if ( countChangeNoName !== 0 ) {
            for ( i in listChange ) {
                if ( listChange[i].UserHash === data.UserHash ) {
                    countChangeNoName--;
                    listChange[i].name = data.First_sure_name;
                }
            }
        }
        if ( data.Deposit !== 0 ) {
            data.TimeOperation = Page.timeReplace( data.TimeOperation ).slice( 5, 19 );
            data.TypePaymentsT = TYPE_PAYMENTS[data.TypePayments];
            if ( data.TypePayments === 1 )
                listChange[data.Change_employee_id].over += data.Deposit;
            listOperation[data.ID] = data;
        }
    };
    MSG.request.ChangeEmployeeByOrgHash( true, getChange, function () { // зпрашиваем все смены
        MSG.request.ChangeEmployeeByOrgHash( false, getChange, function () { // зпрашиваем все смены
            for ( i in listChange ) {
                MSG.request.cashBoxOperationByChangeEmployee( i, getOperation )
            }
            setTimeout( MSG.request.cashBoxOperationByChangeEmployee, 500
                , i, getOperation, function () {
                    console.group( '-----------СМЕНЫ' );
                    console.table( listChange, ['name', 'over', 'Sum_in_cashbox', "NonCash_end_day", "Cash_end_day", 'Close', 'Date_begin', 'Date_end'] );
                    console.groupEnd();
                    var sum = 0;
                    for ( i in listOperation ) if ( listOperation[i].TypePayments === 1 ) {
                        sum += listOperation[i].Deposit
                    }

                    console.group( '-----------ОПЕРАЦИИ', sum );
                    console.table( listOperation, ['Change_employee_id', 'Order_id', 'First_sure_name', 'Deposit', 'TypePaymentsT', 'Cause', 'TimeOperation'] );
                    console.groupEnd();
                } )
        } );
    } );
};
// Operation.logAll();
