function setupSessionInfo( data ) {
    SESSION_INFO = data;
    $( '.cashierFIO' ).html( SESSION_INFO.FirstName + " " + SESSION_INFO.SecondName );
    CashBox.getSumInCashbox();
    MSG.request.tabel( SESSION_INFO.UserHash );

    // if ( TEST ) {
//     waitProp( function () {
//         Page.show.makeOrder();
//         Page.show.Carts();
//     }, function () {
//         return SESSION_INFO.OrganizationHash;
//     } );
// } else {
    Page.show.Cassir();
// }
// Page.show.DescriptionOrder();
// Order.list[382].showDescription();
// Cart.Products[12].showDescription(); //TEST
// Page.update();
// Page.show.CashBox();
// Page.show.Operator();
// Page.show.delivery();
}
webSocket();

//--------------\ MSG |----------------------------------------------------------
// TODO: проверить работу обновлений при новом заказе.
MSG.update = function ( data ) {
    console.log( 'MSG.update' );
    var ID = data.Values[0];
    if ( data.ID_msg !== SESSION_INFO.OrganizationHash && data.ID_msg !== '' ) { // фильтр по организации
        console.groupEnd();
        return;
    }
    console.log( 'data.Table', data.Table );
    switch ( data.Table ) {
        case "Order":
            warningAudio();
            break;
        // case "OrderCustomer":
        //     break;
        // case "OrderList":
        //     break;
        case "Cashbox":
            console.group( 'Cashbox', data.Values[1] );
            if ( Order.list[data.Values[1]] ) {
                MSG.request.payment( data.Values[1] );
            } else {
            }
            console.groupEnd();
            break;
        // case "OrderPersonal":
        //     break;
        case "OrderStatus":
            // console.log( "OrderStatus" );
            if ( Order.list[ID] ) {
                var st = { Order_id_item: data.Values[1], Status_id: data.Values[2] };
                Order.list[ID].addStatus( st );
            } else if ( data.Values[1] === 0 ) {
                MSG.request.order( ID, MSG.get.order );
            }
            break;
    }
};

////////--------| User_info |----------------------------------------------------------
MSG.request.ChangeEmployee = function ( id ) {
    var s = { Table: "ChangeEmployee", Query: "Read", TypeParameter: "Value", Values: [id], Limit: 1, Offset: 0 };
    MSG.send( {
        structure: s, handler: false, mHandlers: false, EOFHandler: false, check: false
    } );
};
MSG.set.ChangeEmployee = function () {
    var s = [{ Table: "ChangeEmployee", Query: "Create", TypeParameter: "GetID", Values: null, Limit: 0, Offset: 0 }
        , {
            UserHash: SESSION_INFO.UserHash, OrgHash: SESSION_INFO.OrganizationHash, Sum_in_cashbox: null
            , NonCash_end_day: null, Cash_end_day: null
        }];
    MSG.send( {
        structure: s, handler: CashBox.getSumInCashbox, mHandlers: false, EOFHandler: false, check: false
    } );
};
MSG.close.ChangeEmployee = function ( sum_in_cashbox, non_cash_end_day, cash_end_day ) {
    var s = {
        Table: "ChangeEmployee", Query: "Update", TypeParameter: "Close"
        , Values: [SESSION_INFO.ChangeEmployee.ID, sum_in_cashbox, non_cash_end_day, cash_end_day, Page.time()]
        , Limit: 0, Offset: 0
    };
    MSG.send( { structure: s, handler: false, mHandlers: false, EOFHandler: false, check: false } );
};
MSG.request.ChangeEmployeeByOrgHash = function ( close, fn, EOFFn ) {
    var s = {
        Table: "ChangeEmployee", Query: "Read", TypeParameter: "RangeCloseOrgHash"
        , Values: [SESSION_INFO.OrganizationHash, close], Limit: 9999, Offset: 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true, EOFHandler: EOFFn, check: false } );
};
MSG.request.ChangeEmployeeByOrgHashUserHash = function ( close, limit, fn, eofFn ) {
    var s = {
        Table: "ChangeEmployee", Query: "Read", TypeParameter: "RangeCloseUserHashOrgHash"
        , Values: [SESSION_INFO.UserHash, SESSION_INFO.OrganizationHash, close], Limit: limit || 10, Offset: 0
    };
    fn = fn || false;
    eofFn = eofFn == undefined ? false : eofFn;
    MSG.send( { structure: s, handler: fn, mHandlers: true, EOFHandler: eofFn, check: false } );
};
//--------------\ User_info |----------------------------------------------------------

