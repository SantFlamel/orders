package server

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net"
	"project/orders/controller"
	"project/orders/structures"
	"strings"
	"strconv"
	"log"
)

//----------------------------------------------------------------------------------------------------------------------
/*----INTERFACE_STRUCT----*/
type Structure interface {
	Read(qm *structures.QueryMessage, stream *controller.Stream, conn net.Conn) error
	ReadeByteArray(stream *controller.Stream, conn net.Conn) error
}

type Orders interface {
	Insert(qm *structures.QueryMessage) (int64, error)
	ReadRow(row *sql.Row) error
	ReadRows(rows *sql.Rows) error
}

//----------------------------------------------------------------------------------------------------------------------
/*----INTERFACE_STRUCT----*/
type structure struct {
	conn   net.Conn
	qm     structures.QueryMessage
	stream *controller.Stream
	row    *sql.Row
	orders Orders
	Reads  structures.Read
	ID     int64
}

//----------------------------------------------------------------------------------------------------------------------
/*----READ_FOR_TABLE----*/
//----ORDER
func (st *structure) Read() error {
	var err error
	if len(st.qm.TypeParameter) < 6 {
		return errors.New("The length of the parameter type does not satisfy the requirements of")
	}

	switch st.qm.TypeParameter[5:11] {
	case "String":
		err = st.ReadeByteArray(st.stream)
	case "Boolea":
		err = st.ReadeByteArray(st.stream)
	case "Number":
		err = st.ReadeByteArray(st.stream)
	case "Struct":
		err = st.orders.ReadRow(st.stream.Row)
		if err == nil {
			mess, err := json.Marshal(st.orders)
			if err == nil {
				st.send(mess, nil)
			}
		}
	default:
		return errors.New("NOT IDENTIFICATION TYPE PARAMETERS")
	}

	return err
}

func (st *structure) ReadeByteArray(stream *controller.Stream) error {
	var buf []byte
	err := stream.Row.Scan(&buf)
	if err != nil {
		return err
	}
	st.send(buf, nil)
	return nil
}

//-----------------------------------------------------------------------------
func (st *structure) SelectTables(msg []byte) error {
	imsg := strings.Index(string(msg), "}")
	err := json.Unmarshal([]byte(msg[:imsg+1]), &st.qm)
	if err != nil {
		return errors.New("ERROR MARSHAL_STRUCT_TABLE")
	}
	if len(st.qm.TypeParameter) < 5 && st.qm.Query == "Read" {
		return errors.New("Length type parameter does not satisfy the requirement")
	}


	if len(msg) < imsg+2 {

		switch st.qm.Query {
		case "Update":
			all := structures.All{}
			err = all.Update(&st.qm)
			if err == nil {
				st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
			}
		case "Delete":
			all := structures.All{}
			err = all.Delete(&st.qm)
			if err == nil {
				st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
			}
		}

		//for _, item := range conf.Config.TLS_serv_reader {
         //   ClientOrder := structures.ClientOrder{IP:item,MSG:msg}
         //   go ClientOrder.Write()
		//}

		if err != nil {
			return err
		}

		if st.qm.Query != "Read" {
			return err
		}
	}

	switch st.qm.Table {
	case "Order":
		st.orders = &structures.Order{}

	case "OrderCustomer":
		st.orders = &structures.OrderCustomer{}

	case "OrderList":
		st.orders = &structures.OrderList{}

	case "OrderPersonal":
		st.orders = &structures.OrderPersonal{}

	case "OrderPayments":
		st.orders = &structures.OrderPayments{}

	case "OrderStatus":
		st.orders = &structures.OrderStatus{}

	case "Cashbox":
		st.orders = &structures.Cashbox{}

	case "Status":
		st.orders = &structures.Status{}

	case "TypePayment":
		st.orders = &structures.TypePayment{}

	case "TimersCook":
		st.orders = &structures.TimersCook{}

	case "ProductOrder":
		//Тут рассылка по вебьсокетам
		st.messageToWebSoc(msg)
		return nil
	default:
		return errors.New("ERROR NOT IDENTIFICATION TYPE TABLE")
	}

	switch st.qm.Query {
	case "Create":

		err = json.Unmarshal([]byte(msg[imsg+1:]), &st.orders)
		if err == nil {
			st.ID, err = st.orders.Insert(&st.qm)
			if err == nil {
				if st.ID != int64(-1) {
					st.send([]byte(strconv.FormatInt(st.ID, 10)), nil)
				} else {
					st.send([]byte(st.qm.Table+" NO ERRORS "+st.qm.Query+", TYPE PARAMETERS: \""+st.qm.TypeParameter+"\""), nil)
				}

				//for _, item := range conf.Config.TLS_serv_reader {
				//	ClientOrder := structures.ClientOrder{IP: item, MSG: msg}
				//	go ClientOrder.Write()
				//}
			}
		}
	case "Read":
		st.stream, err = st.Reads.Read(&st.qm)
		if err != nil {
			return err
		}
		switch st.qm.TypeParameter[:5] {
		case "Value":
			if st.qm.TypeParameter == "Value" {
				err = st.orders.ReadRow(st.stream.Row)
				if err == nil {
					mess, err := json.Marshal(st.orders)
					if err == nil {
						st.send(mess, nil)
					}
				}
			} else {
				err = st.Read()
			}
		case "Range":
			if st.stream.Rows == nil {
				st.send([]byte("EOF"), nil)
			} else {
				for st.stream.Rows.Next() {
					err = st.orders.ReadRows(st.stream.Rows)
					if err == nil {
						var mess []byte
						mess, err = json.Marshal(st.orders)
						if err == nil {
							st.send(mess, nil)
						}
					}
				}
			}

			st.send([]byte("EOF"), nil)
			go st.stream.Rows.Close()
		default:
			return errors.New("NOT IDENTIFICATION TYPE READ")
		}
	default:
		return errors.New("NOT IDENTIFIQTION QUERYS")
	}
	return err
}

func(s *structure) messageToWebSoc(msg []byte) {
	cl := structures.ClientList
	msg=append([]byte("02:{"),msg...)
	var err error
	for _,c := range cl{
		c.Send <- msg
		//if c.conn !=nil{
		//	err = c.conn.WriteMessage(1,msg)
		//}
	}

	if err != nil {
        log.Println(err.Error())
	}
}