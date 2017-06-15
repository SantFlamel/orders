getPhone = function ( id ) {
    id = id || 'client_phone';
    var t = document.getElementById( id ).value;
    return t.replace( /\D/g, '' )
};

MSG.request.customer = function ( ID, fn ) {
    var s = {
        "Table": "OrderCustomer", "Query": "Read", "TypeParameter": "Value",
        "Values": [ID], "Limit": 0, "Offset": 0, "ID_msg": ""
    };
    MSG.send( { structure: s, handler: fn, mHandlers: false, EOFHandler: false, check: false } )
};

////////--------| MAKE ORDER |----------------------------------------------------------
MSG.order = function ( onTime, Type ) {
    console.group( 'MSG.order' );
    onTime = onTime || $( "#on_time" ).is( ":checked" );
    var TimeDelivery = onTime ?
        (document.getElementById( 'select_date' ).value + 'T' + document.getElementById( 'select_time' ).value + ':00Z')
        : EMPTY_TIME
        , CountPerson = document.getElementById( 'count_person' ).value
        , Division = $( '#to_workers' ).prop( 'checked' ) ? document.getElementById( 'input_to_workers' ).value : " "
        , bonus = 0, getPrice = Cart.getPrice(), price = getPrice[0], PriceWithDiscount = getPrice[3]
        , discountName = getPrice[1], discountPerc = getPrice[2]
        , price_currency = "руб", NameStorage = "Курган 5 микрорайон 33" // получается с информацией о кассире
        , ost = document.getElementById( 'ostatok' ).value, note = document.getElementById( 'comment_order' ).value
        , s
    ;

    ost = (ost == "") ? "" : "Приготовить сдачу с " + ost + "<br> ";
    note = ost + note;

    s = [{
        Table: 'Order', Query: 'Create', TypeParameter: 'GetID', Values: null, Limit: 0, Offset: 0
    }, {
        ID: 0
        , SideOrder: SIDE_ORDER
        , TimeDelivery: TimeDelivery
        , DatePreOrderCook: TimeDelivery
        , CountPerson: +CountPerson
        , Division: Division
        , NameStorage: NameStorage
        , OrgHash: SESSION_INFO.OrganizationHash
        , Note: note
        , DiscountName: discountName
        , DiscountPercent: +discountPerc
        , Bonus: bonus
        , Type: Type
        , Price: price
        , PriceWithDiscount: PriceWithDiscount
        , PriceCurrency: price_currency
        , TypePayments: +$( '.pay_met .active' ).prop( 'id' )
    }];
    console.log( 's', s );
    console.groupEnd();
    return s
};

MSG.sendCustomer = function ( ID ) {
    var s = MSG.customer( ID );
    MSG.send( { structure: s, check: true } );
};
MSG.customer = function ( ID ) {
    console.group( 'MSG.customer' );
    var s
        , NameCustomer = $( "#client_name" ).val() || NO_NAME
        , phone = getPhone( 'client_phone' );
    s = [{
        "Table": "OrderCustomer", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0
    }, {
        "Order_id": +ID, "NameCustomer": NameCustomer + '', "Phone": phone + '', "Note": ''
    }];
    s[1] = MSG.clientAddress( s[1] );
    console.log( s );
    console.groupEnd();
    return s
};
MSG.cart = function ( ID ) {
    console.group( 'MSG.cart' );
    var s, ss = [], i, ii, discountName, discountPerc;
    for ( i in Cart.list ) {
        ii = Product.list[Cart.list[i].Price_id];
        discountName = Cart.list[i].DiscountName;
        discountPerc = Cart.list[i].DiscountPercent;
        s = [{
            "Table": "OrderList", "Query": "Create", "TypeParameter": "GetID",
            "Values": null, "Limit": 0, "Offset": 0
        }, {
            "Order_id": +ID, "ID_item": 1, "ID_parent_item": 0, "Price_id": ii.Price_id, "PriceName": ii.PriceName,
            "Type_id": ii.Type_id, "TypeName": ii.TypeName, "Parent_id": ii.Parent_id, "ParentName": ii.ParentName,
            "Image": ii.Image, "Units": ii.Units, "Value": ii.Value, "Set": ii.Set, "Finished": false,
            "DiscountName": discountName, "DiscountPercent": discountPerc, "Price": ii.Price,
            "CookingTracker": ii.CookingTracker, "TimeCook": ii.TimeCook, "TimeFry": ii.TimeFry
        }];
        ss.push( s );
    }
    console.log( ss );
    console.groupEnd();
    return ss;
};
MSG.clientInfo = function () {
    var tel = getPhone()
        , s = [{ "Table": "ClientInfo", "TypeParameter": "Create" }
        , {
            Phone: tel
            , Name: document.getElementById( 'client_name' ).value || NO_NAME
            // , Bonus: null, BlackList: null, CauseBlackList: null, Birthday: null
        }];
    return s
};
MSG.clientInfoAddress = function ( Order_id ) {
    var s, tel = getPhone(),
        x = $( ".operator_client_adress .collapse.in" ).parent().attr( 'data-id_address' )
    ;
    if ( x != undefined && x.length ) {
        s = [{ "Table": "ClientInfo", "TypeParameter": "CreateAddress" }
            , { ID: +x, Phone: getPhone( 'client_phone' ) }];
    } else {
        s = [{ "Table": "ClientInfo", "TypeParameter": "CreateAddress" }
            , { Phone: tel, Order_id: Order_id || 0, ID: 0, ClientHash: '', Comment: '' }];
        s[1] = MSG.clientAddress( s[1] );
    }
    return s
};

