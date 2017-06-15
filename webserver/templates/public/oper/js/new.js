setInterval( function () {
    $.each( $( "#tbody1 [id*='first_stat_minus']" ), function ( key, timer ) {
        $( timer ).text( timePlus1( $( timer ).text(), 1 ) );
    } );
}, 60000 );

$( document ).on( 'click', '.cart_btn_cancel', function () {
    Cart.cancelOrder()
} );
//TODO отличается от Дениса
$( document ).on( "click", ".delivery_met", function () {
    // пересчёт стоимости при смене способа доставки
    var h = this.childNodes[0].hash;
    $( '.delivery_met' ).removeClass( 'active' );
    $( '.delivery_met [href = "' + h + '"]' ).parent().addClass( 'active' );
    Cart.showPrice();
    if ( Cart.getType() === TAKEAWAY ) {
        $( '#take_away_address option' ).removeAttr( 'disabled' );// активируем адреса
        $( "#warning_dellivery" ).css( "color", "green" ).html( "Выберите точку" );
        $( ".delivery_name" ).html( "приготовлен" );
    }
    else {
        $( ".delivery_name" ).html( "доставлен" );
        MSG.request.deliveryZone(
            $( "#city_client" ).val(),
            $( ".operator_client_adress .collapse.in #street_client" ).val(),
            $( ".operator_client_adress .collapse.in #home_number" ).val() );
    }
} );

$( "#new_div_tab" ).hide();
$( "#new_div_tab2" ).hide();
$( "#page_cart" ).hide();

/// отмена заказа - обработка нажатия подтверждения в модальке отмены заказа
$( document ).on( "click", "#cancelCauseYes", function () {
    MSG.set.orderStatus( $( this ).attr( 'title' ), 0, 16, $( "#cancelCause" ).val() );
    $( '#confirm' ).modal( 'hide' );
} );

///при открытии модальки на отмену заказа передает id заказа в след модальку в title
$( '#confirm' ).on( 'shown.bs.modal', function ( event ) {
    var id = $( event.relatedTarget ).parents( ".table-operator__spoiler-content" ).attr( 'id' );
    id = id.slice( 3 );
    $( "#cancelCauseYes" ).attr( "title", id );
    console.log( id );
} );

$( document ).on( "click", "#main_nav_tab li a", function () {
    buildOrdersTable();
} );

/** загрузка заказов из историии */
$( '#loadtel2' ).on( 'click', function () {
    MSG.request.h_orderByTelephone( getPhone( "client_phone2" ), setPeriod( $( 'input[name=RG1]:checked' ).val() ), getTimeOnNow() );
} );

function buildOrdersTable() {
    var id = $( "#main_nav_tab .active" ).attr( 'id' );

    if ( id == "black_tab" ) {
        return;
    }
    if ( id == "new_tab" ) {
        $( document ).ready( function () {
            $( "#main_div_tab" ).hide();
            $( "#new_div_tab" ).show();
            $( "#new_div_tab2" ).hide();
            $( "#tab_client" ).click();
            $( "#ostatok, #comment_order, #comment_order1, #count_person, #client_phone, #client_name" ).val( "" );
            $( "#accordion1" ).empty().append( makeAddress( {}, 0 ) );
            MSG.attachForLoadingAdress();
            $( "#warning_dellivery" ).html( "" );
            $( '#take_away_address' ).prop( 'selectedIndex', -1 );
            $( 'li[data-product]' ).remove();
            MSG.request.products();
            MSG.request.deliveryZone( "", "", "" );
            if ( $( "#on_time" ).is( ":checked" ) ) {
                $( '#on_time' ).click();
                $( "#timeFinish1" ).html( timePlus1( $( "#select_time" ).val(), 30 ) );
                $( "#timeFinish2" ).html( timePlus1( $( "#select_time" ).val(), 59 ) );
            } else {
                $( "#timeFinish1" ).html( timePlus1( getTimeHM( getTimeOnNow() ), 30 ) );
                $( "#timeFinish2" ).html( timePlus1( getTimeHM( getTimeOnNow() ), 59 ) );
            }
            Cart.clean();
            Cart.showPrice();
            $( "#overall_cost" ).html( $( "#over_price" ).html() );
            $( '.product_in_cart' ).remove(); // очищаем боковую панель
            $( "#to_workers" ).prop( "checked", false );
            $( "#ignore_delivery" ).prop( "checked", false );
        } );
    }
}

