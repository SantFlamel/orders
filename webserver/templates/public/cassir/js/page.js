//     document.getElementById( 'horse_m' ).innerHTML = SESSION_INFO.hoursInMonth;
//     document.getElementById( 'time_acceptance_order' ).innerHTML = SESSION_INFO.averageDialog;
//     document.getElementById( 'rating' ).innerHTML = SESSION_INFO.rating;
//     document.getElementById( 'award' ).innerHTML = SESSION_INFO.award;
//     document.getElementById( 'withheld' ).innerHTML = SESSION_INFO.deAward;
//     document.getElementById( 'balance' ).innerHTML = SESSION_INFO.balance;
//     $( '.cashierFIO' ).html( cashier.name );


// {"UserHash":"559bcba541b5e29bbb73ebf16763ca4a5a0bcb3417a1f4add1e7072a2ca0ac01","PlanTime":33,"JobTime":-2.5620477880152157e+06}
// {"SessionHash":"c488ad679c2afc1914547ac03f0c99bf74b568a8c74856725d626bb6152c8819"
// ,"UserHash":"eb2ffc0c4632ba9f3026f8ae35520f1fb1a708b7e213bdbfb643bc16a0900190"
// ,"SurName":"Кассир","FirstName":"Кассир","SecondName":"Кассир","VPNNumber":"3536546"
// ,"Language":"rt","RoleHash":"a37264bf492a3928503828df00998e7312a686ece4a577fd58cc211cb00bf635af1ea9dead1e858d3f89fd541c826c1a891db4b7cbcea3b0e4953d4bf270d820"
// ,"RoleName":"Кассир","OrganizationHash":"1854b653819e6cdd44feb00321e54cf398cba9672e78ec9ba9ad1c6b92de8b47e8d97f5788450778d89d646a054e451e341946a8f87e57edc8681a27e0e065d0"
// ,"OrganizationName":"Курган 5 микрорайон 33","SessionData":"Sklad"}


////////--------| Organization |----------------------------------------------------------
// Organization = function ( org ) {
//     var i;
//     for ( i in org ) {
//         this[i] = org[i];
//     }
//     Organization.list[this.Hash] = this;
//     Organization.list[this.Hash].appendElement();
// };
// Organization.list = {};
// Organization.prototype.appendElement = function () {
//     document.getElementById( 'take_away_address' ).innerHTML +=
//         '<option value="' + this.Hash + '">' + this.Street + ', ' + this.House + '</option>'
// };
// Organization.prototype.disableSelect = function () {
//     var elem = document.querySelector( '#take_away_address' );
//     $( '#take_away_address option[value=' + this.Hash + ']' ).attr( 'disabled', 'disabled' );
//     if ( elem.value == this.Hash ) {
//         elem.value = '';
//     }
// };
// Organization.prototype.enableSelect = function () {
//     $( '#take_away_address option[value=' + this.Hash + ']' ).removeAttr( 'disabled' )
// };
// // new Organization();
//--------------\ Organization |----------------------------------------------------------

