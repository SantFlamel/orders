MSG.request.clientInfo = function ( tel ) {
    tel = tel || getPhone();
    var s = { "Table": "ClientInfo", "TypeParameter": "ReadClient", "Values": [tel] };
    MSG.send( { structure: s, handler: MSG.get.clientInfo } );
    s = { "Table": "ClientInfo", "TypeParameter": "ReadAddress", "Values": [tel] };
    MSG.send( {
        structure: s, handler: function ( data ) {
            $( "#accordion1" ).append( makeAddress( data, $( '#accordion1>div' ).length, data.ID ) )
        }, mHandlers: true, EOFHandler: MSG.attachForLoadingAdress
    } );
};

/** запрос клиет инфо */
$( '#loadtel' ).on( 'click', function () {
    $( "#accordion1" ).empty().append( makeAddress( {}, 0 ) );
    MSG.request.clientInfo();
    bindTypeaheadAddress();
} );

$( document ).on( 'change', ".operator_client_adress  .collapse.in input", function () {
    this.parentNode.parentNode.parentNode.parentNode.parentNode.dataset.id_address = '';
} );
MSG.get.clientInfo = function ( data ) {
    document.getElementById( 'black_list' ).innerHTML = data.BlackList ? ALERT_CLIENT_IN_BLACK_LIST : '';
};


/** создание лемента для списка адресов */
function makeAddress( s, i, id ) {
    s = s || {};
    var x = '';
    if ( id ) {
        x = ' data-id_address="' + id + '" '
    }
    return '<div ' + x + ' class="panel"> <div class="panel-heading" role="tab" id="heading' + 1 + i + '">' +
        '  <a class="collapsed" role="button" data-toggle="collapse" data-parent="#accordion1"' +
        ' href="#collapse' + 1 + i + '" aria-expanded="false" aria-controls="collapse' + 1 + i + '">' + ' ' +
        (s.Street || '') + ' д. ' + (s.House || '') + ' ' +
        ((s.Building > 0) ? (s.Building || '') : "") + ', кв. ' + ( s.Apartment || '') +
        ' ' + '</a> </div>' + '<div id="collapse' + 1 + i +
        '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' + 1 + i + '">' +
        '<div class="panel-body">' +
        '<input autocomplete="off" id="street_client" class="col-sm-12 typeahead" type="text" placeholder="Введите адрес" value="' +
        (s.Street || '') + '">' + '<div class="row">' +
        '<label class="col-sm-4" for="home_number">Дом <input autocomplete="off" id="home_number" type="text" value="' +
        (s.House || '') + '"></label>' +
        '<label class="col-sm-4" for="corp_str">Корп./Стр. <input autocomplete="off" id="corp_str" type="text" value="' +
        (s.Building || '') + '"></label>' +
        '<label class="col-sm-4" for="kv_of">Кв./Оф. <input autocomplete="off" id="kv_of" type="text" value="' +
        (s.Apartment || '') + '"></label>' + '</div>' + '<div class="row">' +
        '<label class="col-sm-4" for="podyezd">Подъезд <input autocomplete="off" id="podyezd" value="' +
        (s.Entrance || '') + '" type="text"></label>' +
        '<label class="col-sm-4" for="level">Этаж <input autocomplete="off" id="level" type="text" value="' +
        (s.Floor || '') + '"></label>' +
        '<label class="col-sm-4" for="cod">Код <input autocomplete="off" id="cod" value="' +
        (s.DoorphoneCode || '') + '" type="text"></label>' + '</div> <div class="pull-right">' +
        '<input autocomplete="off" type="checkbox" id="domofon"><label style="font-size: 14px" for="domofon">Домофон</label>' +
        '</div> </div> </div> </div>';
}


