// !!! указывать город
// !!! при создании заказа спрашиваем "предзаказ" или нет. если предзаказ то то вызываем операторский интерфейс, иначе корзину.
// : V подсчёт сдачи
////////--------| Customer |----------------------------------------------------------
// TODO: V очистка полей.
// function Customer( c ) {
//     //     var s = { "Order_id": 170, "NameCustomer": "Алексей",
//     //     "Phone": "8(919)581-38-88", "Note": "", "City": "Курган",
//     //     "Street": "Гоголя", "House": 38, "Building": "0",
//     //     "Floor": 0, "Apartment": 0, "Entrance": 0, "DoorphoneCode": "0" };
//     var i, ii;
//     for ( i in Customer.list ) {
//         ii = Customer.list[i];
//         if ( ii.Phone == c.Phone && ii.City == c.City && ii.Street == c.Street && ii.House == c.House &&
//             ii.Building == c.Building && ii.Floor == c.Floor && ii.Apartment == c.Apartment &&
//             ii.Entrance == c.Entrance && ii.DoorphoneCode == c.DoorphoneCode )
//             return;
//     }
//     for ( i in c ) {
//         this[i] = c[i];
//     }
//     Customer.list.push( this );
//     Customer.makeElement( this );
// }
// Customer.list = [];
// Customer.makeElement = function () {
//     for ( var i in Customer.list ) {
//         Customer.list[i].makeElement()
//     }
// };
//--------------\ Customer |----------------------------------------------------------


// Доставка ко времени
$( document ).on( 'click', '#on_time', function () {
    var s = $( '#select_date, #select_time' );
    s.prop( 'disabled', (!s.prop( 'disabled' )) );
    if ( !s.prop( 'disabled' ) ) {
        document.getElementById( 'select_date' ).value = Page.time( false, true ).split( ' ' )[0]
    }
} );
$( document ).on( 'click', '#to_workers', function () {
    var s = $( '#input_to_workers' );
    s.css( 'display', ( $( this ).prop( 'checked' ) ? '' : 'none') );
    Cart.showPrice()
} );

$( '#select_date, #select_time' ).prop( 'disabled', true );
$( '#on_time' ).prop( "checked", false );


//---------------------------навигация между вкладками

// заказ клиента на след страницу
$( '#next_btn' ).click( function () {
    $( '#tab_client' ).removeClass( "active" );
    $( '#client' ).removeClass( "active" );
    $( '#tab_order' ).addClass( "active" );
    $( '#order_client' ).addClass( "active" )
} );


$( ".clearbutton" ).on( 'click', function () {
    $( this ).prev().val( "" );
} );

$( "#client_name" ).keyup( function () {
    var $input = $( this ), phone_client_name = $input.val();
    $( ".client_name_oper" ).html( phone_client_name );
} );


//---------- приготовить сдачу
$( ".money_summ a" ).click( function () {
    $( "#ostatok" ).val( this.text );

} );
$( '#ostatok' ).next().click( function () {
    $( "#ostatok" ).val( "" );
} );
//-----

$( document ).on( 'click', '#finish_btn', function () {
    try {
        MSG.sendOrder();
        Cart.cancelOrder();
        oldOrderClear();
    } catch ( e ) {
        console.error( e );
        alert( 'Возникли проблемы с отправкой заказа!!!' )
    }
    Page.show.Cassir();
} );

$( document ).on( 'click', '.cart_btn_cancel', function () {
    Cart.cancelOrder()
    Page.show.Cassir();
} );

function oldOrderClear() {
    document.getElementById( 'count_person' ).value = '';
    document.getElementById( 'client_name' ).value = '';
    document.getElementById( 'client_phone' ).value = '';
    document.getElementById( 'comment_order' ).value = '';
    document.getElementById( 'comment_order1' ).value = '';
    document.getElementById( 'ostatok' ).value = '';
    document.getElementById( 'count_person_span' ).innerHTML = '0';
    if ( $( "#on_time" ).is( ":checked" ) ) {
        $( '#on_time' ).click();
    }
    if ( $( "#to_workers" ).is( ":checked" ) ) {
        $( '#to_workers' ).click();
    }
}
