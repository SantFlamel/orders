package structures

import (
	"encoding/json"
	"errors"
	"project/orders/postgres"
	"sync"
)

//import "project/orders/structures"
type Structurer struct {
	orders Orders
	rlock  *sync.RWMutex
	buf    []byte
}

func (st *Structurer) Orders(tables map[string][]interface{}) error {
	st.rlock.RLock()
	defer st.rlock.RUnlock()

	//Создаем транзацию
	tx, err := postgres.DB.Begin()
	if err != nil {
		return err
	}
	//Откатываем транзакцию
	defer tx.Rollback()
	var ok bool
	for table, mapstruct := range tables {
		//for table, _ := range tables{

		switch table {
		case "Order":
			st.orders = &Order{}
			_, ok = postgres.Requests.RequestsList["execInsert"+table+"GetID"]
			break

		case "OrderCustomer":
			st.orders = &OrderCustomer{}
			_, ok = postgres.Requests.RequestsList["execInsert"+table]
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
			return nil
		default:
			return errors.New("ERROR NOT IDENTIFICATION TYPE TABLE")
		}
		if !ok {
			return errors.New("Mismatch request!")
		}

		for str := range mapstruct {
			st.buf,err = json.Marshal(str)
            if err==nil{
                err = json.Unmarshal(st.buf,&st.orders)
                if err != nil{

                }
            }
		}

	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}