/** проверка адреса для зон доставки */
MSG.attachForLoadingAdress = function () {
    $( document ).ready( function () {
        //проверка адреса доставки при изменении
        $( ".operator_client_adress .collapse #street_client, .operator_client_adress .collapse #home_number" ).change( function () {

            if ( $( '.delivery_met.active a' ).first().html() === DELIVERY )
                MSG.request.deliveryZone(
                    $( "#city_client" ).val(),
                    $( ".operator_client_adress .collapse.in #street_client" ).val(),
                    $( ".operator_client_adress .collapse.in #home_number" ).val() );
        } );
        $( ".operator_client_adress" ).find( ".panel-heading" ).on( "click", function () {
            if ( $( '.delivery_met.active a' ).first().html() === DELIVERY )
                MSG.request.deliveryZone(
                    $( "#city_client" ).val(),
                    $( this ).next().find( "#street_client" ).val(),
                    $( this ).next().find( "#home_number" ).val() );
        } );
        //автоподстановка адреса
        bindTypeaheadAddress();
    } );
};

////////--------| Autocomplite |----------------------------------------------------------

var substringMatcher = function ( strs ) {
    return function findMatches( q, cb ) {
        var matches, substringRegex;
        matches = [];
        substringRegex = new RegExp( q, 'i' );
        $.each( strs, function ( i, str ) {
            if ( substringRegex.test( str ) ) {
                matches.push( str );
            }
        } );

        cb( matches );
    };
};
function bindTypeaheadAddress() {
    $( '.operator_client_adress .collapse #street_client' ).typeahead( {
        hint: false, highlight: true, minLength: 1
    }, {
        name: 'Street', source: substringMatcher( typeaheadStreet )
    } );
}


