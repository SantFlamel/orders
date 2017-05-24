package structures

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"project/orders/conf"
	"project/orders/controller"
	"strconv"
	"strings"
	"time"
)

//type ClientsMapsWebSock struct{}

func messageToWebSoc(qm *QueryMessage, values ...interface{}) {
	var err error

	stream := controller.Stream{}
	err = stream.ReadRow("Order", "ValueStringOrgHash", values[0])
	if err == nil {
		cl := ClientList
		qms := QueryMessage{}
		qms.Table = qm.Table
		qms.Query = qm.Query
		qms.TypeParameter = qm.TypeParameter
		qms.Values = values
		err = stream.Row.Scan(&qms.ID_msg)
		if err == nil {
			msg, err := json.Marshal(qms)
			//sarr := strings.Split(string(msg),"[")
			//sarr2 := strings.Split(sarr[1],"]")
			//st := strings.Replace(sarr[0],"\"","",-1)
			//var hash_org string
			//stream.Row.Scan(&hash_org)
			if err == nil {
				msg = append([]byte("02:{"), msg...)
				for _, conn := range cl {
					println("messageToWebSoc: ", string(msg))
					conn.Send <- msg
				}
			}
		}
	}

	if err != nil {
		log.Println(err.Error())
	}
}

func messageToWebSocWithHashOrg(qm *QueryMessage, orghash string, values ...interface{}) {
	qms := QueryMessage{}
	qms.ID_msg = orghash
	qms.Table = qm.Table
	qms.Query = qm.Query
	qms.TypeParameter = qm.TypeParameter
	qms.Values = values
	msg, err := json.Marshal(qms)
	if err == nil {
		msg = append([]byte("02:{"), msg...)
		for _, ss := range ClientList {
			ss.Send <- msg
		}
	}
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----FUNCTION_FOR_ALL
func (*All) Update(qm *QueryMessage) error {
	mng := controller.Manager{}
	println("UPDATE", qm.Table, fmt.Sprint(qm.TypeParameter))
	err := mng.Update(qm.Table, qm.TypeParameter, qm.Values...)

	if err == nil {
		if qm.Table == "OrderList" && qm.TypeParameter == "Finished" {
			if len(qm.Values) < 2 {
				return err
			}
			s := controller.Stream{}
			err2 := s.ReadRow("OrderList", "ValueNumberGetIDParent", qm.Values[0], qm.Values[1])
			if err2 == nil {
				var parent int
				err2 = s.Row.Scan(&parent)
				if err2 == nil {
					err2 = s.ReadRow("OrderList", "ValueNumberCountFinishedForOrderAndParent", qm.Values[0], parent, false)
					if err2 == nil {
						err2 = s.Row.Scan(&parent)
						if err2 == nil && parent == 0 {
							m := controller.Manager{}
							err2 = m.Insert("OrderStatus", "", qm.Values[0], 0, "", 8, "system", time.Now())
							if err2 == nil {
								messageToWebSoc(qm, qm.Values[0], 0, 8, time.Now())
							}
						}
					}
				}
			}
			if err2 != nil {
				log.Println("UPDATE -", err2)
			}
		}
	}

	return err
}

func (*Read) Read(qm *QueryMessage) (*controller.Stream, error) {

	stream := &controller.Stream{}
	var err error

	if len(qm.TypeParameter) < 5 {
		return stream, errors.New("length word does not satisfy the requirements of")
	}

	switch qm.TypeParameter[:5] {
	case "Value":
		err = stream.ReadRow(qm.Table, qm.TypeParameter, qm.Values...)
		if err != nil {
			return stream, err
		}
	case "Range":
		if qm.Limit > 0 {
			qm.Values = append(qm.Values, qm.Limit, qm.Offset)
			err = stream.ReadRows(qm.Table, qm.TypeParameter, qm.Values...)
			if err != nil {
				return stream, err
			}
		} else {
			err = stream.ReadRows(qm.Table, qm.TypeParameter, qm.Values...)
			if err != nil {
				return stream, err
			}
		}
	default:
		return stream, errors.New("NOT IDENTIFICATION TYPE PARAMETERS")
	}

	return stream, nil
}

func (*All) Delete(qm *QueryMessage) error {
	mng := controller.Manager{}
	err := mng.Delete(qm.Table, qm.TypeParameter, qm.Values...)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER
func (or *Order) Insert(qm *QueryMessage) (int64, error) {

	mng := controller.Manager{}
	row, err := mng.InsertGetID(qm.Table, qm.TypeParameter,
		or.SideOrder, or.TimeDelivery, or.DatePreOrderCook, or.CountPerson,
		or.Division, or.NameStorage, or.OrgHash, or.Note, or.DiscountName, or.DiscountPercent,
		or.Bonus, or.Type, or.Price, or.PriceWithDiscount, or.PriceCurrency, or.TypePayments, time.Now(), false)
	if err != nil {
		return -1, err
	}

	err = row.Scan(&or.ID)
	if err != nil {
		messageToWebSoc(qm, or.ID)
		return -1, err
	}

	messageToWebSoc(qm, or.ID)

	return or.ID, err
}

func (or *Order) ReadRow(row *sql.Row) error {
	err := row.Scan(&or.ID, &or.SideOrder, &or.TimeDelivery, &or.DatePreOrderCook, &or.CountPerson,
		&or.Division, &or.NameStorage, &or.OrgHash, &or.Note, &or.DiscountName, &or.DiscountPercent,
		&or.Bonus, &or.Type, &or.Price, &or.PriceWithDiscount, &or.PriceCurrency, &or.TypePayments, &or.Order_time, &or.Paid_off,
	)
	return err
}

func (or *Order) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&or.ID, &or.SideOrder, &or.TimeDelivery, &or.DatePreOrderCook, &or.CountPerson,
		&or.Division, &or.NameStorage, &or.OrgHash, &or.Note, &or.DiscountName, &or.DiscountPercent,
		&or.Bonus, &or.Type, &or.Price, &or.PriceWithDiscount, &or.PriceCurrency, &or.TypePayments, &or.Order_time, &or.Paid_off,
	)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_CUSTOMER
func (oc *OrderCustomer) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}

	err := mng.Insert(
		qm.Table, qm.TypeParameter,
		oc.Order_id, oc.NameCustomer, oc.Phone, oc.Note,
		oc.City, oc.Street, oc.House, oc.Building,
		oc.Floor, oc.Apartment, oc.Entrance,
		oc.DoorphoneCode,
	)

	messageToWebSoc(qm, oc.Order_id)

	return -1, err
}

