package postgres

import (
	"database/sql"
	"errors"
	"log"
	"sync"
)



type Stream struct {
	Rows *sql.Rows
	Row  *sql.Row
}

func (dbr *DBRequests) Insert(Table, Query string, values ...interface{}) error {
	Guard.RLock(Table)
	defer Guard.RUnlock(Table)

	_, ok := dbr.RequestsList["execInsert"+Table+Query]
	if !ok {
		return errors.New("Mismatch request!")
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList["execInsert"+Table+Query]).Exec(values...)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}

func (dbr *DBRequests) InsertGetID(Table, Query string, values ...interface{}) (*sql.Row, error) {
	Guard.RLock(Table)
	defer Guard.RUnlock(Table)

	_, ok := dbr.RequestsList["execInsert"+Table+Query]
	if !ok {
		return nil, errors.New("Missmatch request!")
	}

	row := dbr.RequestsList["execInsert"+Table+Query].QueryRow(values...)

	return row, nil
}

//----------------------------------------------------------------------------------------------------------------------
//----UPDATE_DATA
func (dbr *DBRequests) Update(Table, Query string, values ...interface{}) error {
	Guard.Lock(Table)
	defer Guard.Unlock(Table)

	_, ok := dbr.RequestsList["execUpdate"+Table+Query]
	if !ok {
		return errors.New("Mismatch request!")
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList["execUpdate"+Table+Query]).Exec(values...)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----READ_ROW
func (s *Stream) ReadRow(Table, Query string, values ...interface{}) error {
	Guard.RLock(Table)
	defer Guard.RUnlock(Table)

	_, ok := Requests.RequestsList["queryRead"+Table+Query]
	if !ok {
		return errors.New("Missmatch request!")
	}

	s.Row = Requests.RequestsList["queryRead"+Table+Query].QueryRow(values...)

	return nil
}

//----------------------------------------------------------------------------------------------------------------------
//----READ_ROWS
func (s *Stream) ReadRows(Table, Query string, values ...interface{}) error {
	Guard.RLock(Table)
	defer Guard.RUnlock(Table)

	_, ok := Requests.RequestsList["queryRead"+Table+Query]
	if !ok {
		return errors.New("Missmatch request!")
	}
	var err error
	s.Rows, err = Requests.RequestsList["queryRead"+Table+Query].Query(values...)

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
func (dbr *DBRequests) Delete(Table, Query string, values ...interface{}) error {
	Guard.Lock(Table)
	defer Guard.Unlock(Table)

	_, ok := dbr.RequestsList["execDelete"+Table+Query+Table+Query]
	if !ok {
		return errors.New("Mismatch request!")
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Stmt(dbr.RequestsList["execDelete"+Table+Query]).Exec(values...)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

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
	g.Order = &sync.RWMutex{}
	g.OrderCustomer = &sync.RWMutex{}
	g.OrderList = &sync.RWMutex{}
	g.OrderPersonal = &sync.RWMutex{}
	g.OrderPayments = &sync.RWMutex{}
	g.OrderStatus = &sync.RWMutex{}
	g.TimersCook = &sync.RWMutex{}
	g.Status = &sync.RWMutex{}
	g.TypePayment = &sync.RWMutex{}
	g.Cashbox = &sync.RWMutex{}
	g.DefaultGuard = &sync.RWMutex{}
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
