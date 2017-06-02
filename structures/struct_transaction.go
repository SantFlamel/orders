package structures

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"project/orders/postgres"
	"sync"
)

//import "project/orders/structures"
var GuardClientTrans *sync.RWMutex

type StructTransact struct {
	orders  Orders
	buf     []byte
	row     *sql.Row
	rows     *sql.Rows
	Message *Message
}

func init()  {
	GuardClientTrans = &sync.RWMutex{}
}
func (st *StructTransact) init_order(NameTable string) error {
    switch NameTable {
    case "Order":
        st.orders = &Order{}
        break

    case "OrderCustomer":
        st.orders = &OrderCustomer{}
        break

    case "OrderList":
        st.orders = &OrderList{}
        break

    case "OrderPersonal":
        st.orders = &OrderPersonal{}
        break

    case "OrderPayments":
        st.orders = &OrderPayments{}
        break

    case "OrderStatus":
        st.orders = &OrderStatus{}
        break

    case "Cashbox":
        st.orders = &Cashbox{}
        break

    case "ChangeEmployee":
        st.orders = &ChangeEmployee{}
        break

    case "TimersCook":
        st.orders = &TimersCook{}
        break

    case "ProductOrder":
        break
        //return nil
    default:
        println("StructTrasact default")
        return errors.New("ERROR NOT IDENTIFICATION TABLE: "+NameTable)
    }
    return nil
}

//----Вставка в базу данных
func (st *StructTransact) Insert() (int,error) {
	GuardClientTrans.Lock()
	defer GuardClientTrans.Unlock()

	//Создаем транзацию
	tx, err := postgres.DB.Begin()
	if err != nil {
        println(err.Error())
		return -1,err
	}
	//Откатываем транзакцию
	defer tx.Rollback()
	var ok bool
    buf_int:=0
    fmt.Println(st.Message.Tables)
	for i, table := range st.Message.Tables {
        err = st.init_order(table.Name)
		if err !=nil{
            return -1,err
        }

		_, ok = postgres.Requests.RequestsList["execInsert" + table.Name + table.TypeParameter]
		if !ok {

		}
		println("--------------------")
		fmt.Println(table.Values)
		for ii,StructTable := range table.Values {
			st.buf, err = json.Marshal(StructTable)
			if err == nil {
				err = json.Unmarshal(st.buf, &st.orders)
				if err == nil {
					if table.TypeParameter == "GetID" && ii ==0 && i == 0{
						st.row = postgres.Requests.RequestsList["execInsert"+table.Name+table.TypeParameter].QueryRow(st.orders.ReturnValues()...)
                        st.row.Scan(&buf_int)
					} else {
						_, err = tx.Stmt(postgres.Requests.RequestsList["execInsert"+table.Name+table.TypeParameter]).Exec(st.orders.ReturnValues()...)
					}
				}
			}
			if err!=nil{println(err.Error());return -1,err}
		}

	}

	err = tx.Commit()
	if err != nil {
		return -1,err
	}
    if buf_int>0{
        return buf_int,err
    }
	return -1,err
}

//----Обновление в базе данных
func (st *StructTransact) Update() error {
    GuardClientTrans.Lock()
    defer GuardClientTrans.Unlock()

    //Создаем транзацию
    tx, err := postgres.DB.Begin()
    if err != nil {
        println(err.Error())
        return err
    }
    //Откатываем транзакцию
    defer tx.Rollback()
    var ok bool

    for _, table := range st.Message.Tables {
        ok = true
        //Инициализируем таблицу если она есть
        err = st.init_order(table.Name)
        if err == nil {_, ok = postgres.Requests.RequestsList["execInsert"+table.Name+table.TypeParameter]
            if ok {
                //Отправляем запрос в транзакцию
                _, err = tx.Stmt(postgres.Requests.RequestsList["execUpdate"+table.Name+table.TypeParameter]).Exec(table.Values...)
            }
        }

        //----Если не найдено или ошибка
        if err != nil || !ok {
            println("Mismatch request " + st.Message.Query + " for table:'" + table.Name + "' and type parameter:'" + table.TypeParameter + "'")
            return errors.New("Mismatch request " + st.Message.Query + " for table:'" + table.Name + "' and type parameter:'" + table.TypeParameter + "'")
        }

    }

    return nil
}

//----Чтение строки из базы данных
func (st *StructTransact) Read() error {
    m:=Message{}
    t := Table{}
    var err error
    m.Query = st.Message.Query

    for _, table := range st.Message.Tables {
        _, ok := postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter]
        if !ok {
            return errors.New("Missmatch request!")
        }
        st.row = postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter].QueryRow(table.Values...)
        err = st.orders.ReadRow(st.row)
        if err!=nil{
            return err
        }
        t.Name = table.Name
        t.TypeParameter = table.TypeParameter
        t.Values = append(t.Values,st.orders)
        m.Tables = append(m.Tables,t)
    }
    return nil
}

//----Чтение строк из базы данных
func (st *StructTransact) ReadRows() error {
    m:=Message{}
    t := Table{}
    var err error
    m.Query = st.Message.Query

    for _, table := range st.Message.Tables {
        _, ok := postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter]
        if !ok {
            return errors.New("Missmatch request!")
        }
        st.rows,err = postgres.Requests.RequestsList["queryRead"+table.Name+table.TypeParameter].Query(table.Values...)
        if err ==nil {
            for st.rows.Next() {
                err = st.orders.ReadRows(st.rows)
                if err != nil {
                    return err
                }
                t.Name = table.Name
                t.TypeParameter = table.TypeParameter
                t.Values = append(t.Values, st.orders)
            }
            m.Tables = append(m.Tables, t)
        }
    }
    return nil
}

func (st *StructTransact) Delete() error {
    return nil
}