func (oc *OrderCustomer) ReadRow(row *sql.Row) error {
	err := row.Scan(
		&oc.Order_id, &oc.NameCustomer, &oc.Phone, &oc.Note,
		&oc.City, &oc.Street, &oc.House, &oc.Building,
		&oc.Floor, &oc.Apartment, &oc.Entrance,
		&oc.DoorphoneCode,
	)
	return err
}

func (oc *OrderCustomer) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(
		&oc.Order_id, &oc.NameCustomer, &oc.Phone, &oc.Note,
		&oc.City, &oc.Street, &oc.House, &oc.Building,
		&oc.Floor, &oc.Apartment, &oc.Entrance,
		&oc.DoorphoneCode,
	)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_LIST
func (orl *OrderList) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	row, err := mng.InsertGetID(
		qm.Table, qm.TypeParameter,
		orl.Order_id, orl.ID_parent_item,
		orl.Price_id, orl.PriceName, orl.Type_id, orl.TypeName, orl.Parent_id, orl.ParentName,
		orl.Image, orl.Units, orl.Value, orl.Set, orl.DiscountName, orl.DiscountPercent,
		orl.Price, orl.CookingTracker, orl.TimeCook, orl.TimeFry,
		orl.Composition, orl.Additionally, orl.Packaging,
	)
	messageToWebSoc(qm, orl.Order_id, orl.ID_item)
	//----ЕСЛИ ЭТО СЕТ ТО ОБРАЩАЕМСЯ К МИКРОСЕРВИСУ ПРОДУКТОВ
	if err == nil {
		err = row.Scan(&orl.ID_item)
		if err == nil {
			cop := ClientOrder{
				IP:  conf.Config.TLS_serv_product,
				MSG: []byte("{\"Table\":\"ProductOrder\",\"Query\":\"Read\",\"TypeParameter\":\"Price_id\",\"Values\":[" + fmt.Sprintf("%v", orl.Price_id) + "]}"),
			}
			err2 := cop.Write()
			if err2 == nil {
				var n int
				buf := make([]byte, 9999)
				var row2 *sql.Row
				var ol OrderList
				for {
					//n, err2 = cop.Conn.Read(buf)
					//if err==nil {
					//	n, err2 = strconv.Atoi(string(buf))
					//	if err == nil {
					//		buf = make([]byte, n)
					//		n, err2 = io.ReadFull(cop.Conn, buf)
					//	}
					//}

					buf, n, err2 = cop.Read()

					if err2 == nil {
						if strings.ToUpper(strings.TrimSpace(string(buf[:n]))) == "01:EOF" {
							break
						}
						//buf = make([]byte, 4)

						err2 = json.Unmarshal(buf[3:n], &ol)
						if err2 == nil {
							ol.Order_id = orl.Order_id
							ol.ID_parent_item = orl.ID_item
							fmt.Sprintf("%v", ol)
							row2, err2 = mng.InsertGetID(
								qm.Table, qm.TypeParameter,
								ol.Order_id, ol.ID_parent_item,
								ol.Price_id, ol.PriceName, ol.Type_id, ol.TypeName,
								ol.Parent_id, ol.ParentName,
								ol.Image, ol.Units, ol.Value, ol.Set, ol.DiscountName, 100, //ol.DiscountPercent,
								//            CookingTracker
								ol.Price, ol.CookingTracker, ol.TimeCook, ol.TimeFry, ol.Composition, ol.Additionally, ol.Packaging,
							)
							if err2 == nil {
								err2 = row2.Scan(&ol.ID_item)
								if err2 == nil {
									var msg []byte
									if msg, err2 = json.Marshal(ol); err2 == nil {
										if qmsg, errs := json.Marshal(qm); errs == nil {
											msg = append(qmsg, msg...)
											//for _, item := range conf.Config.TLS_serv_reader {
											//	ClientOrder := ClientOrder{IP: item, MSG: msg}
											//	go ClientOrder.Write()
											//}
											messageToWebSoc(qm, orl.Order_id, ol.ID_item)
										}
									}
								}
							}
						}
					}
					if err2 != nil {
						println("ERROR=================================")
						println(err2.Error())
					}

				}
			}
			if err2 != nil {
				//log.Println(err2.Error())
				log.Println(err2.Error())
				err2 = nil
			}
		}
	}
	if err != nil {
		return int64(-1), err
	}

	return orl.ID_item, err
}

func (orl *OrderList) ReadRow(row *sql.Row) error {
	err := row.Scan(
		&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
		&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
		&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
		&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
		&orl.Composition, &orl.Additionally, &orl.Packaging,
	)
	return err
}

func (orl *OrderList) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(
		&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
		&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
		&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
		&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
		&orl.Composition, &orl.Additionally, &orl.Packaging,
	)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_PERSONAL
func (op *OrderPersonal) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	err := mng.Insert(
		qm.Table, qm.TypeParameter,
		op.Order_id, op.Order_id_item, op.UserHash,
		op.FirstName, op.SecondName, op.SurName,
		op.RoleHash, op.RoleName,
	)

	messageToWebSoc(qm, op.Order_id, op.Order_id_item, op.UserHash, op.RoleHash)

	return int64(-1), err
}
func (op *OrderPersonal) ReadRow(row *sql.Row) error {
	row.Scan(&op.Order_id, &op.Order_id_item, &op.UserHash,
		&op.FirstName, &op.SecondName, &op.SurName,
		&op.RoleHash, &op.RoleName)
	return nil
}

func (op *OrderPersonal) ReadRows(rows *sql.Rows) error {
	rows.Scan(&op.Order_id, &op.Order_id_item, &op.UserHash,
		&op.FirstName, &op.SecondName, &op.SurName,
		&op.RoleHash, &op.RoleName)
	return nil
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_PAYMENTS
func (op *OrderPayments) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	err := mng.Insert(
		qm.Table, qm.TypeParameter,
		op.Order_id, op.UserHash, op.TypePayments, op.Price, op.Time,
	)
	messageToWebSoc(qm, op.Order_id)

	return int64(-1), err
}
func (op *OrderPayments) ReadRow(row *sql.Row) error {
	err := row.Scan(&op.Order_id, &op.UserHash, &op.TypePayments, &op.Price, &op.Time)

	return err
}