// Переключатель для меню

$( "#main_nav_tab li" ).click( function () {
    $( "#main_nav_tab li" ).removeClass( "active" ); //удаляем класс во всех вкладках
    $( this ).addClass( "active" ); //добавляем класс текущей (нажатой)
    var id = this.id;
    var main = $( "#activeOrder" ),
        preorder = $( "#preOrder" ),
        history = $( "#historyOrder" ),
        black = $( "#bl" ),
        finish = $( "#finishOrder" );

    switch ( id ) {
        case "active_tab":
            $( preorder ).removeClass( "active" );
            $( finish ).removeClass( "active" );
            $( history ).removeClass( "active" );
            $( black ).removeClass( "active" );
            $( main ).addClass( "active" );
            break;
        case "preorder_tab":
            $( main ).removeClass( "active" );
            $( finish ).removeClass( "active" );
            $( history ).removeClass( "active" );
            $( black ).removeClass( "active" );
            $( preorder ).addClass( "active" );
            break;
        case "history_tab":
            $( main ).removeClass( "active" );
            $( finish ).removeClass( "active" );
            $( preorder ).removeClass( "active" );
            $( black ).removeClass( "active" );
            $( history ).addClass( "active" );
            $( 'input[name=RG1][value=1]' ).prop( "checked", "checked" );
            break;
        case "black_tab":
            $( main ).removeClass( "active" );
            $( finish ).removeClass( "active" );
            $( history ).removeClass( "active" );
            $( preorder ).removeClass( "active" );
            $( black ).addClass( "active" );
            break;
        case "done_tab":
            $( main ).removeClass( "active" );
            $( preorder ).removeClass( "active" );
            $( history ).removeClass( "active" );
            $( black ).removeClass( "active" );
            $( finish ).addClass( "active" );
            break;
    }
} );

/// фильтрация в таблице по нескольким полям
// $( document ).ready( function () {
$( '.btn-filter' ).click( function () {
    var $panel = $( '.filterable' ),
        $filters = $panel.find( '.filters input' ),
        $tbody = $panel.find( '.table tbody' );
    if ( $filters.prop( 'disabled' ) == true ) {
        $filters.prop( 'disabled', false );
        $filters.first().focus();
    } else {
        $filters.val( '' ).prop( 'disabled', true );
        $tbody.find( '.no-result' ).remove();
        $tbody.find( 'tr' ).show();
    }
} );