////////--------| ORDER |----------------------------------------------------------
MSG.request.ordersByOrgHash = function () {
    if ( !SESSION_INFO.OrganizationHash ) {
        setTimeout( MSG.request.ordersByOrgHash, WS_WAIT_RE );
        return;
    }
    var s = {
        "Table": "Order", "Query": "Read", "TypeParameter": "RangeOrgHash",
        "Values": [SESSION_INFO.OrganizationHash, BEGIN_TIME_FOR_ORDER, Page.time()],
        "Limit": 999, "Offset": 0
    };
    MSG.send( {
        structure: s, handler: MSG.get.order, mHandlers: true, EOFHandler: false
    } )
};
MSG.get.order = function ( data ) {
    new Order( data );
    MSG.request.orderStatus( data.ID );
};
//--------------\ ORDER |----------------------------------------------------------
////////--------| ORDER_LIST |----------------------------------------------------------
MSG.get.orderList = function ( data ) {
    if ( Order.list[data['Order_id']] ) {
        var order = Order.list[data['Order_id']];
        if ( !order.OrderList ) {
            order.OrderList = {}
        }
        if ( data.CookingTracker == 0 ) {
            data.status = 8;
            data.Finished = true;
        }
        order.OrderList[data['ID_item']] = data;
        MSG.request.orderStatus( data['Order_id'], data['ID_item'] );
    }
};
//--------------\ ORDER_LIST |----------------------------------------------------------
////////--------| STATUS |----------------------------------------------------------
MSG.request.orderStatus = function ( ID, ID_item, fn ) {
    var s = {
        "Table": "OrderStatus", "Query": "Read", "TypeParameter": "ValueStructIDOrdIDit"
        , "Values": [ID, ID_item || 0], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: fn || MSG.get.Status } );
};
MSG.get.Status = function ( data ) {
    if ( data.Order_id !== 0 && Order.list[data.Order_id] ) {
        Order.list[data.Order_id].addStatus( data )
    }
};

MSG.request.allStatusOrder = function ( ID, fn, EOFFn ) {
    var s = {
        "Table": "OrderStatus", "Query": "Read"
        , "TypeParameter": "RangeOrderID", "Values": [ID], "Limit": 999, "Offset": 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true, EOFHandler: EOFFn } );
};
// Подсчёт времени готовки
// MSG.get.allStatusOrder = function ( data ) {
//     if ( !MSG.get.hasOwnProperty( '_allStatusOrder' ) ) {
//         MSG.get._allStatusOrder = []
//     }
//     MSG.get._allStatusOrder.push( data )
// };
// MSG.get.timeCock = function () {
//     var i, ii, s = {}, len, t1, t2;
//     for ( i in MSG.get._allStatusOrder ) {
//         ii = MSG.get._allStatusOrder[i];
//         if ( ii.Status_id == 4 || ii.Status_id == 8 ) {
//             if ( !s.hasOwnProperty( ii.Order_id_item ) ) {
//                 s[ii.Order_id_item] = [];
//             }
//             s[ii.Order_id_item].push( ii );
//         }
//     }
//     for ( i in s ) {
//         ii = s[i];
//         len = ii.length;
//         if ( len < 1 ) {
//             continue
//         } else if ( len == 2 ) {
//             t1 = new Date( ii[0].Time );
//             t2 = new Date( ii[1].Time );
//             Order.list[ii[0].Order_id].OrderList[ii[0].Order_id_item].cookTime = t1 - t2;
//         }
//     }
// };
//--------------\ STATUS |----------------------------------------------------------