func (op *OrderPayments) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&op.Order_id, &op.UserHash, &op.TypePayments, &op.Price, &op.Time)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ORDER_STATUS
func (os *OrderStatus) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	var err error

	if qm.TypeParameter == "" {
		err = mng.Insert(
			qm.Table, qm.TypeParameter,
			os.Order_id, os.Order_id_item, os.Cause,
			os.Status_id, os.UserHash, time.Now(),
		)
	} else {
		var row *sql.Row
		row, err = mng.InsertGetID(
			qm.Table, qm.TypeParameter,
			os.Order_id, os.Order_id_item, os.Cause,
			os.Status_id, os.UserHash, time.Now(),
		)

		var i int64
		err = row.Scan(&i)
		if i == 0 {
			messageToWebSoc(qm, os.Order_id, os.Order_id_item, os.Status_id)
			return -1, errors.New("This status is already set by the user")
		}
	}
	if os.Status_id == 8 {
		s := controller.Stream{}
		var zero int
		err2 := s.ReadRow("OrderList", "ValueNumberCountFinishedForOrder", os.Order_id, false)
		if err2 == nil {
			err2 = s.Row.Scan(&zero)
			if err2 == nil && zero == 0 {
				err2 := s.ReadRows("OrderList", "RangeOrderID", os.Order_id)
				if err2 == nil {
					ol := OrderList{}
					var row2 *sql.Row
					var id8 int
					for s.Rows.Next() {
						err2 = ol.ReadRows(s.Rows)
						if err2 == nil {
							row2, err2 = mng.InsertGetID(
								qm.Table, qm.TypeParameter,
								os.Order_id, ol.ID_item, "",
								8, "system", time.Now(),
							)
							if err2 == nil {
								err2 = row2.Scan(&id8)
								if err2 == nil {
									messageToWebSoc(qm, os.Order_id, ol.ID_item, 8)
								}
							}
						}
					}
					row2, err2 = mng.InsertGetID(
						qm.Table, qm.TypeParameter,
						os.Order_id, 0, "",
						8, "system", time.Now(),
					)
					if err2 == nil {
						err2 = row2.Scan(&id8)
						if err2 == nil {
							messageToWebSoc(qm, os.Order_id, 0, 8)
						}
					}
				}
			}
		}
	}

	if os.Status_id == 14 {
		err2 := mng.Insert(
			qm.Table, qm.TypeParameter,
			os.Order_id, 0, os.Cause,
			os.Status_id, os.UserHash, time.Now(),
		)
		if err2 != nil {
			messageToWebSoc(qm, os.Order_id, 0, os.Status_id, time.Now())
		}
		s := controller.Stream{}
		err2 = s.ReadRows("OrderList", "Value", os.Order_id, os.Order_id_item)
		if err2 == nil {
			orl := OrderList{}
			err2 = s.Rows.Scan(
				&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
				&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
				&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
				&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
				&orl.Composition, &orl.Additionally, &orl.Packaging,
			)
			if err2 == nil {
				err2 = mng.Insert(
					qm.Table, qm.TypeParameter,
					os.Order_id, orl.ID_item, os.Cause,
					8, os.UserHash, time.Now(),
				)
				if err2 != nil {
					messageToWebSoc(qm, os.Order_id, 0, os.Status_id, time.Now())
				}
			}
		}
	}

	if err != nil {
		println("================================")
		println("================================")
		println("================================")
		println(err.Error())

	}
	messageToWebSoc(qm, os.Order_id, os.Order_id_item, os.Status_id, time.Now())

	if os.Status_id == 9 && os.Order_id_item == 0 {
		println("Status_id == 9 && Order_id_item == 0")
		s := controller.Stream{}
		err2 := s.ReadRow("Order", "ValueStringType", os.Order_id)
		if err2 == nil {
			println("err2 := s.ReadRow")
			var Types string
			err2 = s.Row.Scan(&Types)
			println("Types", Types)
			if strings.ToLower(Types) == "доставка" {
				println("strings.ToLower(Types)")
				err2 := s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
				if err2 == nil {
					println("s.ReadRow")
					var org_hash string
					err2 = s.Row.Scan(&org_hash)
					if err2 == nil {
						println("s.Row.Scan(&org_hash)")
						co := ClientOrder{IP: conf.Config.TLS_serv_session}
						co.MSG = []byte("{\"Table\":\"SessionInfo\"," +
							"\"Query\":\"Read\"," +
							"\"TypeParameter\":\"OnOrganizationHashRoleHash\"," +
							"\"Values\":[\"" + org_hash + "\",\"" + conf.Config.HashCourier + "\"]}")
						err2 = co.Write()
						if err2 == nil {
							var listen []byte
							var n int
							s := Session{}
							var as []Session
							for {
								listen = make([]byte, 9999)
								//n, err2 = co.Conn.Read(listen)
								//if err==nil {
								//	n, err2 = strconv.Atoi(string(listen))
								//	if err == nil {
								//		listen = make([]byte, n)
								//		n, err2 = io.ReadFull(co.Conn, listen)
								//	}
								//}
								listen, n, err2 = co.Read()
								if err2 != nil {
									break
								}

								if strings.ToUpper(strings.TrimSpace(string(listen[:n]))) == "01:EOF" {
									break
								}
								println("listen[:n]", string(listen[:n]))
								err2 = json.Unmarshal(listen[3:n], &s)
								if err2 == nil {
									as = append(as, s)
								}

							}

							var m map[string]CurierInfo
							m = make(map[string]CurierInfo)
							var f float64
							var t time.Time
							var maxi int
							stream := controller.Stream{}
							for _, ss := range as {
								//time|distance|status
								println(ss.SessionData)
								ars := strings.Split(ss.SessionData, "|")
								if len(ars) < 4 {
									continue
								}
								f, err2 = strconv.ParseFloat(ars[1], 64)
								if err2 == nil {
									if ars[2] == "true" {
										err2 = stream.ReadRow("OrderStatus", "ValueTimeEndActiveForUserHash", ss.UserHash)
										if err2 == nil {
											t = time.Now()
										}

										err2 = stream.Row.Scan(&t)
										if err2 != nil {
											println("Println:", err2.Error())
											t = time.Now()
										}
										maxi, err2 = strconv.Atoi(ars[3])
										if err2 == nil {
											println(maxi)
											m[ss.UserHash] = CurierInfo{ss: ss, Distance: f, Free: true, MaxOrder: maxi, LastActiveTime: t}
										}
									}
								}
							}
							var minF float64
							minF = math.MaxFloat64
							t = time.Now()
							var se string
							var imax int
							for ss, f := range m {
								err2 = stream.ReadRow("OrderPersonal", "ValueNumberCountEmployment", f.ss.UserHash, time.Now().Format("2006-01-02"))
								if err2 == nil {
									err2 = stream.Row.Scan(&imax)
									if err2 == nil {
										println("imax", imax)
										println("f.Distance < minF", f.Distance < minF)
										println("f.Distance < 1000", f.Distance < 1000)
										//println("f.LastActiveTime.Unix() <= t.Unix()", f.LastActiveTime.Unix(), t.Unix(), f.LastActiveTime.Unix() < t.Unix())
										println("f.Distance < minF", f.Distance, minF, f.Distance < minF)
										println("imax<f.MaxOrder", imax, f.MaxOrder, imax < f.MaxOrder)
										//println(f.Distance < minF && f.Distance < 1000 && f.LastActiveTime.Unix() < t.Unix() && imax < f.MaxOrder)
										println(f.Distance < minF && f.Distance < 1000 && imax < f.MaxOrder)

										//if f.Distance < minF && f.Distance < 1000 && f.LastActiveTime.Unix() <= t.Unix() && imax < f.MaxOrder {
										if f.Distance < minF && f.Distance < 1000 && imax < f.MaxOrder {
											println("Прошел проверку", ss)
											minF = f.Distance
											t = f.LastActiveTime
											se = ss
										}
									}
								}
								if err2 != nil {
									println("FOR GET KURYER", err.Error())
								}
							}
							println("for _, ss := range as {")
							for _, ss := range as {
								if ss.UserHash == se {
									println("Назначили курьера:", se)
									err2 = mng.Insert(
										"OrderPersonal", "",
										os.Order_id, os.Order_id_item, ss.UserHash,
										ss.FirstName, ss.SecondName, ss.SurName,
										ss.RoleHash, ss.RoleName,
									)
									if err2 != nil {
										println("===========================")
										println("===========================")
										println("===========================")
										println("===========================")
										println(err2.Error())

									}
								}
							}
						}
					}
				}
			}
		}
	}

	if os.Status_id == 11 && os.Order_id_item == 0 {
		var s controller.Stream
		err2 := s.ReadRows("OrderList", "RangeOrderID", os.Order_id)
		if err2 == nil {
			orl := OrderList{}
			for s.Rows.Next() {
				println("for c.Rows.Next() {")
				err2 = orl.ReadRows(s.Rows)
				if err2 == nil {
					err2 = s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
					if err2 == nil {
						var org_hash string
						err2 = s.Row.Scan(&org_hash)
						if err2 == nil {
							//отправляем запрос на склад для списания
							t := time.Now()

							/*
							   Date time.Time
							   DateStr string
							   NameSklad string
							   OrgHash string
							   OrderID int64
							   Composition []ComprositionRashod
							   Product pq.Int64Array //Массив id на блюда
							   ProductName pq.StringArray //Название блюда
							   Operator string
							*/

							c := ClientOrder{IP: conf.Config.TLS_serv_sklad,
								MSG: []byte("{\"Table\":\"Rashod\",\"Query\":\"Create\"}" +
									"{\"Date\":\"" + t.String()[:10] + "T" + t.String()[11:19] + "Z\"" +
									//",\"NameSklad\":\""+org_hash+"\"" +
									",\"NameSklad\":\"Sklad\"" +
									",\"OrgHash\":\"" + org_hash + "\"" +
									",\"OrderID\":" + strconv.FormatInt(os.Order_id, 10) +
									",\"Product\":[" + strconv.FormatInt(orl.Price_id, 10) +
									"],\"ProductName\":[\"" + orl.PriceName + "\"]" +
									//",\"Operator\":\"operator\"}"),
									",\"Operator\":\"" + os.UserHash + "\"}"),
							}
							c.Write()
							bs := make([]byte, 9999)
							//c.Conn.Read(bs)
							var n int
							//n, err2 = c.Conn.Read(bs)
							//if err==nil {
							//	n, err2 = strconv.Atoi(string(bs))
							//	if err == nil {
							//		bs = make([]byte, n)
							//		n, err2 = io.ReadFull(c.Conn, bs)
							//	}
							//}
							bs, n, err2 = c.Read()
							println("c.Conn.Read(bs)", string(bs[:n]))

						}
					}
				}
			}
		}
		s.Rows.Close()
	}

	if err == nil {
		if (os.Status_id == 15 || os.Status_id == 14 || os.Status_id == 5) && os.Order_id_item > 0 {
			println("--Если отменен со списанием или приготовлен или на переделке тогда отправляем на склад списать")
			//Если отменен со списанием или приготовлен или на переделке тогда отправляем на склад списать
			s := controller.Stream{}
			//читаем хеш организации
			err2 := s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
			if err2 == nil {
				var org_hash string
				err2 = s.Row.Scan(&org_hash)
				if err2 == nil {
					//Читаем элемент заказа
					err2 = s.ReadRows("OrderList", "Value", os.Order_id, os.Order_id_item)
					if err2 == nil {
						orl := OrderList{}
						err2 = s.Rows.Scan(
							&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
							&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
							&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
							&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
							&orl.Composition, &orl.Additionally, &orl.Packaging,
						)
						if err2 == nil {
							err2 = s.ReadRow("OrderStatus", "ValueNumberIDOrdIDit",
								os.Order_id, orl.ID_item,
							)
							if err2 == nil {
								var status_id int64
								s.Row.Scan(&status_id)
								if status_id != int64(15) && status_id != int64(16) {
									oPer := OrderPersonal{}
									err2 = s.ReadRow("OrderPersonal", "Value", os.Order_id, os.Order_id_item, os.UserHash)

									if err2 == nil {
										err2 = s.Row.Scan(&oPer.Order_id, &oPer.Order_id_item, &oPer.UserHash, &oPer.FirstName, &oPer.SecondName, &oPer.SurName, &oPer.RoleHash, &oPer.RoleName)
										if err2 == nil {
											//отправляем запрос на склад для списания
											t := time.Now()
											c := ClientOrder{IP: conf.Config.TLS_serv_sklad,
												MSG: []byte("{\"Table\":\"Rashod\",\"Query\":\"Create\"}" +
													"{\"Date\":\"" + t.String()[:10] + "T" + t.String()[11:19] + "Z\"" +
													",\"NameSklad\":" + org_hash +
													",\"NumberZakaz\":" + strconv.FormatInt(os.Order_id, 10) +
													",\"Product\":" + strconv.FormatInt(orl.Price_id, 10) +
													",\"ProductName\":" + orl.PriceName +
													",\"Operator\":\"" + os.UserHash + "\"" +
													",\"OperatorName \":\"" + oPer.FirstName + " " + oPer.SurName + "\"}"),
											}
											go c.Write()
										}
									}
								}
							}
						}
					}
				}
			}
			if err2 != nil {
				//log.Println("SEND SKLAD", err2)
				log.Println("SEND SKLAD", err2)
			}
		} else if (os.Status_id == 15 || os.Status_id == 16) && os.Order_id_item == 0 {
			//Если отменен без списания смотрим что готовится и отправляем списать
			println("--+++++++++++++++++++++++++++++++++++++++++++")
			println("--+++++++++++++++++++++++++++++++++++++++++++")
			println("--+++++++++++++++++++++++++++++++++++++++++++")
			println("--+++++++++++++++++++++++++++++++++++++++++++")
			println("--Если отменен без списания смотрим что готовится и отправляем списать")

			var s controller.Stream
			err2 := s.ReadRows("OrderList", "RangeOrderID", os.Order_id)
			if err2 == nil {
				orl := OrderList{}
				for s.Rows.Next() {
					println("for c.Rows.Next() {")
					err2 = orl.ReadRows(s.Rows)
					if err2 == nil {
						err2 = s.ReadRow("OrderStatus", "ValueNumberIDOrdIDit",
							os.Order_id, orl.ID_item,
						)
						var status_id int64
						s.Row.Scan(&status_id)
						if status_id == int64(15) || status_id == int64(16) {
							continue
						}
						println("c.Row.Scan(&status_id)")
						if err2 == nil {
							if orl.TimeCook == 0 {
								mng.Insert("OrderStatus", "",
									os.Order_id, orl.ID_item, "", 16, "system", time.Now(),
								)
							} else {
								println("Время готовки не равно нулю поэтому проверяем последний статус")

								if status_id < int64(4) {
									println("Статус меньше 4 поэтому ставим без списания")
									err2 = mng.Insert("OrderStatus", "FromSklad",
										os.Order_id, orl.ID_item, "", 16, "system", time.Now(),
									)
									messageToWebSoc(qm, os.Order_id, orl.ID_item, 16, time.Now())
								} else {
									println("Статус больше 3 поэтому ставим списание")
									err2 = mng.Insert("OrderStatus", "FromSklad",
										os.Order_id, orl.ID_item, "", 15, "system", time.Now(),
									)
									messageToWebSoc(qm, os.Order_id, orl.ID_item, 15, time.Now())
									if err2 == nil {
										err2 = s.ReadRow("Order", "ValueStringOrgHash", os.Order_id)
										if err2 == nil {
											var org_hash string
											err2 = s.Row.Scan(&org_hash)
											if err2 == nil {
												//отправляем запрос на склад для списания
												t := time.Now()

												/*
												   Date time.Time
												   DateStr string
												   NameSklad string
												   OrgHash string
												   OrderID int64
												   Composition []ComprositionRashod
												   Product pq.Int64Array //Массив id на блюда
												   ProductName pq.StringArray //Название блюда
												   Operator string
												*/

												c := ClientOrder{IP: conf.Config.TLS_serv_sklad,
													MSG: []byte("{\"Table\":\"Rashod\",\"Query\":\"Create\"}" +
														"{\"Date\":\"" + t.String()[:10] + "T" + t.String()[11:19] + "Z\"" +
														//",\"NameSklad\":\""+org_hash+"\"" +
														",\"NameSklad\":\"Sklad\"" +
														",\"OrgHash\":\"" + org_hash + "\"" +
														",\"OrderID\":" + strconv.FormatInt(os.Order_id, 10) +
														",\"Product\":[" + strconv.FormatInt(orl.Price_id, 10) +
														"],\"ProductName\":[\"" + orl.PriceName + "\"]" +
														//",\"Operator\":\"operator\"}"),
														",\"Operator\":\"" + os.UserHash + "\"}"),
												}
												c.Write()
												bs := make([]byte, 9999)
												//c.Conn.Read(bs)
												var n int
												//n, err2 = c.Conn.Read(bs)
												//if err==nil {
												//	n, err2 = strconv.Atoi(string(bs))
												//	if err == nil {
												//		bs = make([]byte, n)
												//		n, err2 = io.ReadFull(c.Conn, bs)
												//	}
												//}
												bs, n, err2 = c.Read()
												println("c.Conn.Read(bs)", string(bs[:n]))

											}
										}
									}
								}
							}
						}
					}
				}
			}
			s.Rows.Close()
		}
	}

	return int64(-1), err
}