MSG.collectOrder = function () {
    console.group( 'MSG.collectOrder' );
    MSG.collectOrder.list = {};
    var Type = Cart.getType(), onTime = $( "#on_time" ).is( ":checked" )
        , note = document.getElementById( 'comment_order' ).value,
        note1 = document.getElementById( 'comment_order1' ).value
        , street = $( ".operator_client_adress .collapse.in #street_client" ).val()
        , home = $( ".operator_client_adress .collapse.in #home_number" ).val()
        , TimeDelivery = onTime ?
            (document.getElementById( 'select_date' ).value + 'T' + document.getElementById( 'select_time' ).value + ':00Z')
            : "0001-01-01T00:00:00Z"
    ;

    if ( TimeDelivery.length !== 20 ) {
        warning( 'Поле времени не векорректно.', 'alert' );
        console.groupEnd();
        throw new Error( 'Проверте поля коментария.' );
    }
    if ( Type == undefined ) {
        warning( 'Не выбран способ получения заказа.', 'alert' );
        console.groupEnd();
        throw new Error( 'Не выбран способ получения заказа.' );
    }
    if ( Type === DELIVERY && (street == undefined || home == undefined ) ) {
        warning( 'Не указан адрес.', 'alert' );
        console.groupEnd();
        throw new Error( 'Не указан адрес.' );
    }
    if ( Cart.list.length === 0 ) {
        warning( 'Корзина пуста.', 'alert' );
        console.groupEnd();
        throw new Error( "Корзина пуста." );
    }
    // if ( document.getElementById( 'count_person' ).value == 0 ) {
    //     warning( 'Количество персон не указанно.', 'alert' );
    //     console.groupEnd();
    //     throw new Error( "Количество персон не указанно." );
    // }

    MSG.collectOrder.list.cart = MSG.cart();
    MSG.collectOrder.list.clientInfo = MSG.clientInfo();
    MSG.collectOrder.list.clientInfoAddress = MSG.clientInfoAddress();
    MSG.collectOrder.list.order = MSG.order( onTime, Type );
    MSG.collectOrder.list.customer = MSG.customer( 0 );
    MSG.collectOrder.list.status = { Status_id: onTime ? 1 : 2 };
    console.groupEnd();
};

MSG.sendOrder = function () {
    console.group( 'MSG.sendOrder ' );
    MSG.collectOrder();
    MSG.send( { structure: MSG.collectOrder.list.order, handler: MSG.sendOrderData, check: true } );
    console.groupEnd();
};
MSG.sendOrderData = function ( ID ) {
    console.group( 'MSG.sendOrderData' );
    try {
        var list = MSG.collectOrder.list, i, ii;
        MSG.set.personal( ID, 0 );
        list.customer[1].Order_id = +ID;
        MSG.send( { structure: list.customer, check: true } );
        if ( list.clientInfo.Phone !== '' ) {
            MSG.send( { structure: list.clientInfo } );
            list.clientInfoAddress[1].Order_id = ID;
            MSG.send( { structure: list.clientInfoAddress } );
        }
        for ( i in list.cart ) {
            ii = list.cart[i];
            ii[1].Order_id = ID;
            MSG.send( { structure: ii, check: true } );
        }
        MSG.set.orderStatus( ID, 0, list.status.Status_id );
    } catch ( e ) {
        console.error( e );
        alert( '2 Возникли проблемы с отправкой заказа!!!' )
    }
    warning( 'Заказ #' + ID, 'info', 20000, null, true );
    // Cart.cancelOrder();
    console.groupEnd();
};
//--------------\ MAKE ORDER |----------------------------------------------------------