//////--------| CashBox |----------------------------------------------------------
MSG.set.cashBoxOperation = function ( operation ) {
    operation.UserHash = SESSION_INFO.UserHash;
    operation.OrgHash = SESSION_INFO.OrganizationHash;

    var s = [{ "Table": "Cashbox", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0 }
        , operation];
    MSG.send( {
        structure: s, handler: function ( data ) {
            MSG.request.cashBoxOperation( +data );
        }, check: true
    } );
};
MSG.request.cashBoxOperationByDate = function ( date ) {
    date = date || Page.timeBeginDay();
    if ( SESSION_INFO.OrganizationHash ) {
        var s = {
            "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeUserAndOrdAndTime"
            , "Values": [SESSION_INFO.UserHash, SESSION_INFO.OrganizationHash, date, Page.time()]
            , "Limit": 999, "Offset": 0
        };
        MSG.send( { structure: s, handler: Operation, mHandlers: true } )
    } else {
        setTimeout( arguments.callee, 50 )
    }
};
MSG.request.cashBoxOperationByChangeEmployee = function ( ID, fn, EOFFn ) {
    if ( !fn ) {
        CashBox.reset();
        fn = Operation;
    }
    var s = {
        "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeChangeEmployeeID"
        , "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true, EOFHandler: EOFFn } )
};
MSG.request.cashBoxOperation = function ( ID ) {
    var s = {
        "Table": "Cashbox", "Query": "Read", "TypeParameter": "Value", "Values": [ID], "Limit": 0, "Offset": 0
    };
    MSG.send( { structure: s, handler: Operation, mHandlers: true } )
};
MSG.request.payment = function ( ID ) {
    var s = { "Table": "Cashbox", "Query": "Read", "TypeParameter": "RangeOrderID", "Values": [ID] };
    Order.list[ID].payments = [];
    MSG.send( { structure: s, handler: MSG.get.payment, mHandlers: true } )
};
MSG.get.payment = function ( data ) {
    if ( !Order.list[data.Order_id] ) {
        console.error( 'Нет заказа', data );
        return;
    }
    var order = Order.list[data.Order_id];
    order.payments.push( data );
    if ( document.title.split( '#' )[1] == data.Order_id ) {
        Order.list[data['Order_id']].calcPayment();
    }
};
MSG.request.paymentByDeliveryman = function ( type_payments, user_hash, time_operation_begin, time_operation_end ) {
    var s = {
        "Table": "Cashbox", "Query": "Read"
        , "TypeParameter": "ValueNumberCountPriceWithDiscount"
        , "Values": [user_hash
            , SESSION_INFO.OrganizationHash, type_payments, time_operation_begin, time_operation_end]
        , "Limit": 0, "Offset": 0
    };
    MSG.send( {
        structure: s, handler: function () { // самоисполляющаяся
            return function ( data ) {
                Deliveryman.list[user_hash].addPay( type_payments, +data );
            }
        }(), mHandlers: true
    } );
};
MSG.request.rePrintCheck = function ( order_id ) {
    MSG.send( { structure: { "Table": "Printer", "Values": [order_id] } } )
};
MSG.request.dayOverPrintCheck = function () {
    var s = {
        "Table": "Printer", "TypeParameter": "AllRange",
        "Values": [SESSION_INFO.OrganizationHash, SESSION_INFO.UserHash, Page.timeBeginDay(), Page.time()]
    };
    MSG.send( { structure: s } )
};
//--------------\ CashBox |----------------------------------------------------------|


////////--------| customerByTel from order |----------------------------------------------------------
// MSG.request.customerByTel = function () {
//     var tel = getPhone(), s = {
//         "Table": "OrderCustomer", "Query": "Read", "TypeParameter": "RangeByPhone", "Values": [tel], "Limit": 999,
//         "Offset": 0
//     };
//     MSG.send( {
//         structure: s, handler: function ( data ) {
//             if ( data.Order_id !== 0 ) {
//                 new Customer( data );
//             }
//         }, mHandlers: true
//     } );
//     Customer.list = [];
// };
// MSG.get.CostumerInfoByTel = function ( data ) {
//     if ( data.Order_id !== 0 ) {
//         new Customer( data );
//     }
// };
//--------------\ customerByTel from order |----------------------------------------------------------;


////////--------| Получение_кakoго ни-бдуь |----------------------------------------------------------
MSG.request.personal = function ( HashOrg, RoleHash, handler, mHandler ) {
    var s = {
        "Table": "Session", "TypeParameter": "ReadHashNotRights", "Values": [HashOrg + '', RoleHash + ""]
    };
    MSG.send( { structure: s, handler: handler, mHandlers: true, EOFHandler: mHandler || false } );
    MSG.get._personal = {};
};
MSG.get.personal = function ( data ) {
    MSG.get._personal[data.UserHash] = data;
};
MSG.set.personal = function ( ID, Order_id_item, del ) {
    console.group( 'MSG.set.personal' );
    var cassir = del || SESSION_INFO;
    var s = [{
        "Table": "OrderPersonal", "Query": "Create", "TypeParameter": "", "Values": null, "Limit": 0, "Offset": 0
    }, {
        "Order_id": +ID, "Order_id_item": +Order_id_item, "UserHash": cassir.UserHash, "FirstName": cassir.FirstName,
        "SecondName": cassir.SecondName, "SurName": cassir.SurName, "RoleHash": cassir.RoleHash,
        "RoleName": cassir.RoleName
    }];
    console.log( 's', s );
    MSG.send( { structure: s, check: true } );
    console.groupEnd();
};
MSG.request.personalByOrder = function ( ID, fn, EOFFn ) {
    var s = {
        Table: "OrderPersonal", Query: "Read"
        , TypeParameter: "RangeOrderID", Values: [ID], Limit: 999, Offset: 0
    };
    MSG.send( { structure: s, handler: fn, mHandlers: true, EOFHandler: EOFFn, check: '', errorHandler: '' } )
};
//--------------\ Получение_кakoго ни-бдуь |----------------------------------------------------------