func (os *OrderStatus) ReadRow(row *sql.Row) error {
	err := row.Scan(&os.ID, &os.Order_id, &os.Order_id_item, &os.Cause,
		&os.Status_id, &os.UserHash, &os.Time)
	return err
}

func (os *OrderStatus) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&os.ID, &os.Order_id, &os.Order_id_item, &os.Cause,
		&os.Status_id, &os.UserHash, &os.Time)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----STATUS
func (s *Status) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	err := mng.Insert(qm.Table, qm.TypeParameter, s.Name)

	messageToWebSoc(qm)

	return int64(-1), err
}

func (s *Status) ReadRow(row *sql.Row) error {
	err := row.Scan(&s.ID, &s.Name)
	return err
}

func (s *Status) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&s.ID, &s.Name)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----TypePayment
func (tp *TypePayment) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	err := mng.Insert(qm.Table, qm.TypeParameter, tp.Name)

	messageToWebSoc(qm)

	return int64(-1), err
}

func (tp *TypePayment) ReadRow(row *sql.Row) error {
	err := row.Scan(&tp.ID, &tp.Name)
	return err
}

func (tp *TypePayment) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&tp.ID, &tp.Name)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----TimersCook
func (tc *TimersCook) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	t := time.Now()
	err := mng.Insert(qm.Table, qm.TypeParameter, tc.Order_id, tc.Order_id_item, t, tc.Time_end, false)
	//qm.Values = append(qm.Values, tc.Order_id)
	messageToWebSoc(qm, tc.Order_id, tc.Order_id_item, t)

	return int64(-1), err
}

