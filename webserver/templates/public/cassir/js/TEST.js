////////--------| setup test |----------------------------------------------------------
if ( ~window.location.href.indexOf( '/html/cassir/cassir.html' ) ) {
    AUTH_URL = '';
    WS_URL = 'ws://192.168.0.73:80/ws';
    DELYVERYMAN_HASH = '1';
    SESSION_HASH = '321ca7bc07d1c93bc464d9efb504a1598243e5e745140d96f23781a114ae9d8c';

    ////////--------| address |----------------------------------------------------------
    document.getElementById( 'client_name' ).value = 'Ден';
    document.getElementById( 'client_phone' ).value = '+7(909)777-77-77';
    document.getElementById( 'street_client' ).value = 'Пролетарская';
    document.getElementById( 'home_number' ).value = '57';
    document.getElementById( 'corp_str' ).value = 'a';
    document.getElementById( 'podyezd' ).value = '3';
    document.getElementById( 'level' ).value = '14';
    document.getElementById( 'kv_of' ).value = '45';
    document.getElementById( 'cod' ).value = '*78*';
    //--------------\ address |----------------------------------------------------------

    // для приготовления елементов заказа
    setReadyElement = function ( ID, id_item ) {
        if ( id_item ) {
            MSG.setStatus( ID, id_item, 8 );
            MSG.setFinished( ID, id_item, true );
        } else {
            var i;
            Order.list[ID].setStatus( ID, true );
            for ( i in Order.list[ID].OrderList ) {
                MSG.setFinished( ID, i, true );
            }
        }
    };
    // wait('asdfasdfasdfasdfkl;34;l12k3;l4123kl;', function (  ) {
    //     Page.show.Carts();
    // }, 2000 )
}
//--------------\ setup test |----------------------------------------------------------

// setInterval( function () {
//     var x = 100, z = 100000000000;
//     for (var i = 0; i < 100000000; i++){
//         x = x * z;
//         x = x * z;
//         x = x * z;
//         x = x * z;
//     }
// }, 20 );