$( '.filters input' ).keyup( function ( e ) {
    // Ignore tab key /
    var code = e.keyCode || e.which;
    if ( code == '9' ) return;
    // Useful DOM data and selectors /
    var $table = $( '.table' ),
        $rows = $( this ).parents( '.filterable' ).find( 'tr.table-operator__row' ),
        $input = $( this ),

        $columns = $( this ).parents( '.filters' ).find( 'input' );
    var inputContent1 = $columns.eq( 0 ).val().toLowerCase(),
        inputContent2 = $columns.eq( 1 ).val().toLowerCase(),
        inputContent3 = $columns.eq( 2 ).val().toLowerCase(),
        inputContent4 = $columns.eq( 3 ).val().toLowerCase(),
        inputContent5 = $columns.eq( 4 ).val().toLowerCase(),
        inputContent6 = $columns.eq( 5 ).val().toLowerCase(),
        inputContent7 = $columns.eq( 6 ).val().toLowerCase(),
        inputContent8 = $columns.eq( 7 ).val().toLowerCase(),
        inputContent9 = $columns.eq( 8 ).val().toLowerCase(),
        inputContent10 = $columns.eq( 9 ).val().toLowerCase(),
        column = $( '.filters th' ).index( $input.parents( 'th' ) );

    var $filteredRows = $rows.filter( function () {
        var value1 = $( this ).find( 'td' ).eq( 0 ).text().toLowerCase(),
            value2 = $( this ).find( 'td' ).eq( 1 ).text().toLowerCase(),
            value3 = $( this ).find( 'td' ).eq( 2 ).text().toLowerCase(),
            value4 = $( this ).find( 'td' ).eq( 3 ).text().toLowerCase(),
            value5 = $( this ).find( 'td' ).eq( 4 ).text().toLowerCase(),
            value6 = $( this ).find( 'td' ).eq( 5 ).text().toLowerCase(),
            value7 = $( this ).find( 'td' ).eq( 6 ).text().toLowerCase(),
            value8 = $( this ).find( 'td' ).eq( 7 ).text().toLowerCase(),
            value9 = $( this ).find( 'td' ).eq( 8 ).text().toLowerCase(),
            value10 = $( this ).find( 'td' ).eq( 9 ).text().toLowerCase();

        if ( (value1.indexOf( inputContent1 ) === -1 ) ||
            (value2.indexOf( inputContent2 ) === -1 ) ||
            (value3.indexOf( inputContent3 ) === -1 ) ||
            (value4.indexOf( inputContent4 ) === -1 ) ||
            (value5.indexOf( inputContent5 ) === -1 ) ||
            (value6.indexOf( inputContent6 ) === -1 ) ||
            (value7.indexOf( inputContent7 ) === -1 ) ||
            (value8.indexOf( inputContent8 ) === -1 ) ||
            (value9.indexOf( inputContent9 ) === -1 ) ||
            (value10.indexOf( inputContent10 ) === -1 ) ) {
            return true
        }
        // $row.filter
    } );

    // Clean previous no-result if exist /
    $table.find( 'tbody .no-result' ).remove();
    //отображает все строки, закрывает все слайды, убирает выделения, скрывает отфтльтрованные
    $rows.show();
    $( ".table-operator__spoiler-content" ).collapse( 'hide' );
    $filteredRows.hide();
    // Prepend no-result row if all rows are filtered /
    if ( $filteredRows.length === $rows.length ) {
        $table.find( 'tbody' ).prepend( $( '<tr class="no-result text-center"><td colspan="' + $table.find( '.filters th' ).length + '">No result found</td></tr>' ) );
    }
} );
// } );

/// заполнение полей оператора


///заказ-корзина-----------------------------------------------------------


//---------- приготовить сдачу
$( ".money_summ a" ).click( function () {
    $( "#ostatok" ).val( this.text );
} );
$( '#ostatok' ).next().click( function () {
    $( "#ostatok" ).val( "" );
} );


/// изменение имени на странице заказа
$( document ).ready( function () {
    $( "#client_name, #client_name2" ).keyup( function () {
        var $input = $( this )
            , phone_client_name = $input.val();
        $( ".client_name_oper" ).html( phone_client_name );
    } )
} );

/// очистка свойства элементов корзины
$( '#products_cat li' ).click( function () {
    $( '#products_cat li' ).removeClass( 'active' )
} );

///очистка поля перед кнопкой очистить
$( ".clearbutton" ).on( 'click', function () {
    $( this ).prev().val( "" );
} );