func (tc *TimersCook) ReadRow(row *sql.Row) error {
	err := row.Scan(&tc.Order_id, &tc.Order_id_item, &tc.Time_begin, &tc.Time_end, &tc.Count, &tc.Finished)
	return err
}

func (tc *TimersCook) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&tc.Order_id, &tc.Order_id_item, &tc.Time_begin, &tc.Time_end, &tc.Count, &tc.Finished)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----CASH_BOX
func (c *Cashbox) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	row, err := mng.InsertGetID(qm.Table, qm.TypeParameter, c.Order_id, c.Change_employee_id,
		c.First_sure_name, c.UserHash, c.RoleName, c.OrgHash, c.TypePayments, c.TypeOperation,
		c.Deposit, c.ShortChange, c.Cause, time.Now())
	if err == nil {
		err = row.Scan(&c.ID)
		if err == nil {
			messageToWebSocWithHashOrg(qm, c.OrgHash, c.ID, c.Order_id)
			p := CHPrint{}
			go p.Printer(c.ID)

			return c.ID, err
		}
	}

	return int64(-1), err
}

func (c *Cashbox) ReadRow(row *sql.Row) error {
	err := row.Scan(&c.ID, &c.Order_id, &c.Change_employee_id,
		&c.First_sure_name, &c.UserHash, &c.RoleName, &c.OrgHash, &c.TypePayments, &c.TypeOperation,
		&c.Deposit, &c.ShortChange, &c.Cause, &c.TimeOperation)
	return err
}

