package server

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net"
	"project/orders/conf"
	"project/orders/structures"
	"project/orders/webserver"
	"strconv"
	"strings"
)

//======================================================================================================================
//----READ_STREAM_CLIENT


type ClientTLS struct {
	qm         structures.QueryMessage
	row        *sql.Row
	orders     structures.Orders
	message    structures.Message
	Structures structures.Structures
	ID         int64

	conn       net.Conn
}

func (c *ClientTLS) handleClient() {
	reply := make([]byte, 4)
	var lenReply int
	var err error
	defer c.conn.Close()
	//mess := structures.Message{}
	for {

		//----GET LEN MESSAGE AND MESSAGE
		if c.conn == nil {
			break
		}
        //------------------------------------------------
        //----СТАРОЕ
        reply = make([]byte, 4)
        _, err = c.conn.Read(reply)
        if err != nil {
            //log.Println("_, err := conn.Read(reply)")
            //log.Println(conn.RemoteAddr().String(),"-",err.Error(), string(reply))
            break
        }


        if strings.ToUpper(strings.TrimSpace(string(reply)))=="PING" {
            println("-------------- PING --------------")
            c.conn.Write([]byte("0004PONG"))
            continue
        }
        //st := structure{conn:conn}
        lenReply,err = strconv.Atoi(string(reply))
        if err!=nil{
            c.send([]byte(""),err)
            log.Println(1)
            log.Println(c.conn.RemoteAddr().String(),"-",err.Error())
            continue
        }

        println("LENGTH TLS:",lenReply)
        reply = make([]byte, lenReply)
        _,err = io.ReadFull(c.conn,reply)
        if err!=nil{
            c.send([]byte(""),err)
            log.Println(2)
            log.Println(c.conn.RemoteAddr().String(),"-",err.Error())
            continue
        }

        println("GET MESSAGE TLS:",string(reply),len(string(reply)))

        err = c.SelectTables(reply[:lenReply])
        if err != nil {
            c.send([]byte(c.qm.Table + " ERROR " + c.qm.Query + ", TYPE PARAMETERS \"" + c.qm.TypeParameter + "\": "), err)
            log.Println(c.qm.Table,"ERROR",c.qm.Query + ", TYPE PARAMETERS \"" + c.qm.TypeParameter + "\":",err.Error())
        }

        //------------------------------------------------
        //----НОВОЕ

		//reply = make([]byte, 4)
		//_, err = c.conn.Read(reply)
		//if err != nil {
		//	println(err.Error())
		//	//log.Println("_, err := conn.Read(reply)")
		//	//log.Println(conn.RemoteAddr().String(),"-",err.Error(), string(reply))
		//	break
		//}
        //
		//println("-------------------------------------------")
		//if strings.ToUpper(strings.TrimSpace(string(reply))) == "PING" {
		//	println("-------------- PING --------------")
		//	c.conn.Write([]byte("0004PONG"))
		//	continue
		//}
		////st := structure{conn: c.conn}
		//lenReply, err = strconv.Atoi(string(reply))
		//if err != nil {
		//	c.send([]byte(""), err)
		//	println(err.Error(), string(reply))
		//	log.Println(1)
		//	log.Println(c.conn.RemoteAddr().String(), "-", err.Error())
		//	continue
		//}
        //
		//reply = make([]byte, lenReply)
		//_, err = io.ReadFull(c.conn, reply)
		//if err != nil {
		//	c.send([]byte(""), err)
		//	println(err.Error())
		//	log.Println(2)
		//	log.Println(c.conn.RemoteAddr().String(), "-", err.Error())
		//	println(2)
		//	continue
		//}
        //
		//err = json.Unmarshal(reply[:lenReply], &c.message)
        ////println("GET MESSAGE TLS:", string(reply), len(string(reply)))
        //
        //
        //sttr:=structures.StructTransact{Message:&c.message}
        //lenReply,err = sttr.Insert()
		//if err != nil {
		//	c.send ([]byte(""), err)
		//    log.Println("ERROR " + c.message.Query + ": ",err.Error())
		//    println("ERROR " + c.message.Query + ": ",err.Error())
		//}
	}
}