MSG.clientAddress = function ( s ) {
    var i
        , x = {
        City: $( "#city_client" ).val() || ' '
        , Street: ($( ".operator_client_adress .collapse.in #street_client" ).val() || ' ') + ''
        , House: +$( ".operator_client_adress .collapse.in #home_number" ).val() || 0
        , Building: ($( ".operator_client_adress .collapse.in #corp_str" ).val() || ' ') + ''
        , Floor: +$( ".operator_client_adress .collapse.in #level" ).val() || 0
        , Apartment: +$( ".operator_client_adress .collapse.in #kv_of" ).val() || 0
        , Entrance: +$( ".operator_client_adress .collapse.in #podyezd" ).val() || 0
        , DoorphoneCode: ($( ".operator_client_adress .collapse.in #cod" ).val() || ' ') + ''
    };
    if ( x.Street === ' ' && x.House === 0 && Cart.getType() === TAKEAWAY ) {
        var zz = SESSION_INFO.OrganizationName.split( ';' );
        x.City = zz[0];
        x.Street = zz[1];
        x.House = +zz[2];
    }
    if ( s != undefined ) {
        for ( i in x ) {
            s[i] = x[i];
        }
        return s;
    } else {
        return x;
    }
};


////////--------| PRODUCT |----------------------------------------------------------
MSG.request.products = function () {
    var s = { "Table": "ProductOrder" };
    MSG.send( { structure: s, handler: Product, mHandlers: true, EOFHandler: MSG.request.AvailableProd } )
};
MSG.request.AvailableProd = function ( OrgHash ) {
    var s = {
        "Table": "ProductOrder", "TypeParameter": "OrgHash", "Values": [OrgHash || SESSION_INFO.OrganizationHash],
        "ID_msg": "productOrg"
    };
    MSG.send( {
        structure: s, handler: MSG.get.AvailableProd, mHandlers: true, EOFHandler: function () {
            Product.notAvailable();
            Promotion.all( 'deleteNotAvailablePresent' );
        }
    } );
    $( 'li[data-hash]' ).css( 'display', 'none' );
};
MSG.get.AvailableProd = function ( data ) {
    var el = $( 'li[data-hash="' + data.ProdHash + '"]' )
        , prod = Product.list[el.attr( 'data-id' )];
    el.css( 'display', '' );
    el.removeAttr( 'data-not_available' );
    if ( data.StopList ) {
        prod.inStoplist = true;
        el.addClass( 'stop_list_product' );
    } else {
        prod.inStoplist = false;
        el.removeClass( 'stop_list_product' );
    }
};
//--------------\ PRODUCT |----------------------------------------------------------

////////--------| Promotions |----------------------------------------------------------
if ( false ) {
    MSG.request.promotions = function () {
        var s = { "Table": "ProductOrder", "TypeParameter": "Promotions" };
        MSG.send( {
            structure: s, handler: function ( data ) {
                new Promotion( data );
            }, mHandlers: true

            , EOFHandler: function () {
                s = { "Table": "ProductOrder", "TypeParameter": "Subjects" };
                MSG.send( {
                    structure: s, handler: Promotion.Subjects, mHandlers: true,
                    EOFHandler: Promotion.setup
                } );
            }
        } );
    };
} else {
    MSG.request.promotions = function () {
        Promotion._getAllCounter = 0;
        var s = { "Table": "ProductOrder", "TypeParameter": "PromotionsTypes" };
        MSG.send( { structure: s, handler: PromotionType, mHandlers: true, EOFHandler: Promotion._getAll } );
        s = { "Table": "ProductOrder", "TypeParameter": "Promotions" };
        MSG.send( {
            structure: s, handler: function ( data ) {
                new Promotion( data );
            }, mHandlers: true, EOFHandler: Promotion._getAll
        } );
        s = { "Table": "ProductOrder", "TypeParameter": "Subjects" };
        MSG.send( { structure: s, handler: PromotionSubjects, mHandlers: true, EOFHandler: Promotion._getAll } );
    };
}
//--------------\ Promotions |----------------------------------------------------------

MSG.request.orderList = function ( ID, fn, EOFFn ) {
    var s = {
        "Table": "OrderList", "Query": "Read", "TypeParameter": "RangeOrderID",
        "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true, EOFHandler: EOFFn, check: false } );
};

// MSG.request.payment = function ( ID ) {
//     var s = { "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeOrderID", "Values": [ID] };
//     MSG.send( { structure: s, handler: MSG.get.payment, mHandlers: true } )
// };

MSG.request.orderPersonal = function ( ID, Role, fn ) {
    var s = {
        "Table": "OrderPersonal", "Query": "Read", "TypeParameter": "RangeRole"
        , "Values": [ID, Role]
        , "Limit": 10, "Offset": 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true } )
};

MSG.request.orderByDate = function ( start, end, limit, fn, EOFFn ) {
    var s = {
        Table: "Order", Query: "Read", TypeParameter: "RangeASC"
        , Values: [start, end], Limit: limit
        , Offset: 0
    };
    MSG.send( { structure: s, handler: fn || MSG.get.order, mHandlers: true, EOFHandler: EOFFn, check: false } )
};