func (c *Cashbox) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&c.ID, &c.Order_id, &c.Change_employee_id,
		&c.First_sure_name, &c.UserHash, &c.RoleName, &c.OrgHash, &c.TypePayments, &c.TypeOperation,
		&c.Deposit, &c.ShortChange, &c.Cause, &c.TimeOperation)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----ChangeEmployee
func (ce *ChangeEmployee) Insert(qm *QueryMessage) (int64, error) {
	mng := controller.Manager{}
	row, err := mng.InsertGetID(qm.Table, qm.TypeParameter, ce.UserHash, ce.OrgHash,
		ce.Sum_in_cashbox, ce.NonCash_end_day, ce.Cash_end_day, ce.Close, time.Now(), ce.Date_end,
	)
	if err == nil {
		err = row.Scan(&ce.ID)
		if err == nil {
			return ce.ID, err
		}
	}

	return int64(-1), err
}

func (ce *ChangeEmployee) ReadRow(row *sql.Row) error {
	err := row.Scan(&ce.ID, &ce.UserHash, &ce.OrgHash,
		&ce.Sum_in_cashbox, &ce.NonCash_end_day, &ce.Cash_end_day, &ce.Close, &ce.Date_begin, &ce.Date_end)
	return err
}

func (ce *ChangeEmployee) ReadRows(rows *sql.Rows) error {
	err := rows.Scan(&ce.ID, &ce.UserHash, &ce.OrgHash,
		&ce.Sum_in_cashbox, &ce.NonCash_end_day, &ce.Cash_end_day, &ce.Close, &ce.Date_begin, &ce.Date_end)
	return err
}

//----------------------------------------------------------------------------------------------------------------------
//----PRINTER
type CHPrint struct {
	sp StructPrintable
}

func (p *CHPrint) init() {
	p.sp.Header = "\n    ДОСТАВКА ЗА 60 МИНУТ ИЛИ БЕСПЛАТНО \n" +
		"опоздаем - подарим сертификат на 600 руб."

	p.sp.InfoOrg = "         СЕТЬ РЕСТОРАНОВ \"ЯПОКИ\"\n " +
		"         OOO \"ВКУС БЕЗ ГРАНИЦ\"\n" +
		"Юр. адрес: 640011, Курган, Крылова, 14" +
		"      8 800 200 200 7 mail@yapoki.ru\n" +
		"     ИНН 4501195365 ОГРН 1144501004383"

	p.sp.Thanks = "            СПАСИБО ЗА ПОКУПКУ!"
	p.sp.Footer = "  Если Вы остались недовольны качеством \n обслуживания, " +
		"позвоните нам по телефону \n  горячей линии 8 800 200 200 7. Звонок \n" +
		"      бесплатный, даже с мобильного!"
}