//---------------------------------------------SEND
func (st *ClientTLS) send(sendMessage []byte, err error) {

	var LenMess int
	var errs error
	if len(strings.TrimSpace(string(sendMessage))) == 0 && err==nil{
		sendMessage = append([]byte(""), []byte("00:UNKNOWN ERROR, EMPTY MESSAGE SEND")...)
	} else {
		if err != nil {
			sendMessage,_ = json.Marshal(structures.Message{Error:structures.Error{Code:0,Type:st.message.Query,Description:err.Error()}})
			sendMessage = append([]byte("00:"), sendMessage...)
			//sendMessage = append(sendMessage, []byte(err.Error())...)
		} else {
			sendMessage = append([]byte("01:"), sendMessage...)
		}
	}

	s := strconv.Itoa(len(sendMessage))
	println(len(s))
	if len(s) < 4 {
		for len(s) < 4 {
			s = "0" + s
		}
	}
	sendMessage = append([]byte(s), sendMessage...)
	if st.conn != nil {
		println("Message: \"", string(sendMessage), "\"")
		//LenMess, errs = st.conn.Write(sendMessage)
		LenMess, errs = st.conn.Write(sendMessage)
		//st.Send <- sendMessage
	} else {
		log.Println("st.conn is nill")
	}
	if errs != nil {
		log.Println("00: ERROR THE MESSAGE IS NOT GONE - ", LenMess, st.conn.RemoteAddr().String(), errs)
		println("ERROR THE MESSAGE IS NOT GONE", errs.Error())
		return
	}

	println("The message is gone to " + st.conn.RemoteAddr().String())
	println("--------------------------------")
}

//----END_CLIENT--------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
func init() {
	go webserver.RegisterRoutes()

	//-----------------------------------------
	structures.DBTypePayment = make(map[int64]string)
	structures.DBTypePayment[1] = "Наличные"
	structures.DBTypePayment[2] = "Банковская карта"
	structures.DBTypePayment[3] = "Яндекс деньги"
	structures.DBTypePayment[4] = "WebMoney"
	structures.DBTypePayment[5] = "Bitcoin"

	//----------------------------------------------------------
	//----CERTS
	ca_b, err := ioutil.ReadFile(conf.Config.TLS_pem)
	if err != nil {
		//log.Println("SERVER ERROR READ PEM FILE",err)
		//log.Println("SERVER ERROR READ PEM FILE",err)
		println("SERVER ERROR READ PEM FILE", err)
		panic(err)
		return
	}

	ca, err := x509.ParseCertificate(ca_b)
	if err != nil {
		//log.Println("SERVER ERROR PARSE CERT",err)
		//log.Println("SERVER ERROR PARSE CERT",err)
		println("SERVER ERROR PARSE CERT", err)
		panic(err)
		return
	}

	//----------------------------------------------------------
	//-----REGISTER_CERT_POOL

	pool := x509.NewCertPool()
	pool.AddCert(ca)

	//----------------------------------------------------------
	//----KEY_CERT
	priv_b, err := ioutil.ReadFile(conf.Config.TLS_key)
	if err != nil {
		//log.Println("SERVER ERROR READ KEY FILE",err)
		//log.Println("SERVER ERROR READ KEY FILE",err)
		println("SERVER ERROR READ KEY FILE", err)
		panic(err)
		return
	}

	priv, err := x509.ParsePKCS1PrivateKey(priv_b)
	if err != nil {
		//log.Println("SERVER ERROR PARSE PRIVATE KEY",err)
		//log.Println("SERVER ERROR PARSE PRIVATE KEY",err)
		println("SERVER ERROR PARSE PRIVATE KEY", err)
		panic(err)
		return
	}

	//----------------------------------------------------------
	//----CREATE_CERT
	cert := tls.Certificate{
		Certificate: [][]byte{ca_b},
		PrivateKey:  priv,
	}

	//----------------------------------------------------------
	//----CREATE_CONFIG
	config := tls.Config{
		ClientAuth:   tls.RequireAndVerifyClientCert,
		Certificates: []tls.Certificate{cert},
		ClientCAs:    pool,
	}

	//----------------------------------------------------------
	//----CREATE_LISTENER
	ln, err := tls.Listen("tcp", conf.Config.TLS_server+":"+conf.Config.TLS_port, &config)
	if err != nil {
		//log.Println(err)
		//log.Println(err)
		panic(err)
		return
	}
	defer ln.Close() //----CLOSE_LISTENER

	//Инициализируем логи
	go conf.RecLog()

	println("TLS SERVER RUNNING")

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Println(err)
			//log.Println(err)
			continue
		}
		client := ClientTLS{conn: conn}

		//go handleClient(conn)
		go client.handleClient()

	}

}