var typeaheadStreet = ['1-й микрорайон',
    'микрорайон 1а',
    '2-й микрорайон',
    '3-й микрорайон',
    '4-й микрорайон',
    '5-й микрорайон',
    '6-й микрорайон',
    'микрорайон 6а',
    '7-й микрорайон',
    '11-й микрорайон',
    '16-й микрорайон',
    '1 Мая',
    '2351',
    '8 Марта',
    '8 Райсъезда',
    '9 Мая',
    '9 Января',
    'Авиационная',
    'Автозаводская 1-я',
    'Автозаводская 2-я',
    'Автозаводская',
    'Агрономическая',
    'Акмолинская',
    'Алексеева',
    'Алябьева',
    'Анфиногенова',
    'Арбинская',
    'Аргентовского',
    'Артема',
    'Аэропорт',
    'Бажова',
    'Баумана',
    'Башняговского',
    'Бедного',
    'Демьяна Бедного',
    'Белинского',
    'Березовая',
    'Березовая',
    'Библиотечный переулок',
    'Блюхера',
    'Василия Блюхера',
    'Больничная 4-я',
    'Больничная 5-я',
    'Больничная 6-я',
    'Больничная 7-я',
    'Больничная 9-я',
    'Больничная 10-я',
    'Боровлянский переулок',
    'Бородина',
    'Бошняковская',
    'Братская',
    'Булавина',
    'Бурова-Петрова',
    'Вагонная',
    'Варгашинский переулок',
    'Васильева',
    'Ватутина',
    'Введенский переулок',
    'Витебского',
    'Вишневая',
    'Войкова',
    'Володарского',
    'Встречный переулок',
    'Выгонная',
    'Высоковольтный переулок',
    'Гагарина',
    'Гайдара',
    'Галкинская',
    'Галкинский переезд',
    'Гаражная',
    'Гастелло',
    'Гвардейская',
    'Гвардейский переулок',
    'Герцена',
    'Глинки',
    'Глинская',
    'Гоголя',
    'Голикова проспект',
    'Гончарова',
    'Городской сад парк',
    'Горького',
    'Горяева',
    'Грибоедова',
    'Гризодубовой',
    'Грицевца',
    'Громовой',
    'Губанова',
    'Дальний переулок',
    'Дамбовая',
    'Дачный переулок',
    'Декабристов',
    'Джамбула',
    'Дзержинского переулок',
    'Дзержинского',
    'Димитрова',
    'Добролюбова',
    'Доватора',
    'Докучаева',
    'Дома Кургансельмаша',
    'Дома Мелькомбината',
    'Дома МСУ',
    'Донского',
    'Достоевского',
    'Дружбы',
    'Дундича',
    'Епишева',
    'Ермака',
    'Жданова',
    'Железнодорожный переулок',
    'Жуковского',
    'Заводская 1-я',
    'Загорная',
    'Загородный переулок',
    'Зайковский переулок',
    'Зайцева',
    'Западный переулок',
    'Заречная',
    'Заслонова',
    'Затобольный переулок',
    'Зауральская',
    'Зеленая',
    'Зеленый переулок',
    'Земнухова',
    'Зорге',
    'Иковский переулок',
    'Илизарова',
    'Интернатовская',
    'Интернациональная',
    'Ипподромная',
    'Иртышская',
    'Исетская',
    'Калашниковское торфопредприятие',
    'Калинина',
    'Карбышева',
    'Карельцева',
    'Катайский переулок',
    'Керамическая',
    'Кетовский переулок',
    'Кирова',
    'Кирпичная',
    'Климова',
    'Колхозная',
    'Кольцевая',
    'Комиссаров',
    'Коммунальная',
    'Комсомольская',
    'Конституции проспект',
    'Кооперативная',
    'Короленко',
    'Косая',
    'Космодемьянской',
    'Зои Космодемьянской',
    'Космонавтов',
    'Кособродский переулок',
    'Котовского',
    'Кошевого',
    'Кравченко',
    'Красина',
    'Краснодонская',
    'Красномаячная',
    'Красномаячный переулок',
    'Кремлева',
    'Криволапова',
    'Крупской',
    'Крутикова',
    'Крылова',
    'Кузнецова',
    'Куйбышева переулок',
    'Куйбышева',
    'Кулибина',
    'Культурный переулок',
    'Куприна',
    'Курганская',
    'Куртамышская',
    'Кустанайская',
    'Ладыгина',
    'Лазо',
    'Ленина',
    'Ленинградская',
    'Лермонтова',
    'Лескова',
    'Лесопарковая',
    'Линейная',
    'Локомотивная',
    'Ломоносова',
    'Луговая',
    'Луначарского',
    'Майкова',
    'Макаренко',
    'Малая Южная',
    'Малиновский переулок',
    'Малиновского',
    'Малочаусовский переулок',
    'Мальцева',
    'Мамина-Сибиряка',
    'Маркса',
    'Карла Маркса',
    'Матросова',
    'Машиностроителей переулок',
    'Машиностроителей проспект',
    'Маяковского',
    'Маячная 1-я',
    'Маячная 2-я',
    'Маячная',
    'Межевая 1-я',
    'Межевая 2-я',
    'Мелькомбинат',
    'Менделеева',
    'Мечникова',
    'Мира бульвар',
    'Мичурина',
    'Молодежи парк',
    'Молодежи переулок',
    'Молодежи',
    'Молодой Гвардии',
    'Монтажников',
    'Московская',
    'Мост Тобол',
    'Мостовая',
    'Мостопоезд',
    'Мостостроителей',
    'Мусоргского',
    'Мяготина',
    'Коли Мяготина',
    'Набережная',
    'Нагорная',
    'Нагорный переулок',
    'Нахимова',
    'Невежина',
    'Невского',
    'Некрасова',
    'Нефтебаза',
    'Новаторов',
    'Новая',
    'Новогалкинская',
    'Новоселов',
    'Новостроек',
    'Овражная',
    'Огарева',
    'Огинского',
    'Огородная',
    'Огородный переулок',
    'Односторонка 1-я',
    'Односторонка 2-я',
    'Односторонка',
    'Одоевского',
    'Озерная',
    'Октябрьская',
    'Олимпийская',
    'Омская',
    'Омский переулок',
    'Орджоникидзе',
    'Орлова',
    'Осипенко',
    'Островского',
    'Отдыха',
    'Откормсовхоз',
    'Павлова',
    'Панфилова',
    'Парижской Коммуны',
    'Партизанская',
    'Пархоменко',
    'Первомайский переулок',
    'Перова',
    'Пестеля',
    'Песчаная',
    'Песчаный переулок',
    'Петропавловская',
    'Пионерская',
    'Пирогова',
    'Пичугина',
    'Плеханова',
    'Плодопитомник',
    'Победы',
    'Пограничная',
    'Полевая площадь Полевая',
    'Ползунова',
    'Половинская',
    'Полярная',
    'Попова переулок',
    'Попова',
    'Почтовая',
    'Правды',
    'Прибрежная',
    'Пригородная',
    'Пролетарская',
    'Промышленная',
    'Просветский переулок',
    'Профсоюзная',
    'Проходная',
    'Птицефабрика',
    'Пугачева',
    'Пурица',
    'Пушкина',
    'Рабоче-Крестьянская',
    'Рабочий переулок',
    'Радиомаяк',
    'Радионова',
    'Радищева',
    'Радужный переулок',
    'Разина',
    'Репина',
    'Репниных',
    'Родниковая',
    'Родькина',
    'Рубинштейна',
    'Рылеева',
    'Рябиновая',
    'Рябковская',
    'Савельева',
    'Савельевский переезд',
    'Садовая',
    'Садовый переулок',
    'Сады Зауралья',
    'Саратовский переулок',
    'Свердлова',
    'Свободы',
    'Сельская',
    'Серова',
    'Сеченова',
    'Сибирская',
    'Слосмана площадь',
    'Смирнова',
    'СМП-290',
    'Советская',
    'Совхозный переулок',
    'Солнечная',
    'Солнечный бульвар',
    'Союзная',
    'Спартака переулок',
    'Спартака',
    'Спортивная',
    'Спортивный переулок',
    'Стальского',
    'Станционная',
    'Строительный переулок',
    'Стройбаза',
    'Суворова',
    'Сурикова',
    'Сусанина',
    'Сухэ-Батора',
    'Тельмана',
    'Тепловозная',
    'Техническая',
    'Тимирязева',
    'Тобольная',
    'Товарная',
    'Томина',
    'Томская',
    'Торфопредприятие',
    'Трактовая 1-я',
    'Трактовая 2-я',
    'Тропинина',
    'Тургенева переулок',
    'Тюленина',
    'Тюменская',
    'Тютчева',
    'Увальская',
    'Ульяновой',
    'Марии Ульяновой',
    'Уральская',
    'Урицкого',
    'Урожайная',
    'Уфимская',
    'Ушакова',
    'Февральская',
    'Фестивальная',
    'Филатова',
    'Фрунзе',
    'Фурманова',
    'Хабаровская',
    'Халтурина',
    'Химмашевская',
    'Хмельницкого',
    'Цвиллинга',
    'Целинная',
    'Центральная',
    'Центральная',
    'Центральная',
    'Цеткин',
    'Циолковского',
    'ЦПКиО парк',
    'Чайковского',
    'Чапаева',
    'Часовая 2-я',
    'Часовая',
    'Чаусовская',
    'Чашинский переулок',
    'Челюскинцев',
    'Челябинская',
    'Черемуховская',
    'Чернореченская',
    'Чернышевского',
    'Черняховского',
    'Чехова',
    'Чистое поле',
    'Чистопрудный переулок',
    'Чистый переулок',
    'Чкалова',
    'Шатровский переулок',
    'Шевелевская',
    'Шевцовой',
    'Шевченко переулок',
    'Шевченко',
    'Широкий переулок',
    'Школьная',
    'Шумана',
    'Щорса',
    'Элеваторный переулок',
    'Электровозная',
    'Энгельса переулок',
    'Энергетическая',
    'Юбилейная',
    'Югова',
    'Южная',
    'Юлаева',
    'Юннатов',
    'Юргамышская',
    'Яблочкина',
    'Ялуторовская',
    'Ястржембского'];
bindTypeaheadAddress();

//--------------\ Autocomplite |----------------------------------------------------------