//func (p *CHPrint) PrintAllRange(userHash string, tBegin, tEnd time.Time) {
func (p *CHPrint) PrintCountPriceWithDiscount(values ...interface{}) error {

	if len(values) < 1 {
		log.Println("CHPrint.PrintAllRange() LENGTH VALUES < 1")
		return errors.New("CHPrint.PrintAllRange() LENGTH VALUES < 1")
	}
	p.init()
	stream := controller.Stream{}
	SumAll := int64(0)
	var Sum int64
	var err error
	p.sp.InfoOrg = p.sp.InfoOrg + "\n\n            ОТЧЕТ СУТОЧНЫЙ!"

	var v1 []interface{}
	for i, val := range values {
		if i == 0 {
			p.sp.OrgHash = fmt.Sprint(val)
		} else {
			v1 = append(v1, val)
		}
	}
	for i, typePay := range DBTypePayment {

		v := v1
		v = append([]interface{}{i}, v1...)

		println(i, typePay)
		if i < 3 {
			p.sp.Body = append(p.sp.Body, "          "+typePay)
			err = stream.ReadRow("Cashbox", "ValueNumberCountPriceWithDiscount", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Внесений:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Positive CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Positive CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSumNegative", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Изъятий:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Negative CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Negative CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSum", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					SumAll += Sum

					p.sp.Body = append(p.sp.Body, "Итого:\t\t"+fmt.Sprint(Sum))

				} else {
					log.Println("CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("CASHBOX CHECK:", err)
				continue
			}
		} else {
			break
		}
		p.sp.Body = append(p.sp.Body, "\n")

	}
	var b []byte
	if err == nil {
		p.sp.Body = append(p.sp.Body, "   ------------------------------------")
		p.sp.Body = append(p.sp.Body, "Всего:\t"+fmt.Sprint(SumAll))

		b, err = json.Marshal(p.sp)
		if err == nil {
			println("---------------------------------------------")
			println("---------------------------------------------")
			println(string(b))
			co := ClientOrder{IP: conf.Config.TLS_serv_printer}
			co.MSG = b
			err = co.Write()
		}
	}

	return err
}

func (p *CHPrint) PrintAllRange(values ...interface{}) error {

	if len(values) < 1 {
		log.Println("CHPrint.PrintAllRange() LENGTH VALUES < 1")
		return errors.New("CHPrint.PrintAllRange() LENGTH VALUES < 1")
	}
	p.init()
	stream := controller.Stream{}
	SumAll := int64(0)
	var Sum int64
	var err error
	p.sp.InfoOrg = p.sp.InfoOrg + "\n\n            ОТЧЕТ СУТОЧНЫЙ!"

	var v1 []interface{}
	for i, val := range values {
		if i == 0 {
			p.sp.OrgHash = fmt.Sprint(val)
		} else {
			v1 = append(v1, val)
		}
	}
	for i, typePay := range DBTypePayment {

		v := v1
		v = append([]interface{}{i}, v1...)

		println(i, typePay)
		if i < 3 {
			p.sp.Body = append(p.sp.Body, "          "+typePay)
			err = stream.ReadRow("Cashbox", "ValueNumberSumPositive", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Внесений:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Positive CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Positive CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSumNegative", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					p.sp.Body = append(p.sp.Body, "Изъятий:\t"+fmt.Sprint(Sum))
				} else {
					log.Println("Negative CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("Negative CASHBOX CHECK:", err)
				continue
			}

			err = stream.ReadRow("Cashbox", "ValueNumberSum", v...)
			if err == nil {
				err = stream.Row.Scan(&Sum)
				if err == nil {
					SumAll += Sum

					p.sp.Body = append(p.sp.Body, "Итого:\t\t"+fmt.Sprint(Sum))

				} else {
					log.Println("CASHBOX CHECK:", err)
					continue
				}
			} else {
				log.Println("CASHBOX CHECK:", err)
				continue
			}
		} else {
			break
		}
		p.sp.Body = append(p.sp.Body, "\n")

	}
	var b []byte
	if err == nil {
		p.sp.Body = append(p.sp.Body, "   ------------------------------------")
		p.sp.Body = append(p.sp.Body, "Всего:\t"+fmt.Sprint(SumAll))

		b, err = json.Marshal(p.sp)
		if err == nil {
			println("---------------------------------------------")
			println("---------------------------------------------")
			println(string(b))
			co := ClientOrder{IP: conf.Config.TLS_serv_printer}
			co.MSG = b
			err = co.Write()
		}
	}
	if err != nil {
		log.Println("CASHBOX CHECK:", err)
	}
	return err
}

//func (p *CHPrint) Printer(id int64) {
func (p *CHPrint) Printer(values ...interface{}) error {
	//if len(values)<1{log.Println("CHPrint.Printer() LENGTH VALUES < 1");return }
	//id, err:=strconv.ParseInt(fmt.Sprint(values[0]), 10, 64)
	//if err != nil {log.Println("CHPrint.Printer()",err);return }
	p.init()
	println("func (p *Print) Printer(id int64) {")
	op := Cashbox{}
	s := controller.Stream{}
	s.ReadRow("Cashbox", "Value", values...)
	err := op.ReadRow(s.Row)
	if err == nil {
		println("+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=")

		if op.Order_id == 0 {
			//sp := StructPrintable{
			//	Header: "    ДОСТАВКА ЗА 60 МИНУТ ИЛИ БЕСПЛАТНО \n" +
			//			"приедем - подарим сертификат на 600 рублей",
			//	InfoOrg: "         СЕТЬ РЕСТОРАНОВ \"ЯПОКИ\"\n " +
			//			"         OOO \"ВКУС БЕЗ ГРАНИЦ\"\n" +
			//			"Юр. адрес: 640011, Курган, Крулова, 14" +
			//			"      8 800 200 200 7 mail@yapoki.ru\n" +
			//			"     ИНН 4501195365 ОГРН 114451004383",
			//	InfoCheck: op.RoleName + ": " + op.First_sure_name + " " + time.Now().String()[:19] + "\n" +
			//			"ДОК:" + fmt.Sprintf("%v", op.ID) + " ЧЕК:" + fmt.Sprintf("%v", op.ID) + "",
			//}
			//
			//sp.Price = fmt.Sprint(op.Deposit)
			//sp.TypeOperation = op.TypeOperation
			//sp.Thanks = "        СПАСИБО ЗА ПОКУПКУ!"
			//sp.Footer = "  Если Вы остались недовольны качеством \n обслуживания, " +
			//		"позвоните нам по телефону \n  горячей линии 8 800 200 200 7. Звонок \n      бесплатный, даже с мобильного!"
			//sp.OrgHash = sp.OrgHash
			//var b []byte
			//b, err = json.Marshal(sp)
			//if err == nil {
			//	println("---------------------------------------------")
			//	println("---------------------------------------------")
			//	println(string(b))
			//	co := ClientOrder{IP: conf.Config.TLS_serv_printer}
			//	co.MSG = b
			//	co.Write()
			//}
		} else {

			var org_hash, discount_name, type_send, note, notecustomer string
			var discount_percent string
			var price, price_currency string
			var price_with_discount float64

			stream := controller.Stream{}
			err = stream.ReadRow("Order", "CheckInfo", op.Order_id)
			if err == nil {
				println("err = stream.ReadRow(\"Order\"", op.Order_id)
				err = stream.Row.Scan(&org_hash, &discount_name, &type_send, &note, &notecustomer, &discount_percent, &price, &price_with_discount, &price_currency)
				if err == nil {
					println("err = stream.Row.Scan")
					err = stream.ReadRows("OrderList", "RangeOrderIDSet", op.Order_id)
					if err == nil {
						println("err = stream.ReadRows(\"OrderList\"")
						p.sp.InfoCheck = op.RoleName + ": " + op.First_sure_name + " " + time.Now().String()[:19] + "\n" +
							"ДОК:" + fmt.Sprintf("%v", op.Order_id) + " ЧЕК:" + fmt.Sprintf("%v", op.Order_id) + ""

						orl := OrderList{}
						var err3 error
						for stream.Rows.Next() {
							err3 = stream.Rows.Scan(&orl.Order_id, &orl.ID_item, &orl.ID_parent_item,
								&orl.Price_id, &orl.PriceName, &orl.Type_id, &orl.TypeName, &orl.Parent_id, &orl.ParentName,
								&orl.Image, &orl.Units, &orl.Value, &orl.Set, &orl.Finished, &orl.DiscountName, &orl.DiscountPercent,
								&orl.Price, &orl.CookingTracker, &orl.TimeCook, &orl.TimeFry,
								&orl.Composition, &orl.Additionally, &orl.Packaging,
							)
							if err3 == nil {
								//p.sp.ItemOrders = append(p.sp.ItemOrders, orl.PriceName+"\t"+fmt.Sprintf("%v", (float64(orl.Price) - (float64(orl.Price) * (float64(orl.DiscountPercent) / 100)))))
								p.sp.Body = append(p.sp.Body, orl.PriceName+"\t"+fmt.Sprintf("%v", (float64(orl.Price)-(float64(orl.Price)*(float64(orl.DiscountPercent)/100))))+" "+price_currency)
							}
						}
						//p.sp.Body = append(p.sp.Body, "   ************************************")
						p.sp.Body = append(p.sp.Body, "   ------------------------------------")
						p.sp.Body = append(p.sp.Body, "Итого:\t"+price+" "+price_currency)
						p.sp.Body = append(p.sp.Body, "Скидка:\t"+discount_name+" "+fmt.Sprint(discount_percent)+"%")

						paid_off := float64(0)
						err = stream.ReadRow("Cashbox", "ValueNumberSumForOrder", op.Order_id)
						if err == nil {
							err = stream.Row.Scan(&paid_off)
							if err == nil {
								paid_off -= op.Deposit
								if paid_off > 0 {
									p.sp.Body = append(p.sp.Body, "Оплачено:\t"+fmt.Sprint(paid_off))
								}
							}
						}
						if err != nil {
							log.Println("Cashbox", err)
							err = nil
						}

						p.sp.Body = append(p.sp.Body, "   ------------------------------------")
						p.sp.Body = append(p.sp.Body, "Итого к оплате:\t"+fmt.Sprint(price_with_discount-paid_off))
						if len(DBTypePayment[op.TypePayments]) > 6 {
							p.sp.Body = append(p.sp.Body, DBTypePayment[op.TypePayments]+":\t"+fmt.Sprint(op.Deposit+op.ShortChange))
						} else {
							p.sp.Body = append(p.sp.Body, DBTypePayment[op.TypePayments]+":\t\t"+fmt.Sprint(op.Deposit+op.ShortChange))
						}
						p.sp.Body = append(p.sp.Body, "Сдача:\t\t"+fmt.Sprint(op.ShortChange))

						//p.sp.Price = price
						//p.sp.Discount = append(p.sp.Discount, "Скидка: "+discount_name+" "+fmt.Sprint(discount_percent))
						//p.sp.PriceWithDiscount = "Итого:\t" + price_with_discount
						//p.sp.PriceCurrency = price_currency
						//p.sp.ShortChange = "Сдача:\t" + fmt.Sprint(op.ShortChange)
						//p.sp.TypePayment = DBTypePayment[op.TypePayments]
						//p.sp.TypeOperation = "Получено:\t" + fmt.Sprint(op.Deposit)
						p.sp.OrgHash = org_hash

                        err2 := stream.ReadRow("OrderCustomer", "Value", op.Order_id)
                        if err2 == nil {
                            println("err2 = oc.ReadRow(stream.Row)")
                            oc := OrderCustomer{}
                            err2 = oc.ReadRow(stream.Row)
                            if err2 == nil {
                                println(1)
                                p.sp.Footer = p.sp.Footer +
                                    "\n   ------------------------------------\n"
                                if oc.Phone != "" && oc.Phone != " " {
                                    p.sp.Footer = p.sp.Footer +
                                            " Телефон: " + oc.Phone
                                    println(6)
                                }

                                if type_send == "Доставка" {
                                    if oc.Street != "" && oc.Street != " " {
                                        p.sp.Footer = p.sp.Footer +
                                                "\nУлица: " + oc.Street
                                        println(2)
                                    }

                                    if oc.House > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                " Дом: " + fmt.Sprint(oc.House)
                                        println(3)
                                    }

                                    if oc.Apartment > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                " Квартира: " + fmt.Sprint(oc.Apartment)
                                        println(3)
                                    }

                                    if oc.Floor > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                " Этаж: " + fmt.Sprint(oc.Floor)
                                        println(3)
                                    }

                                    if oc.Building != "" && oc.Building != " " {
                                        p.sp.Footer = p.sp.Footer +
                                                " Строение: " + oc.Building
                                        println(4)
                                    }

                                    if oc.Entrance > int64(0) {
                                        p.sp.Footer = p.sp.Footer +
                                                "\nПодъезд: " + fmt.Sprint(oc.Entrance)
                                        println(5)
                                    }

                                    if note != "" && note != " " {
                                        p.sp.Footer = p.sp.Footer +
                                                "\n" + note
                                        println(7)
                                    }

                                    if notecustomer != "" && notecustomer != " " {
                                        p.sp.Footer = p.sp.Footer +
                                                "\n" + notecustomer
                                        println(7)
                                    }
                                }
                            }
                        }
                        println(p.sp.Footer)
                        if err2!=nil{
                            println("err2: ", err2.Error())
                        }

						var b []byte
                        p.sp.Footer = p.sp.Footer + "\n\n\n\n\n"
						b, err = json.Marshal(p.sp)
						if err == nil {
							println("---------------------------------------------")
							println("---------------------------------------------")
							println(string(b))
							co := ClientOrder{IP: conf.Config.TLS_serv_printer}
							co.MSG = b
							err = co.Write()
						}
					}
				}
			}
		}
	}

	if err != nil {
		println("Print err:", err.Error())
	}
	return err
}
