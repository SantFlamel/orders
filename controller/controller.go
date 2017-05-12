package controller

import (
	"database/sql"
	"log"
	"project/orders/postgres"
	"sync"
)

type Manager struct{}

type Stream struct {
	Rows *sql.Rows
	Row  *sql.Row
}

//var guard *sync.RWMutex
//
//func init() {
//	guard = &sync.RWMutex{}
//}

//----------------------------------------------------------------------------------------------------------------------
//----FUNCTION_CREATION_ROW
func (m *Manager) Insert(Table, Query string, values ...interface{}) error {
	Guard.RLock(Table)
	defer Guard.RUnlock(Table)

	err := postgres.Requests.ExecTransact("execInsert"+Table+Query, values...)
	return err
}

func (m *Manager) InsertGetID(Table, Query string, values ...interface{}) (*sql.Row, error) {
	Guard.RLock(Table)
	defer Guard.RUnlock(Table)

	scan, err := postgres.Requests.QueryRow("execInsert"+Table+Query, values...)
	return scan, err
}

//----------------------------------------------------------------------------------------------------------------------
//----UPDATE_DATA
func (m *Manager) Update(Table, Query string, values ...interface{}) error {
	Guard.Lock(Table)
	defer Guard.Unlock(Table)

	err := postgres.Requests.ExecTransact("execUpdate"+Table+Query, values...)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----READ_ROW
func (s *Stream) ReadRow(Table, Query string, values ...interface{}) error {
	//Guard.RLock(Table)
	//defer Guard.RULock(Table)

	var err error
	s.Row, err = postgres.Requests.QueryRow("queryRead"+Table+Query, values...)

	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----READ_ROWS
func (s *Stream) ReadRows(Table, Query string, values ...interface{}) error {
	//Guard.RLock(Table)
	//defer Guard.RULock(Table)

	var err error
	s.Rows, err = postgres.Requests.Query("queryRead"+Table+Query, values...)

	return err
}

func (s *Stream) NextOrder() bool {
	for s.Rows.Next() {
		println("I am scan Rows.Next")
		var err error
		err = s.Rows.Scan()
		if err != nil {
			//log.Println("00:SCAN ROWS -", err.Error())
			log.Println("00:SCAN ROWS -", err.Error())
			continue
		}
		return true
	}
	return false
}

//----------------------------------------------------------------------------------------------------------------------
//----DELETE
func (m *Manager) Delete(Table, Query string, values ...interface{}) error {
	Guard.Lock(Table)
	defer Guard.Unlock(Table)

	err := postgres.Requests.ExecTransact("execDelete"+Table+Query, values...)
	return err
}

//======================================================================================================================
//======================================================================================================================
var Guard Guards

type Guards struct {
	Order         *sync.RWMutex
	OrderCustomer *sync.RWMutex
	OrderList     *sync.RWMutex
	OrderPersonal *sync.RWMutex
	OrderPayments *sync.RWMutex
	OrderStatus   *sync.RWMutex
	TimersCook    *sync.RWMutex
	Status        *sync.RWMutex
	TypePayment   *sync.RWMutex
	Cashbox       *sync.RWMutex
	DefaultGuard  *sync.RWMutex
}

func (g *Guards) Init() {
	g.Order         = &sync.RWMutex{}
	g.OrderCustomer = &sync.RWMutex{}
	g.OrderList     = &sync.RWMutex{}
	g.OrderPersonal = &sync.RWMutex{}
	g.OrderPayments = &sync.RWMutex{}
	g.OrderStatus   = &sync.RWMutex{}
	g.TimersCook    = &sync.RWMutex{}
	g.Status        = &sync.RWMutex{}
	g.TypePayment   = &sync.RWMutex{}
	g.Cashbox       = &sync.RWMutex{}
	g.DefaultGuard  = &sync.RWMutex{}
}

func (g *Guards) Lock(table string) {
	switch table {
	case "Order":
		g.Order.Lock()
		break
	case "OrderCustomer":
		g.OrderCustomer.Lock()
		break
	case "OrderList":
		g.OrderList.Lock()
		break
	case "OrderPersonal":
		g.OrderPersonal.Lock()
		break
	case "OrderPayments":
		g.OrderPayments.Lock()
		break
	case "OrderStatus":
		g.OrderStatus.Lock()
		break
	case "TimersCook":
		g.TimersCook.Lock()
		break
	case "Status":
		g.Status.Lock()
		break
	case "TypePayment":
		g.TypePayment.Lock()
		break
	case "Cashbox":
		g.Cashbox.Lock()
		break
	default:
		g.DefaultGuard.Lock()
	}
}

func (g *Guards) Unlock(table string) {
	switch table {
	case "Order":
		g.Order.Unlock()
		break
	case "OrderCustomer":
		g.OrderCustomer.Unlock()
		break
	case "OrderList":
		g.OrderList.Unlock()
		break
	case "OrderPersonal":
		g.OrderPersonal.Unlock()
		break
	case "OrderPayments":
		g.OrderPayments.Unlock()
		break
	case "OrderStatus":
		g.OrderStatus.Unlock()
		break
	case "TimersCook":
		g.TimersCook.Unlock()
		break
	case "Status":
		g.Status.Unlock()
		break
	case "TypePayment":
		g.TypePayment.Unlock()
		break
	case "Cashbox":
		g.Cashbox.Unlock()
		break
	default:
		g.DefaultGuard.Unlock()
	}
}

func (g *Guards) RLock(table string) {
	switch table {
	case "Order":
		g.Order.RLock()
		break
	case "OrderCustomer":
		g.OrderCustomer.RLock()
		break
	case "OrderList":
		g.OrderList.RLock()
		break
	case "OrderPersonal":
		g.OrderPersonal.RLock()
		break
	case "OrderPayments":
		g.OrderPayments.RLock()
		break
	case "OrderStatus":
		g.OrderStatus.RLock()
		break
	case "TimersCook":
		g.TimersCook.RLock()
		break
	case "Status":
		g.Status.RLock()
		break
	case "TypePayment":
		g.TypePayment.RLock()
		break
	case "Cashbox":
		g.Cashbox.RLock()
		break
	default:
		g.DefaultGuard.RLock()
	}
}

func (g *Guards) RUnlock(table string) {
	switch table {
	case "Order":
		g.Order.RUnlock()
		break
	case "OrderCustomer":
		g.OrderCustomer.RUnlock()
		break
	case "OrderList":
		g.OrderList.RUnlock()
		break
	case "OrderPersonal":
		g.OrderPersonal.RUnlock()
		break
	case "OrderPayments":
		g.OrderPayments.RUnlock()
		break
	case "OrderStatus":
		g.OrderStatus.RUnlock()
		break
	case "TimersCook":
		g.TimersCook.RUnlock()
		break
	case "Status":
		g.Status.RUnlock()
		break
	case "TypePayment":
		g.TypePayment.RUnlock()
		break
	case "Cashbox":
		g.Cashbox.RUnlock()
		break
	default:
		g.DefaultGuard.RUnlock()
	}
}