// заказ клиента на след страницу
$( '#next_btn' ).click( function () {
    if ( $( "#take_away_address option:selected" ).index() < 0 ) {
        alert( "Выберите адрес самовывоза/доставки" );
        return;
    }
    if ( ($( ".operator_client_adress .collapse.in" ).length) == 0 && (Cart.getType() === DELIVERY) ) {
        alert( "Не выбран адрес клиента" );
        return;
    }
    $( '#tab_client' ).removeClass( "active" );
    $( '#client' ).removeClass( "active" );
    $( '#tab_order' ).addClass( "active" );
    $( '#order_client' ).addClass( "active" );
} );

///нажатие кнопки открытия корзины на панели нового заказа
$( "#cart_btn" ).on( 'click', function () { //  в меню(корзину)
    $( ".operator" ).hide();
    $( "#new_div_tab" ).hide();
    $( "#new_div_tab2" ).hide();
    $( "#page_cart" ).show();
    $( ".trigger" ).hide();
    MSG.request.promotions();
    $( document ).ready( function () {
        var org = document.getElementById( 'take_away_address' ).value;
        if ( org != "" ) {
            MSG.request.AvailableProd( org )
        }
    } )
} );

// отмена создания заказа переход из заказа клиента на главную страницу оператора
$( "#cancel_btn, #cancel_btn2" ).on( 'click', function () {
    $( "#main_div_tab" ).show();
    $( "#new_div_tab" ).hide();
    $( "#new_div_tab2" ).hide();
    $( "#active_tab" ).click();                         //запускаем вкладку активные заказы
    $( '#tab_order' ).removeClass( "active" );
    $( '#order_client' ).removeClass( "active" );
    $( '#tab_client' ).addClass( "active" );
    $( '#client' ).addClass( "active" );
} );

// создание заказа, переход  на главную страницу оператора
$( "#finish_btn" ).on( 'click', function () {
    try {
        MSG.sendOrder();
        Cart.cancelOrder();
        //запускаем вкладку активные заказы
        $( "#main_div_tab" ).show();
        $( "#new_div_tab" ).hide();
        $( "#new_div_tab2" ).hide();
        $( "#active_tab" ).click();
        $( '#tab_order' ).removeClass( "active" );
        $( '#order_client' ).removeClass( "active" );
        $( '#tab_client' ).addClass( "active" );
        $( '#client' ).addClass( "active" );
    } catch ( e ) {
        console.error( e );
        alert( 'Возникли проблемы с отправкой заказа!!!' )
    }
} );

// из  корзины (меню) на страницу оформления заказа
$( "#cart_btn_cancel, #cart_btn_apply" ).on( 'click', function () {
    $( "#page_cart" ).hide();
    $( "#main_div_tab" ).hide();
    $( ".operator" ).show();
    $( "#new_div_tab" ).show();
    $( "#overall_cost" ).html( $( "#over_price" ).html() );
    $( ".operator" ).show();
} );

$( "#over_price" ).on( "change", function () {
    $( "#overall_cost" ).html( $( "#over_price" ).html() );
} );

function textVal( text ) {
    if ( text == "Undefined" || text == "undefined" || !text ) return " ";
    return text;
}


//загружаем адреса доставки по изменению поля город
$( "#city_client" ).change( function () {
    getOrg( $( "#city_client" ).val() );
} );

$( document ).on( 'click', '#to_workers', function () {
    $( '#input_to_workers' ).css( 'display', ( $( this ).prop( 'checked' ) ? '' : 'none') );
    Cart.showPrice()
} );

$( document ).on( 'click', '#ignore_delivery', function () {
    if ( $( "#ignore_delivery" ).is( ":checked" ) ) {
        $( '#take_away_address option' ).removeAttr( 'disabled' );
    } else if ( Cart.getType() === DELIVERY ) {
        MSG.request.deliveryZone(
            $( "#city_client" ).val(),
            $( ".operator_client_adress .collapse.in #street_client" ).val(),
            $( ".operator_client_adress .collapse.in #home_number" ).val() );
    }
} );


length = function ( obj ) {
    var len = 0, i;
    for ( i in obj ) {
        len++;
    }
    return len;
};