Page.hide = {
    all: function () {
        for ( var i in Page.hide ) if ( i !== 'all' ) {
            Page.hide[i]()
        }
    }, Carts: function () {
        document.getElementById( 'page_cart' ).style.display = 'none';
    }, Cassir: function () {
        Cassir.stopTimer();
        document.getElementById( 'cassir' ).style.display = 'none';
    }, DescriptionOrder: function () {
        document.getElementById( 'description_order' ).style.display = 'none';
    }, CachBox: function () {
        document.getElementById( 'cash_box' ).style.display = 'none';
    }, Operator: function () {
        document.getElementById( 'interfase_operator' ).style.display = 'none';
    }, delivery: function () {
        document.getElementById( 'delivery' ).style.display = 'none';
    }
};
Page.show = {
    Cassir: function () {
        document.title = 'Заказы';
        Page.hide.all();
        timeOutRe( 'MSG.request.ordersByOrgHash', function () {
            MSG.request.ordersByOrgHash()
        }, 6000 );
        $( '.nav-tabs > li' ).removeClass( 'active' );
        document.getElementById( 'orders' ).className = 'active';
        document.getElementById( 'cassir' ).style.display = '';
        Page.show.telephone.ready();
        Order.showOrders();
    }, DescriptionOrder: function () {
        document.getElementById( 'cassir' ).style.display = 'none';
        document.getElementById( 'description_order' ).style.display = '';
    }, CashBox: function () {
        Page.hide.all();
        document.getElementById( 'cash_box' ).style.display = '';
        waitProp( function () {
            MSG.request.cashBoxOperationByChangeEmployee( SESSION_INFO.ChangeEmployee.ID );
        }, function () {
            return SESSION_INFO.ChangeEmployee;
        }, 500, 10 );
        waitProp( function () {
                MSG.request.personal( SESSION_INFO.OrganizationHash, HASH_DELIVERYMAN, Deliveryman );
            }
            , function () {
                return !!SESSION_INFO.OrganizationHash;
            }, 500, 10 );
    }, Operator: function () {
        Page.hide.all();
        document.getElementById( 'interfase_operator' ).style.display = '';
        document.getElementById( 'tab_client' ).classList.add( 'active' );
        document.getElementById( 'client' ).classList.add( 'active' );
        document.getElementById( 'order_client' ).classList.remove( 'active' );
        document.getElementById( 'tab_order' ).classList.remove( 'active' );
        document.querySelector( '.pay_met li' ).classList.add( 'active' );
        Page.show.telephone.ready();
        if ( !$( '.delivery_met' ).hasClass( 'active' ) ) {
            $( '.delivery_met:has([href="#take_away"])' ).addClass( 'active' );
        }
    }, Carts: function () {
        Page.hide.all();
        document.getElementById( 'page_cart' ).style.display = '';
    }, makeOrder: function () {
        MSG.request.products();
        $( "#accordion1" ).empty().append( makeAddress( {}, 0 ) );
        bindTypeaheadAddress();
        $( 'li[data-product]' ).remove();
        Cart.showCatalog();
        if ( !$( '.delivery_met' ).hasClass( 'active' ) ) {
            $( '.delivery_met:has([href="#take_away"])' ).addClass( 'active' );
        }
        MSG.request.promotions();
    }, delivery: function () {
        document.getElementById( 'delivery' ).style.display = '';
    }, telephone: {
        ready: function () {
            // TODO: доавить проверку отсутствия вызова.
            $( '.call_telephone' ).css( 'display', 'none' );
            $( '.telephone.green_tube' ).css( 'display', '' );
            this.keyboard( '' );
            $( '.block_telephone' ).removeClass( 'dark black' );
        }, calls: function () {
            document.getElementById( 'block_telephone' ).className += ' dark black';
            $( '.call_telephone' ).css( 'display', '' );
            $( '.telephone.green_tube' ).css( 'display', 'none' );
            this.keyboard( 'none' );
            $( '.block_telephone' ).addClass( 'dark black' );
        }, keyboard: (function () { // самоисполняющаяся
            var x;
            return function ( n ) {
                if ( n === 'none' || n === '' ) {
                    x = n;
                } else if ( document.getElementById( 'keyboard' ).style.display === 'none' ) {
                    x = '';
                } else {
                    x = 'none';
                }

                if ( x === 'none' ) {
                    $( '.telephone.keyboard' ).removeClass( 'active' ).css( 'display', x );
                } else {
                    $( '.telephone.keyboard' ).addClass( 'active' ).css( 'display', x );
                }
            }
        }())
    }
};


////////--------| TELEPHONE |----------------------------------------------------------
$( document ).on( 'click', '.btn_telephone_keyboard', function () {
    Page.show.telephone.keyboard()
} );
$( document ).on( 'click', '.telephone.end_call', function () {
    Page.show.telephone.ready()
} );
$( document ).on( 'click', '.telephone.calls', function () {
    Page.show.telephone.calls()
} );
//--------------\ TELEPHONE |----------------------------------------------------------


//////////////////////////////////////////////////////////////////////////////
////////--------|  |----------------------------------------------------------
//////////////////////////////////////////////////////////////////////////////
$( document ).on( 'click', '#cart_btn_apply', function () {
    Page.show.Operator();
} );
$( document ).on( 'click', '#cart_btn', function () {
    Page.show.Carts();
} );
$( document ).on( 'click', '#btn_cashbox_nav', function () {
    Page.show.CashBox();
} );


jQuery( function ( $ ) { // маска номера телефона
    $.mask.definitions['~'] = '[+-]';
    $( '.tel_num' ).mask( '+7(999)999-99-99', {
        completed: function () {
        }
    } );
} );
// function number_tel( num ) {
//     var _input = $( '#tel_num' ), _input_val = _input.val();
//     _input_val = _input_val ? _input_val : "+7(___)___-__-__";
//     if ( _input_val.indexOf( '_' ) ) {
//         _input.val( _input_val.replace( '_', num ) )
//     }
// }

// Фильтрация для input
$( document ).on( 'keyup', 'input.number', function () {
    this.value = this.value.replace( /[^0-9.,]/g, '' ).replace( /,/g, '.' );
} );
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//--------------\  |----------------------------------------------------------
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


// TODO: при закрытии страници срабатывает скрипт
window.addEventListener( 'beforeunload', function ( event ) {
    // cookie.set( 'close', 1111111 );
    // alert(this);
    // return this;
    // MSG.close.session();
}, false );
